/**
 * API 工具函数
 */

// 浏览文件夹
export async function browseFolder(path?: string): Promise<{ status: string; path?: string }> {
  const response = await fetch('/api/file/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  })
  const data = await response.json()
  return data
}

// 开始扫描
export async function startScan(path: string): Promise<{ task_id: string }> {
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
export async function getScanResult(taskId: string): Promise<ScanResult> {
  const response = await fetch(`/api/scan/result/${taskId}`)
  if (!response.ok) {
    throw new Error('获取扫描结果失败')
  }
  return response.json()
}

// 打开文件
export async function openFile(filePath: string): Promise<void> {
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
export function exportReport(taskId: string): void {
  const downloadUrl = `/api/report/export/${taskId}`
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = ''
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 类型定义
export interface ScanResult {
  total_files?: number
  format_distribution?: Record<string, number>
  pdf_page_stats?: PdfPageStats
  length_stats?: LengthStats
  structure_stats?: StructureStats
  similar_groups?: SimilarGroup[]
  total_size?: number
  scan_path?: string
}

export interface PdfPageStats {
  total_pages: number
  text_pages?: number
  scan_pages?: number
  low_density_pages?: number
}

export interface LengthStats {
  min?: number
  max?: number
  p25?: number
  median?: number
  p75?: number
  p90?: number
  under_500?: number
  range_500_2000?: number
  range_2000_5000?: number
  range_5000_10000?: number
  over_10000?: number
}

export interface StructureStats {
  docs_with_tables?: number
  docs_with_images?: number
  docs_with_headings?: number
}

export interface SimilarGroup {
  files: string[]
  similarity: number
  distance: number
}
