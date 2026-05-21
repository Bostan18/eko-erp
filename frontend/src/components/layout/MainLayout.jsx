import { Suspense } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { AlertsProvider } from '../../context/AlertsContext'
import useAuthStore from '../../store/authStore'

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sand-500 font-body text-sm">Chargement…</p>
    </div>
  )
}

export default function MainLayout() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />

  return (
    <AlertsProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-sand-100">
            <div className="px-7 py-6 max-w-[1400px] mx-auto">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </AlertsProvider>
  )
}
