import React from 'react'
import { openFile } from '../utils/api'
import { getFileName } from '../utils/format'

export default function FileList({ files, title, onClose }) {
  const handleOpenFile = async (filePath) => {
    try {
      await openFile(filePath)
    } catch (error) {
      console.error('打开文件错误:', error)
      alert(`打开文件失败: ${error.message}`)
    }
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg p-4 mt-4 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border-color)]">
        <h4 className="text-sm font-medium">{title}</h4>
        <button
          onClick={onClose}
          className="bg-transparent border-none text-[var(--text-secondary)] text-lg cursor-pointer hover:text-[var(--text-primary)]"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2">
        {!files || files.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">暂无文件</div>
        ) : (
          files.map((f, index) => {
            const name = getFileName(f)
            return (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-dashed border-[var(--border-color)] last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="block text-sm text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis">
                    {name}
                  </span>
                  <span
                    className="block text-xs text-[var(--text-muted)] whitespace-nowrap overflow-hidden text-ellipsis"
                    title={f}
                  >
                    {f}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenFile(f)}
                  className="ml-2 flex-shrink-0 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-[var(--text-secondary)] text-sm cursor-pointer transition-all hover:bg-[var(--accent-primary)] hover:text-white hover:border-[var(--accent-primary)]"
                >
                  📂
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
