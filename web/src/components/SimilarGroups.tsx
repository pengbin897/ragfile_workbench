import { openFile } from '../utils/api'
import { getFileName } from '../utils/format'
import type { SimilarGroup } from '../utils/api'

interface SimilarGroupsProps {
  groups?: SimilarGroup[]
}

export default function SimilarGroups({ groups }: SimilarGroupsProps) {
  const handleOpenFile = async (filePath: string) => {
    try {
      await openFile(filePath)
    } catch (error) {
      console.error('打开文件错误:', error)
      alert(`打开文件失败: ${(error as Error).message}`)
    }
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)] text-sm">
        暂无高相似度文档组 🎉
      </div>
    )
  }

  // 只显示前20组
  const displayGroups = groups.slice(0, 20)

  return (
    <div className="space-y-4">
      {displayGroups.map((group, idx) => {
        const similarity = Math.round(group.similarity * 100)
        return (
          <div
            key={idx}
            className="bg-[var(--bg-card)] rounded-lg p-4 border-l-[3px] border-status-yellow"
          >
            <div className="flex items-center gap-4 mb-2">
              <span className="font-semibold text-[var(--text-primary)]">组 {idx + 1}</span>
              <span className="px-2 py-0.5 bg-status-yellow/20 text-status-yellow-light rounded text-xs font-medium">
                {similarity}% 相似
              </span>
              <span className="px-2 py-0.5 bg-[var(--text-muted)]/20 text-[var(--text-secondary)] rounded text-xs">
                距离: {group.distance}
              </span>
            </div>
            <ul className="list-none m-0 p-0">
              {group.files.map((f, fileIdx) => {
                const name = getFileName(f)
                return (
                  <li
                    key={fileIdx}
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
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
      {groups.length > 20 && (
        <div className="text-center py-4 text-[var(--text-muted)] text-sm">
          还有 {groups.length - 20} 组未显示...
        </div>
      )}
    </div>
  )
}
