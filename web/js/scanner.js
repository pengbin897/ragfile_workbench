/**
 * 扫描控制模块
 */

/**
 * 开始扫描
 */
async function startScan(path) {
    const btnScan = document.getElementById('btn-start-scan');
    btnScan.disabled = true;
    btnScan.innerHTML = '<span class="btn-icon">⏳</span><span>扫描中...</span>';

    showProgress(true);
    document.getElementById('progress-log').innerHTML = '';
    addProgressLog('开始扫描...');

    try {
        // 启动扫描任务
        const response = await fetch('/api/scan/start_sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '启动扫描失败');
        }

        const data = await response.json();
        const taskId = data.task_id;
        AppState.currentTaskId = taskId;

        addProgressLog(`任务ID: ${taskId}`);

        // 连接SSE获取进度
        await connectProgressSSE(taskId);

    } catch (error) {
        console.error('扫描错误:', error);
        addProgressLog(`错误: ${error.message}`);
        alert(`扫描失败: ${error.message}`);
    } finally {
        btnScan.disabled = false;
        btnScan.innerHTML = '<span class="btn-icon">🔍</span><span>开始扫描</span>';
    }
}

/**
 * 连接SSE获取扫描进度
 */
async function connectProgressSSE(taskId) {
    return new Promise((resolve, reject) => {
        const eventSource = new EventSource(`/api/scan/progress/${taskId}`);

        eventSource.addEventListener('progress', (event) => {
            try {
                const progress = JSON.parse(event.data);
                updateProgress(progress);

                if (progress.status === 'completed') {
                    eventSource.close();
                    addProgressLog('扫描完成！');
                    loadScanResult(taskId);
                    resolve();
                } else if (progress.status === 'error') {
                    eventSource.close();
                    addProgressLog(`错误: ${progress.message}`);
                    reject(new Error(progress.message));
                }
            } catch (e) {
                console.error('解析进度数据失败:', e);
            }
        });

        eventSource.onerror = (error) => {
            console.error('SSE连接错误:', error);
            eventSource.close();

            // 尝试直接获取结果
            setTimeout(() => {
                loadScanResult(taskId);
                resolve();
            }, 1000);
        };
    });
}

/**
 * 加载扫描结果
 */
async function loadScanResult(taskId) {
    try {
        const response = await fetch(`/api/scan/result/${taskId}`);
        if (!response.ok) {
            throw new Error('获取扫描结果失败');
        }

        const result = await response.json();
        AppState.scanResult = result;

        // 渲染报告
        renderReport(result);

        // 切换到报告页面
        switchPage('report');

    } catch (error) {
        console.error('加载结果错误:', error);
        addProgressLog(`加载结果失败: ${error.message}`);
    }
}

/**
 * 打开本地文件
 */
async function openFile(filePath) {
    try {
        const response = await fetch('/api/file/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '打开文件失败');
        }

    } catch (error) {
        console.error('打开文件错误:', error);
        alert(`打开文件失败: ${error.message}`);
    }
}
