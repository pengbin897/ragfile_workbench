/**
 * 格式化工具函数
 */

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化数字（添加千分位）
export function formatNumber(num) {
  if (num === undefined || num === null) return '-'
  return num.toLocaleString()
}

// 获取格式标签
export function getFormatLabel(format) {
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
  }
  return labels[format] || format.toUpperCase()
}

// HTML转义
export function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 获取文件名
export function getFileName(path) {
  return path.split('/').pop() || path.split('\\').pop() || path
}
