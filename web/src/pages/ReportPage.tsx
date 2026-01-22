import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { exportReport } from '../utils/api'
import { formatNumber } from '../utils/format'
import FileList from '../components/FileList'
import SimilarGroups from '../components/SimilarGroups'

export default function ReportPage() {
  const { scanResult } = useApp()
  const [showFileList, setShowFileList] = useState(false)
  const [fileListData, setFileListData] = useState({ files: [], title: '' })
  const [expandedSection, setExpandedSection] = useState('similar-section')

  if (!scanResult) {
    return (
      <section className="page">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">扫描报告</h1>
          <p className="text-[var(--text-secondary)] text-sm">请先执行扫描</p>
        </div>
        <div className="text-center py-16 text-[var(--text-muted)]">
          暂无扫描数据，请先在"文档扫描"页面执行扫描
        </div>
      </section>
    )
  }

  const result = scanResult
  const categoryStats = result.category_stats || {}
  const simpleCount = categoryStats.simple_count || 0
  const mediumCount = categoryStats.medium_count || 0
  const complexCount = categoryStats.complex_count || 0
  const ocrCount = (result.ocr_files || []).length
  const failedCount = (result.review_files || []).length
  const parsableCount = simpleCount + mediumCount
  const total = result.total_files || 1
  const parsableRatio = total > 0 ? Math.round(parsableCount / total * 100) : 0

  const similarGroups = result.similar_groups || []
  const similarFilesCount = new Set(similarGroups.flatMap(g => g.files)).size

  const handleExport = () => {
    if (result.task_id) {
      exportReport(result.task_id)
    } else {
      alert('没有可导出的数据。请先执行扫描。')
    }
  }

  const showCategoryFiles = (category) => {
    const titleMap = {
      simple: '🟢 简单文档列表',
      medium: '🟡 中等文档列表',
      complex: '🔴 复杂文档列表'
    }
    const files = categoryStats[`${category}_files`] || []
    setFileListData({ files, title: titleMap[category] || '文件列表' })
    setShowFileList(true)
  }

  const showProblemFiles = (type) => {
    let files = []
    let titleText = ''
    if (type === 'ocr') {
      const sourceList = result.ocr_files || []
      files = sourceList.map(a => a.file_info.path)
      titleText = '📷 需OCR文档列表'
    } else if (type === 'failed') {
      const sourceList = result.review_files || []
      files = sourceList.map(a => a.file_info.path)
      titleText = '❌ 解析失败文档列表'
    }
    setFileListData({ files, title: titleText })
    setShowFileList(true)
  }

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  // 执行摘要
  const renderSummaryText = () => {
    const parts = []
    parts.push(<span key="total">本次扫描 <strong>{total.toLocaleString()}</strong> 份文档。</span>)

    if (parsableRatio >= 90) {
      parts.push(<span key="ratio" className="text-status-green-light font-semibold"> ✅ {parsableRatio}% 可解析</span>)
    } else if (parsableRatio >= 70) {
      parts.push(<span key="ratio" className="text-status-yellow-light font-semibold"> ⚠️ {parsableRatio}% 可解析</span>)
    } else {
      parts.push(<span key="ratio" className="text-status-red-light font-semibold"> ❌ 仅 {parsableRatio}% 可解析</span>)
    }

    if (ocrCount > 0) {
      parts.push(<span key="ocr" className="ml-2 text-sm"> 📷 {ocrCount}份需OCR</span>)
    }
    if (failedCount > 0) {
      parts.push(<span key="failed" className="ml-2 text-sm"> ❌ {failedCount}份解析失败</span>)
    }

    return parts
  }

  return (
    <section className="page">
      {/* 页面头部 */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-1">扫描报告</h1>
          <p className="text-[var(--text-secondary)] text-sm">{result.scan_path}</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm cursor-pointer transition-all hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-primary)]"
        >
          📋 导出报告
        </button>
      </div>

      {/* 执行摘要 */}
      <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-xl p-6 mb-6 border-l-4 border-[var(--accent-primary)]">
        <p className="text-base leading-relaxed text-[var(--text-primary)]">
          {renderSummaryText()}
        </p>
      </div>

      {/* 核心卡片 */}
      <div className="mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[var(--bg-card)] rounded-xl p-6 flex items-center gap-4">
            <div className="text-3xl">📁</div>
            <div className="flex flex-col">
              <span className="text-2xl font-semibold">{result.total_files.toLocaleString()}</span>
              <span className="text-sm text-[var(--text-secondary)]">总文件数</span>
            </div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl p-6 flex items-center gap-4 border-l-[3px] border-status-green">
            <div className="text-3xl">✅</div>
            <div className="flex flex-col">
              <span className="text-2xl font-semibold">{parsableCount.toLocaleString()}</span>
              <span className="text-sm text-[var(--text-secondary)]">可解析</span>
            </div>
          </div>
          <div
            className="bg-[var(--bg-card)] rounded-xl p-6 flex items-center gap-4 border-l-[3px] border-status-yellow cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors"
            onClick={() => showProblemFiles('ocr')}
          >
            <div className="text-3xl">📷</div>
            <div className="flex flex-col">
              <span className="text-2xl font-semibold">{ocrCount.toLocaleString()}</span>
              <span className="text-sm text-[var(--text-secondary)]">需OCR</span>
            </div>
          </div>
          <div
            className="bg-[var(--bg-card)] rounded-xl p-6 flex items-center gap-4 border-l-[3px] border-status-red cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors"
            onClick={() => showProblemFiles('failed')}
          >
            <div className="text-3xl">❌</div>
            <div className="flex flex-col">
              <span className="text-2xl font-semibold">{failedCount.toLocaleString()}</span>
              <span className="text-sm text-[var(--text-secondary)]">解析失败</span>
            </div>
          </div>
        </div>
      </div>

      {/* 文档分类 */}
      <div className="bg-[var(--bg-card)] rounded-xl p-6 mb-6">
        <h3 className="text-lg mb-4">📂 文档分类（按处理难度）</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* 简单 */}
          <div
            className="bg-[var(--bg-secondary)] rounded-lg p-6 cursor-pointer text-center transition-all hover:translate-y-[-2px] hover:shadow-lg border-t-[3px] border-status-green"
            onClick={() => showCategoryFiles('simple')}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">🟢</span>
              <span className="text-base font-semibold">简单</span>
            </div>
            <div className="text-4xl font-bold text-[var(--text-primary)] mb-1">{simpleCount.toLocaleString()}</div>
            <div className="text-xs text-[var(--text-muted)] mb-2">纯文字，无表格图片</div>
            <div className="text-sm text-[var(--text-secondary)]">{Math.round(simpleCount / total * 100)}%</div>
          </div>
          {/* 中等 */}
          <div
            className="bg-[var(--bg-secondary)] rounded-lg p-6 cursor-pointer text-center transition-all hover:translate-y-[-2px] hover:shadow-lg border-t-[3px] border-status-yellow"
            onClick={() => showCategoryFiles('medium')}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">🟡</span>
              <span className="text-base font-semibold">中等</span>
            </div>
            <div className="text-4xl font-bold text-[var(--text-primary)] mb-1">{mediumCount.toLocaleString()}</div>
            <div className="text-xs text-[var(--text-muted)] mb-2">含表格或图片</div>
            <div className="text-sm text-[var(--text-secondary)]">{Math.round(mediumCount / total * 100)}%</div>
          </div>
          {/* 复杂 */}
          <div
            className="bg-[var(--bg-secondary)] rounded-lg p-6 cursor-pointer text-center transition-all hover:translate-y-[-2px] hover:shadow-lg border-t-[3px] border-status-red"
            onClick={() => showCategoryFiles('complex')}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">🔴</span>
              <span className="text-base font-semibold">复杂</span>
            </div>
            <div className="text-4xl font-bold text-[var(--text-primary)] mb-1">{complexCount.toLocaleString()}</div>
            <div className="text-xs text-[var(--text-muted)] mb-2">扫描PDF/解析失败</div>
            <div className="text-sm text-[var(--text-secondary)]">{Math.round(complexCount / total * 100)}%</div>
          </div>
        </div>

        {/* 文件列表 */}
        {showFileList && (
          <FileList
            files={fileListData.files}
            title={fileListData.title}
            onClose={() => setShowFileList(false)}
          />
        )}
      </div>

      {/* 长度统计简要 */}
      {result.length_stats && (
        <div className="bg-[var(--bg-card)] rounded-lg px-6 py-4 flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          <span>📏 文档长度中位数: <strong className="text-[var(--accent-primary)]">{formatNumber(Math.round(result.length_stats.median))}</strong> 字</span>
          <span className="text-[var(--border-color)]">|</span>
          <span>P90 (90%的文档在此以下): <strong className="text-[var(--accent-primary)]">{formatNumber(Math.round(result.length_stats.p90))}</strong> 字</span>
        </div>
      )}
    </section>
  )
}
