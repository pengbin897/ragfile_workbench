import { useState, useRef, KeyboardEvent } from 'react'
import { Upload } from 'antd'
import { useApp } from '../context/AppContext'
import { startScan, getScanResult } from '../utils/api'
import type { ScanResult } from '../utils/api'

interface FormatTag {
  icon: string
  name: string
}

const formatTags: FormatTag[] = [
  { icon: '📄', name: 'DOCX' },
  { icon: '📊', name: 'XLSX' },
  { icon: '📽️', name: 'PPTX' },
  { icon: '📕', name: 'PDF' },
  { icon: '📝', name: 'TXT' },
  { icon: '📋', name: 'MD' }
]

interface Progress {
  percentage: number
  message: string
  processedCount: number
  totalCount: number
}

interface ProgressData {
  percentage?: number
  message?: string
  current_file?: string
  processed_count?: number
  total_count?: number
  status?: 'completed' | 'error' | 'processing'
}

export default function ScanPage() {
  const { setScanResult, setCurrentPage, setCurrentTaskId } = useApp()
  const [scanPath, setScanPath] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState<Progress>({
    percentage: 0,
    message: '正在准备...',
    processedCount: 0,
    totalCount: 0
  })
  const [logs, setLogs] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => {
      const newLogs = [...prev, `[${time}] ${msg}`]
      // 限制日志条数
      if (newLogs.length > 50) {
        return newLogs.slice(-50)
      }
      return newLogs
    })
  }

  const handleStartScan = async () => {
    const path = scanPath.trim()
    if (!path) {
      alert('请先选择或输入要扫描的文件夹路径')
      return
    }

    setIsScanning(true)
    setShowProgress(true)
    setLogs([])
    addLog('开始扫描...')

    try {
      const data = await startScan(path)
      const taskId = data.task_id
      setCurrentTaskId(taskId)
      addLog(`任务ID: ${taskId}`)

      // 连接SSE获取进度
      await connectProgressSSE(taskId)
    } catch (error) {
      console.error('扫描错误:', error)
      addLog(`错误: ${(error as Error).message}`)
      alert(`扫描失败: ${(error as Error).message}`)
    } finally {
      setIsScanning(false)
    }
  }

  const connectProgressSSE = (taskId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`/api/scan/progress/${taskId}`)

      eventSource.addEventListener('progress', (event: MessageEvent) => {
        try {
          const progressData: ProgressData = JSON.parse(event.data)
          setProgress({
            percentage: progressData.percentage || 0,
            message: progressData.message || progressData.current_file || '处理中...',
            processedCount: progressData.processed_count || 0,
            totalCount: progressData.total_count || 0
          })

          if (progressData.current_file) {
            addLog(`处理: ${progressData.current_file}`)
          }

          if (progressData.status === 'completed') {
            eventSource.close()
            addLog('扫描完成！')
            loadScanResult(taskId)
            resolve()
          } else if (progressData.status === 'error') {
            eventSource.close()
            addLog(`错误: ${progressData.message}`)
            reject(new Error(progressData.message))
          }
        } catch (e) {
          console.error('解析进度数据失败:', e)
        }
      })

      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error)
        eventSource.close()
        // 尝试直接获取结果
        setTimeout(() => {
          loadScanResult(taskId)
          resolve()
        }, 1000)
      }
    })
  }

  const loadScanResult = async (taskId: string) => {
    try {
      const result: ScanResult = await getScanResult(taskId)
      setScanResult(result)
      setCurrentPage('report')
    } catch (error) {
      console.error('加载结果错误:', error)
      addLog(`加载结果失败: ${(error as Error).message}`)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleStartScan()
    }
  }

  return (
    <section className="page">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-1">扫描设置</h1>
        <p className="text-[var(--text-secondary)] text-sm">选择要扫描的文档文件夹</p>
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl p-8 max-w-xl">
        {/* 输入组 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">文件夹路径</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="点击浏览按钮选择文件夹，或手动输入路径"
              className="flex-1 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm outline-none transition-colors focus:border-[var(--accent-primary)] placeholder:text-[var(--text-muted)]"
            />
            <Upload
              className="px-6 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm cursor-pointer whitespace-nowrap transition-all hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
              directory
              action="/api/file/upload"
            >
              📁 选择
            </Upload>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            支持任意层级的文件夹，将自动扫描所有子目录
          </p>
        </div>

        {/* 格式标签 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {formatTags.map(tag => (
            <span
              key={tag.name}
              className="px-4 py-1 bg-[var(--bg-secondary)] rounded-full text-xs text-[var(--text-secondary)]"
            >
              {tag.icon} {tag.name}
            </span>
          ))}
        </div>

        {/* 开始扫描按钮 */}
        <button
          onClick={handleStartScan}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-2 p-4 btn-gradient border-none rounded-lg text-white text-base font-semibold cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span>{isScanning ? '⏳' : '🔍'}</span>
          <span>{isScanning ? '扫描中...' : '开始扫描'}</span>
        </button>
      </div>

      {/* 扫描进度 */}
      {showProgress && (
        <div className="bg-[var(--bg-card)] rounded-xl p-8 mt-6 max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-medium">扫描进行中...</h3>
            <span className="text-2xl font-bold gradient-text">
              {Math.round(progress.percentage)}%
            </span>
          </div>
          
          <div className="h-2 bg-[var(--bg-secondary)] rounded overflow-hidden mb-4">
            <div
              className="h-full progress-gradient rounded transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-[var(--text-secondary)]">
            <span>{progress.message}</span>
            <span>{progress.processedCount} / {progress.totalCount}</span>
          </div>
          
          <div className="mt-4 p-4 bg-[var(--bg-secondary)] rounded-lg max-h-32 overflow-y-auto font-mono text-xs text-[var(--text-muted)]">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
