import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { useEffect } from 'react'

import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import DiscoverPage from './pages/DiscoverPage'
import SettingsPage from './pages/SettingsPage'
import { useTauriEvents } from './hooks/useTauriEvents'
import { useAppStore } from './stores/useAppStore'
import LoadingOverlay from './components/skills/LoadingOverlay'
import { useTranslation } from 'react-i18next'
import './App.css'

function App() {
  const { isTauri } = useTauriEvents()
  const { isLoading, actionMessage, loadingStartAt, error, successMessage, clearStatus } = useAppStore()
  const { t } = useTranslation()

  // Handle global toasts
  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 3000 })
      clearStatus()
    }
    if (successMessage) {
      toast.success(successMessage, { duration: 2000 })
      clearStatus()
    }
  }, [error, successMessage, clearStatus])

  if (!isTauri) {
    // Optional: Show non-tauri warning
    return <div className="p-4 text-red-500">Error: Not running in Tauri environment.</div>
  }

  return (
    <BrowserRouter>
      {/* Global Overlay */}
      <LoadingOverlay
        loading={isLoading}
        actionMessage={actionMessage}
        loadingStartAt={loadingStartAt}
        t={t}
      />
      <Toaster position="top-right" richColors />

      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
