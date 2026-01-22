### 主要功能
+ 文档扫描（SSE 进度更新）
+ 分析报告（摘要、分类、统计）
+ 详细统计（图表、结构数据、相似度检测）
+ 主题切换（暗色/亮色）
+ 文件打开、报告导出等

### 项目结构
```
web/
├── index.html              # HTML 入口
├── package.json            # 依赖配置
├── vite.config.js          # Vite 配置（含 API 代理）
├── tailwind.config.js      # TailwindCSS 配置
├── postcss.config.js       # PostCSS 配置
└── src/
    ├── main.jsx            # React 入口
    ├── App.jsx             # 主应用组件
    ├── index.css           # 全局样式 + Tailwind
    ├── context/
    │   └── AppContext.jsx  # 全局状态管理（页面切换、主题、扫描结果）
    ├── components/
    │   ├── Sidebar.jsx     # 侧边栏组件
    │   ├── Charts.jsx      # ECharts 图表组件
    │   ├── FileList.jsx    # 文件列表组件
    │   └── SimilarGroups.jsx # 相似文档组组件
    ├── pages/
    │   ├── ScanPage.jsx    # 文档扫描页面
    │   ├── ReportPage.jsx  # 分析报告页面
    │   └── DetailsPage.jsx # 详细统计页面
    └── utils/
        ├── api.js          # API 调用函数
        └── format.js       # 格式化工具函数
```
