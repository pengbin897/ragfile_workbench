/**
 * 图表渲染模块 (ECharts)
 */

let formatChart = null;
let pdfChart = null;

/**
 * 初始化格式分布图表
 */
function initFormatChart(data) {
    const container = document.getElementById('chart-format');
    if (!container) {
        console.error('Chart container #chart-format not found');
        return;
    }

    // 检查数据是否为空
    if (!data || Object.keys(data).length === 0) {
        console.warn('Format distribution data is empty');
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;">暂无数据</div>';
        return;
    }

    if (formatChart) {
        formatChart.dispose();
    }

    formatChart = echarts.init(container);

    // 转换数据
    const chartData = Object.entries(data).map(([name, value]) => ({
        name: getFormatLabel(name),
        value: value
    }));

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: {
                color: '#9ca3af'
            }
        },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 4,
                borderColor: '#252a3d',
                borderWidth: 2
            },
            label: {
                show: false
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#fff'
                }
            },
            labelLine: {
                show: false
            },
            data: chartData
        }],
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
    };

    formatChart.setOption(option);

    // 响应式
    window.addEventListener('resize', () => {
        formatChart && formatChart.resize();
    });
}

/**
 * 初始化PDF页面类型图表
 */
function initPdfPageTypeChart(pageStats) {
    const container = document.getElementById('chart-pdf');
    if (!container) return;

    if (pdfChart) {
        pdfChart.dispose();
    }

    // 检查是否有PDF数据
    if (!pageStats || pageStats.total_pages === 0) {
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;">无PDF文件</div>';
        return;
    }

    pdfChart = echarts.init(container);

    const total = pageStats.total_pages;
    const textCount = pageStats.text_pages || 0;
    const scanCount = pageStats.scan_pages || 0;
    const lowCount = pageStats.low_density_pages || 0;

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}页 ({d}%)'
        },
        legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: {
                color: '#9ca3af'
            }
        },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 4,
                borderColor: '#252a3d',
                borderWidth: 2
            },
            label: {
                show: false
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#fff'
                }
            },
            labelLine: {
                show: false
            },
            data: [
                { value: textCount, name: '文字页', itemStyle: { color: '#10b981' } },
                { value: scanCount, name: '扫描页', itemStyle: { color: '#ef4444' } },
                { value: lowCount, name: '低密度页', itemStyle: { color: '#f59e0b' } }
            ].filter(d => d.value > 0)
        }]
    };

    pdfChart.setOption(option);

    // 响应式
    window.addEventListener('resize', () => {
        pdfChart && pdfChart.resize();
    });
}

/**
 * 获取格式标签
 */
function getFormatLabel(format) {
    const labels = {
        'docx': 'DOCX',
        'xlsx': 'XLSX',
        'pptx': 'PPTX',
        'pdf': 'PDF',
        'pdf_scan': 'PDF(扫描)',
        'txt': 'TXT',
        'md': 'Markdown',
        'image': '图片',
        'other': '其他'
    };
    return labels[format] || format.toUpperCase();
}

let lengthChart = null;

/**
 * 初始化长度分布图表
 */
function initLengthChart(stats) {
    const container = document.getElementById('chart-length');
    if (!container) return;

    if (lengthChart) {
        lengthChart.dispose();
    }

    lengthChart = echarts.init(container);

    const data = [
        { name: '<500', value: stats.under_500 || 0 },
        { name: '500-2K', value: stats.range_500_2000 || 0 },
        { name: '2K-5K', value: stats.range_2000_5000 || 0 },
        { name: '5K-10K', value: stats.range_5000_10000 || 0 },
        { name: '>10K', value: stats.over_10000 || 0 }
    ];

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: '{b}: {c} 个文档'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.map(d => d.name),
            axisLine: { lineStyle: { color: '#374151' } },
            axisLabel: { color: '#9ca3af', fontSize: 11 }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#9ca3af' },
            splitLine: { lineStyle: { color: '#374151' } }
        },
        series: [{
            type: 'bar',
            barWidth: '60%',
            data: data.map((d, i) => ({
                value: d.value,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: i < 2 ? '#10b981' : (i < 4 ? '#3b82f6' : '#f59e0b') },
                        { offset: 1, color: i < 2 ? '#059669' : (i < 4 ? '#2563eb' : '#d97706') }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                }
            }))
        }]
    };

    lengthChart.setOption(option);

    window.addEventListener('resize', () => {
        lengthChart && lengthChart.resize();
    });
}

