/**
 * 渲染完整报告
 */
function renderReport(result) {
    // 保存到全局状态供页面切换时使用
    window._scanResult = result;

    // 更新扫描路径
    document.getElementById('report-scan-path').textContent = result.scan_path;

    // 第1层：执行摘要
    renderExecutiveSummary(result);

    // 第1层：核心卡片
    const categoryStats = result.category_stats || {};
    const simpleCount = categoryStats.simple_count || 0;
    const mediumCount = categoryStats.medium_count || 0;
    const complexCount = categoryStats.complex_count || 0;
    const ocrCount = (result.ocr_files || []).length;
    const failedCount = (result.review_files || []).length;
    const parsableCount = simpleCount + mediumCount;

    document.getElementById('total-files').textContent = result.total_files.toLocaleString();
    document.getElementById('parsable-count').textContent = parsableCount.toLocaleString();
    document.getElementById('ocr-count').textContent = ocrCount.toLocaleString();
    document.getElementById('failed-count').textContent = failedCount.toLocaleString();

    // 第2层：三档分类
    renderCategoryStats(result);

    // 长度统计简要
    if (result.length_stats) {
        document.getElementById('median-length').textContent = formatNumber(Math.round(result.length_stats.median));
        document.getElementById('p90-length').textContent = formatNumber(Math.round(result.length_stats.p90));
    }

    // 第3层：详细统计
    if (result.length_stats) {
        renderLengthStats(result.length_stats);
    }
    if (result.structure_stats) {
        renderStructureStats(result.structure_stats, result.total_files);
    }

    // 第4层：审核台
    renderReviewSection(result);
}

/**
 * 初始化详细统计页面的图表（页面切换时调用）
 */
function initDetailsCharts() {
    const result = window._scanResult;
    if (!result) return;

    setTimeout(() => {
        initFormatChart(result.format_distribution);
        if (result.pdf_page_stats) {
            initPdfPageTypeChart(result.pdf_page_stats);
        }
        if (result.length_stats) {
            initLengthChart(result.length_stats);
        }
    }, 100);
}

/**
 * 渲染执行摘要
 */
function renderExecutiveSummary(result) {
    const total = result.total_files;
    const categoryStats = result.category_stats || {};
    const simpleCount = categoryStats.simple_count || 0;
    const mediumCount = categoryStats.medium_count || 0;
    const complexCount = categoryStats.complex_count || 0;

    const parsableCount = simpleCount + mediumCount;
    const parsableRatio = total > 0 ? Math.round(parsableCount / total * 100) : 0;

    const ocrCount = (result.ocr_files || []).length;
    const failedCount = (result.review_files || []).length;

    let summaryParts = [`本次扫描 <strong>${total.toLocaleString()}</strong> 份文档。`];

    if (parsableRatio >= 90) {
        summaryParts.push(`<span class="summary-good">✅ ${parsableRatio}% 可解析</span>`);
    } else if (parsableRatio >= 70) {
        summaryParts.push(`<span class="summary-warn">⚠️ ${parsableRatio}% 可解析</span>`);
    } else {
        summaryParts.push(`<span class="summary-bad">❌ 仅 ${parsableRatio}% 可解析</span>`);
    }

    if (ocrCount > 0) {
        summaryParts.push(`<span class="summary-ocr">📷 ${ocrCount}份需OCR</span>`);
    }
    if (failedCount > 0) {
        summaryParts.push(`<span class="summary-fail">❌ ${failedCount}份解析失败</span>`);
    }

    document.getElementById('summary-text').innerHTML = summaryParts.join(' ');
}

/**
 * 渲染三档分类统计
 */
function renderCategoryStats(result) {
    const categoryStats = result.category_stats || {};
    const total = result.total_files || 1;

    const simpleCount = categoryStats.simple_count || 0;
    const mediumCount = categoryStats.medium_count || 0;
    const complexCount = categoryStats.complex_count || 0;

    document.getElementById('simple-count').textContent = simpleCount.toLocaleString();
    document.getElementById('medium-count').textContent = mediumCount.toLocaleString();
    document.getElementById('complex-count').textContent = complexCount.toLocaleString();

    document.getElementById('simple-ratio').textContent = Math.round(simpleCount / total * 100) + '%';
    document.getElementById('medium-ratio').textContent = Math.round(mediumCount / total * 100) + '%';
    document.getElementById('complex-ratio').textContent = Math.round(complexCount / total * 100) + '%';

    // 保存文件列表供展开用
    window._categoryFiles = {
        simple: categoryStats.simple_files || [],
        medium: categoryStats.medium_files || [],
        complex: categoryStats.complex_files || []
    };
}

/**
 * 通用：渲染文件列表到分类区域
 */
function renderFileList(files, titleText) {
    const container = document.getElementById('category-file-list');
    const listBody = document.getElementById('category-list-body');
    const title = document.getElementById('category-list-title');

    title.textContent = titleText;

    if (!files || files.length === 0) {
        listBody.innerHTML = '<div class="empty-hint">暂无文件</div>';
    } else {
        listBody.innerHTML = files.map(f => {
            const name = f.split('/').pop() || f.split('\\').pop() || f;
            const escapedPath = f.replace(/'/g, "\\'");
            // 使用与相似文件列表一致的样式
            return `
                <div class="similar-file-item">
                    <div class="file-info">
                        <span class="file-name">${name}</span>
                        <span class="file-path" title="${f}">${f}</span>
                    </div>
                    <button class="btn-open-small" onclick="openFile('${escapedPath}')">📂</button>
                </div>
            `;
        }).join('');
    }

    container.classList.remove('hidden');
    // 滚动到列表位置
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 切换分类文件列表
 */
function toggleCategoryList(category) {
    const titleMap = {
        simple: '🟢 简单文档列表',
        medium: '🟡 中等文档列表',
        complex: '🔴 复杂文档列表'
    };

    const files = window._categoryFiles?.[category] || [];
    renderFileList(files, titleMap[category] || '文件列表');
}

/**
 * 显示需OCR或解析失败的文件列表
 */
function showProblemFiles(type) {
    const result = window._scanResult;
    // 检查是否有数据，后端字段名为 files，但也提供了 ocr_files 和 review_files
    if (!result) {
        console.warn('Scan result not ready');
        return;
    }

    let files = [];
    let titleText = '';

    if (type === 'ocr') {
        // 优先使用预筛选的列表
        const sourceList = result.ocr_files || [];
        files = sourceList.map(a => a.file_info.path);
        titleText = '📷 需OCR文档列表';
    } else if (type === 'failed') {
        // review_files 对应解析失败/需人工审核
        const sourceList = result.review_files || [];
        files = sourceList.map(a => a.file_info.path);
        titleText = '❌ 解析失败文档列表';
    }

    renderFileList(files, titleText);
}

/**
 * 关闭分类文件列表
 */
function closeCategoryList() {
    document.getElementById('category-file-list').classList.add('hidden');
}

/**
 * 渲染长度统计
 */
function renderLengthStats(stats) {
    document.getElementById('stats-min').textContent = formatNumber(stats.min);
    document.getElementById('stats-max').textContent = formatNumber(stats.max);
    document.getElementById('stats-median').textContent = formatNumber(Math.round(stats.median));
    document.getElementById('stats-p25').textContent = formatNumber(Math.round(stats.p25));
    document.getElementById('stats-p75').textContent = formatNumber(Math.round(stats.p75));
    document.getElementById('stats-p90').textContent = formatNumber(Math.round(stats.p90));
}

/**
 * 渲染结构数据统计
 */
function renderStructureStats(stats, totalFiles) {
    const total = totalFiles || 1;

    document.getElementById('docs-with-tables').textContent = stats.docs_with_tables || 0;
    document.getElementById('docs-with-images').textContent = stats.docs_with_images || 0;
    document.getElementById('docs-with-headings').textContent = stats.docs_with_headings || 0;

    document.getElementById('docs-with-tables-ratio').textContent =
        Math.round((stats.docs_with_tables || 0) / total * 100) + '%';
    document.getElementById('docs-with-images-ratio').textContent =
        Math.round((stats.docs_with_images || 0) / total * 100) + '%';
    document.getElementById('docs-with-headings-ratio').textContent =
        Math.round((stats.docs_with_headings || 0) / total * 100) + '%';
}

/**
 * 渲染审核台
 */
function renderReviewSection(result) {
    // 相似度
    const similarGroups = result.similar_groups || [];
    const similarFilesCount = new Set(similarGroups.flatMap(g => g.files)).size;
    document.getElementById('similar-files-count').textContent = similarFilesCount;
    document.getElementById('similar-groups-count').textContent = similarGroups.length;
    renderSimilarGroups(similarGroups);

}

/**
 * 切换折叠区块
 */
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('collapsed');
}

/**
 * 格式化数字（添加千分位）
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString();
}

/**
 * 渲染高相似文档组
 */
function renderSimilarGroups(groups) {
    const container = document.getElementById('similar-groups-container');

    if (!groups || groups.length === 0) {
        container.innerHTML = '<div class="empty-hint">暂无高相似度文档组 🎉</div>';
        return;
    }

    // 只显示前20组
    const displayGroups = groups.slice(0, 20);

    const html = displayGroups.map((group, idx) => {
        const similarity = Math.round(group.similarity * 100);
        const filesHtml = group.files.map(f => {
            const name = f.split('/').pop() || f.split('\\').pop() || f;
            const escapedPath = f.replace(/'/g, "\\'");
            return `
                <li class="similar-file-item">
                    <div class="file-info">
                        <span class="file-name">${name}</span>
                        <span class="file-path" title="${f}">${f}</span>
                    </div>
                    <button class="btn-open-small" onclick="openFile('${escapedPath}')">📂</button>
                </li>
            `;
        }).join('');

        return `
            <div class="similar-group-card">
                <div class="similar-group-header">
                    <span class="group-label">组 ${idx + 1}</span>
                    <span class="similarity-badge">${similarity}% 相似</span>
                    <span class="distance-badge">距离: ${group.distance}</span>
                </div>
                <ul class="similar-files-list">
                    ${filesHtml}
                </ul>
            </div>
        `;
    }).join('');

    const moreHtml = groups.length > 20
        ? `<div class="more-hint">还有 ${groups.length - 20} 组未显示...</div>`
        : '';

    container.innerHTML = html + moreHtml;
}


/**
 * HTML转义
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * 导出报告
 */
window.exportReport = function() {
    const result = window._scanResult;
    if (!result || !result.task_id) {
        alert('没有可导出的数据。请先执行扫描。');
        return;
    }
    
    // 打开导出链接（会触发下载）
    const downloadUrl = `/api/report/export/${result.task_id}`;
    
    // 创建隐藏的a标签并点击
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
