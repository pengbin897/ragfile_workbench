import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import ScanPage from './pages/ScanPage'
import ReportPage from './pages/ReportPage'
import DetailsPage from './pages/DetailsPage'

function MainContent() {
  const { currentPage } = useApp()

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      {currentPage === 'scan' && <ScanPage />}
      {currentPage === 'report' && <ReportPage />}
      {currentPage === 'details' && <DetailsPage />}
    </main>
  )
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <MainContent />
      </div>
    </AppProvider>
  )
}
