/**
 * API 工具函数
 */

// 浏览文件夹
export async function browseFolder(path) {
  const response = await fetch('/api/file/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  })
  const data = await response.json()
  return data
}

// 开始扫描
export async function startScan(path) {
  const response = await fetch('/api/scan/start_sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '启动扫描失败')
  }

  return response.json()
}

// 获取扫描结果
export async function getScanResult(taskId) {
  const response = await fetch(`/api/scan/result/${taskId}`)
  if (!response.ok) {
    throw new Error('获取扫描结果失败')
  }
  return response.json()
}

// 打开文件
export async function openFile(filePath) {
  const response = await fetch('/api/file/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '打开文件失败')
  }
}

// 导出报告
export function exportReport(taskId) {
  const downloadUrl = `/api/report/export/${taskId}`
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = ''
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
