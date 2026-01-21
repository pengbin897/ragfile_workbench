/**
 * 主应用逻辑
 */

// 全局状态
const AppState = {
    currentPage: 'scan',
    currentTaskId: null,
    scanResult: null
};

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScanButton();
});

/**
 * 初始化导航
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            switchPage(page);
        });
    });
}

/**
 * 切换页面
 */
function switchPage(pageName) {
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });

    // 切换页面显示
    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageName}`);
    });

    AppState.currentPage = pageName;

    // 切换到详细统计页时初始化图表
    if (pageName === 'details' && typeof initDetailsCharts === 'function') {
        initDetailsCharts();
    }
}

/**
 * 初始化扫描按钮
 */
function initScanButton() {
    const btnScan = document.getElementById('btn-start-scan');
    const btnBrowse = document.getElementById('btn-browse');
    const inputPath = document.getElementById('scan-path');

    // 浏览按钮点击事件
    btnBrowse.addEventListener('click', async () => {
        btnBrowse.disabled = true;
        btnBrowse.textContent = '选择中...';

        try {
            const response = await fetch('/api/folder/browse');
            const data = await response.json();

            if (data.status === 'success' && data.path) {
                inputPath.value = data.path;
            } else if (data.status === 'cancelled') {
                // 用户取消了选择，不做任何操作
            }
        } catch (error) {
            console.error('浏览文件夹失败:', error);
            // 自动选择失败，引导用户手动输入
            inputPath.placeholder = "无法打开选择器，请手动输入路径";
            inputPath.focus();
        } finally {
            btnBrowse.disabled = false;
            btnBrowse.textContent = '📁 浏览';
        }
    });

    btnScan.addEventListener('click', async () => {
        const path = inputPath.value.trim();
        if (!path) {
            alert('请先选择或输入要扫描的文件夹路径');
            return;
        }

        startScan(path);
    });

    // 回车触发扫描
    inputPath.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnScan.click();
        }
    });
}

/**
 * 显示/隐藏进度卡片
 */
function showProgress(show = true) {
    const progressCard = document.getElementById('scan-progress');
    progressCard.classList.toggle('hidden', !show);
}

/**
 * 更新进度显示
 */
function updateProgress(progress) {
    document.getElementById('progress-percent').textContent = `${Math.round(progress.percentage)}%`;
    document.getElementById('progress-bar').style.width = `${progress.percentage}%`;
    document.getElementById('progress-current').textContent = progress.message || progress.current_file || '处理中...';
    document.getElementById('progress-count').textContent = `${progress.processed_count} / ${progress.total_count}`;

    // 添加日志
    if (progress.current_file) {
        addProgressLog(`处理: ${progress.current_file}`);
    }
}

/**
 * 添加进度日志
 */
function addProgressLog(message) {
    const logContainer = document.getElementById('progress-log');
    const logLine = document.createElement('div');
    logLine.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(logLine);
    logContainer.scrollTop = logContainer.scrollHeight;

    // 限制日志条数
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 切换主题
 */
window.toggleTheme = function () {
    console.log('Toggle theme clicked');
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? '' : 'light';

    if (newTheme === 'light') {
        html.setAttribute('data-theme', 'light');
        document.getElementById('theme-icon').textContent = '☀️';
        document.getElementById('theme-label').textContent = '亮色';
        localStorage.setItem('theme', 'light');
    } else {
        html.removeAttribute('data-theme');
        document.getElementById('theme-icon').textContent = '🌙';
        document.getElementById('theme-label').textContent = '暗色';
        localStorage.setItem('theme', 'dark');
    }
}

/**
 * 初始化主题
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.getElementById('theme-icon').textContent = '☀️';
        document.getElementById('theme-label').textContent = '亮色';
    }
}

// 页面加载时初始化主题
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});

