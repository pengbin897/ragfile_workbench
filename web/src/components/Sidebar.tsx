import { useApp } from '../context/AppContext'

interface NavItem {
  id: 'scan' | 'report' | 'details'
  icon: string
  text: string
}

const navItems: NavItem[] = [
  { id: 'scan', icon: '⚙️', text: '文档扫描' },
  { id: 'report', icon: '📊', text: '分析报告' },
  { id: 'details', icon: '📈', text: '设置' }
]

export default function Sidebar() {
  const { currentPage, setCurrentPage, theme, toggleTheme } = useApp()

  return (
    <aside className="w-60 bg-[var(--bg-secondary)] p-6 flex flex-col border-r border-[var(--border-color)]">
      {/* Logo */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--border-color)]">
        <div className="text-3xl">📋</div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-wide gradient-text">
            RAG文档预分析工具
          </span>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex flex-col gap-2">
        {navItems.map(item => (
          <a
            key={item.id}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setCurrentPage(item.id)
            }}
            className={`flex items-center gap-4 p-4 rounded-lg text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] ${
              currentPage === item.id 
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border-l-[3px] border-[var(--accent-primary)]' 
                : ''
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.text}</span>
          </a>
        ))}
      </nav>

      {/* 底部 */}
      <div className="mt-auto pt-6 border-t border-[var(--border-color)]">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] text-lg cursor-pointer transition-all hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
        >
          <span>{theme === 'light' ? '☀️' : '🌙'}</span>
          <span className="text-xs">{theme === 'light' ? '亮色' : '暗色'}</span>
        </button>
        <div className="text-xs text-[var(--text-muted)] text-center mt-2">v0.0.1</div>
      </div>
    </aside>
  )
}
