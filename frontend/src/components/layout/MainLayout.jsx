import { Suspense } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { AlertsProvider } from '../../context/AlertsContext'
import useAuthStore from '../../store/authStore'
import { SkeletonPage } from '../ui/Skeleton'

export default function MainLayout() {
  const token = useAuthStore((s) => s.token)
  const { pathname } = useLocation()
  if (!token) return <Navigate to="/login" replace />

  return (
    <AlertsProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-sand-100">
            <div className="p-[22px] max-w-[1400px] mx-auto">
              {/* key={pathname} → reset l'animation à chaque navigation */}
              <div key={pathname} className="screen">
                <Suspense fallback={<SkeletonPage />}>
                  <Outlet />
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AlertsProvider>
  )
}
