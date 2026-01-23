import { useApp } from '../context/AppContext'
import { formatNumber } from '../utils/format'
import { FormatChart, PdfPageTypeChart, LengthChart } from '../components/Charts'
import SimilarGroups from '../components/SimilarGroups'

export default function DetailsPage() {
  const { scanResult } = useApp()

  if (!scanResult) {
    return (
      <section className="page">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">详细统计</h1>
          <p className="text-[var(--text-secondary)] text-sm">请先执行扫描</p>
        </div>
        <div className="text-center py-16 text-[var(--text-muted)]">
          暂无扫描数据，请先在"文档扫描"页面执行扫描
        </div>
      </section>
    )
  }

  const result = scanResult
  const lengthStats = result.length_stats || {}
  const structureStats = result.structure_stats || {}
  const total = result.total_files || 1
  const similarGroups = result.similar_groups || []
  const similarFilesCount = new Set(similarGroups.flatMap(g => g.files)).size

  return (
    <section className="page">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-1">详细统计</h1>
        <p className="text-[var(--text-secondary)] text-sm">格式分布、长度分布、结构数据</p>
      </div>

      {/* 格式分布 */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-[var(--bg-card)] rounded-xl p-6">
          <h3 className="text-base font-medium mb-4">文件格式分布</h3>
          <FormatChart data={result.format_distribution} />
        </div>
        <div className="bg-[var(--bg-card)] rounded-xl p-6">
          <h3 className="text-base font-medium mb-4">PDF页面类型</h3>
          <PdfPageTypeChart pageStats={result.pdf_page_stats} />
        </div>
      </div>

      {/* 长度分布 */}
      <div className="bg-[var(--bg-card)] rounded-xl p-6 mt-8">
        <h3 className="text-base font-medium mb-6">📊 文档长度分布</h3>
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
            <h4 className="text-sm font-medium mb-4 text-[var(--text-secondary)]">分位数统计</h4>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 text-sm text-[var(--text-muted)]">最小值</td>
                  <td className="py-1 text-sm text-right font-medium text-[var(--accent-primary)]">
                    {formatNumber(lengthStats.min)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-sm text-[var(--text-muted)]">P25 (25%)</td>
                  <td className="py-1 text-sm text-right font-medium text-[var(--accent-primary)]">
                    {formatNumber(Math.round(lengthStats.p25 || 0))}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-sm text-[var(--text-muted)]">中位数 (P50)</td>
                  <td className="py-1 text-sm text-right font-medium text-[var(--accent-primary)]">
                    {formatNumber(Math.round(lengthStats.median || 0))}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-sm text-[var(--text-muted)]">P75 (75%)</td>
                  <td className="py-1 text-sm text-right font-medium text-[var(--accent-primary)]">
                    {formatNumber(Math.round(lengthStats.p75 || 0))}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-sm text-[var(--text-muted)]">P90 (90%)</td>
                  <td className="py-1 text-sm text-right font-medium text-[var(--accent-primary)]">
                    {formatNumber(Math.round(lengthStats.p90 || 0))}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-sm text-[var(--text-muted)]">最大值</td>
                  <td className="py-1 text-sm text-right font-medium text-[var(--accent-primary)]">
                    {formatNumber(lengthStats.max)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
            <h4 className="text-sm font-medium mb-4 text-[var(--text-secondary)]">长度分布区间</h4>
            <LengthChart stats={lengthStats} />
          </div>
        </div>
      </div>

      {/* 结构数据 */}
      <div className="bg-[var(--bg-card)] rounded-xl p-6 mt-8">
        <h3 className="text-base font-medium mb-6">🔧 结构数据</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-2 px-4 text-left text-sm font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)]">指标</th>
              <th className="py-2 px-4 text-left text-sm font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)]">数量</th>
              <th className="py-2 px-4 text-left text-sm font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)]">占比</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 text-sm border-b border-[var(--border-color)]">含表格文档</td>
              <td className="py-2 px-4 text-sm border-b border-[var(--border-color)]">{structureStats.docs_with_tables || 0}</td>
              <td className="py-2 px-4 text-sm border-b border-[var(--border-color)]">
                {Math.round((structureStats.docs_with_tables || 0) / total * 100)}%
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 text-sm border-b border-[var(--border-color)]">含图片文档</td>
              <td className="py-2 px-4 text-sm border-b border-[var(--border-color)]">{structureStats.docs_with_images || 0}</td>
              <td className="py-2 px-4 text-sm border-b border-[var(--border-color)]">
                {Math.round((structureStats.docs_with_images || 0) / total * 100)}%
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 text-sm border-b border-[var(--border-color)]">有标题层级</td>
              <td className="py-2 px-4 text-sm border-b border-[var(--border-color)]">{structureStats.docs_with_headings || 0}</td>
              <td className="py-2 px-4 text-sm border-b border-[var(--border-color)]">
                {Math.round((structureStats.docs_with_headings || 0) / total * 100)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 审核台 - 相似度检测 */}
      <div className="bg-[var(--bg-card)] rounded-xl mt-8 overflow-hidden">
        <div className="flex items-center justify-between p-6 bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors">
          <h3 className="text-base font-medium">🔄 相似度检测</h3>
          <span className="text-sm text-[var(--text-secondary)]">
            涉及 <strong className="text-[var(--accent-primary)]">{similarFilesCount}</strong> 份文档，
            共 <strong className="text-[var(--accent-primary)]">{similarGroups.length}</strong> 组
          </span>
        </div>
        <div className="p-6 max-h-[600px] overflow-y-auto">
          <SimilarGroups groups={similarGroups} />
        </div>
      </div>
    </section>
  )
}
