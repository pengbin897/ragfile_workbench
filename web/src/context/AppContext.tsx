import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { ScanResult } from '../utils/api'

type PageType = 'scan' | 'report' | 'details'
type ThemeType = 'light' | 'dark'

interface AppContextValue {
  currentPage: PageType
  setCurrentPage: (page: PageType) => void
  scanResult: ScanResult | null
  setScanResult: (result: ScanResult | null) => void
  currentTaskId: string | null
  setCurrentTaskId: (taskId: string | null) => void
  theme: ThemeType
  toggleTheme: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [currentPage, setCurrentPage] = useState<PageType>('scan')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [theme, setTheme] = useState<ThemeType>(() => {
    return (localStorage.getItem('theme') as ThemeType) || 'dark'
  })

  // 初始化主题
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [theme])

  const toggleTheme = () => {
    const newTheme: ThemeType = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const value: AppContextValue = {
    currentPage,
    setCurrentPage,
    scanResult,
    setScanResult,
    currentTaskId,
    setCurrentTaskId,
    theme,
    toggleTheme
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
