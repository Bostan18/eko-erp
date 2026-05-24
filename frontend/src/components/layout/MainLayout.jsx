import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'
import { matchActive } from './modules'
import { AlertsProvider } from '../../context/AlertsContext'
import useAuthStore from '../../store/authStore'
import { SkeletonPage } from '../ui/Skeleton'
import PWAUpdatePrompt from '../PWAUpdatePrompt'

const parentOf = (p) => (p ? p.split('/').slice(0, -1).join('/') : '')

export default function MainLayout() {
  const token = useAuthStore((s) => s.token)
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const prevPath = useRef(pathname)
  const parentNow  = parentOf(pathname)
  const parentPrev = parentOf(prevPath.current)
  const isSiblingNav = !!parentNow && parentNow === parentPrev

  useEffect(() => {
    prevPath.current = pathname
    setSidebarOpen(false)
  }, [pathname])

  if (!token) return <Navigate to="/login" replace />

  const { modId } = matchActive(pathname)

  return (
    <AlertsProvider>
      <div className="flex h-screen overflow-hidden">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/55 z-30 md:hidden"
            aria-hidden="true"
          />
        )}

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-sand-100 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
            <div className="p-3 md:p-[22px] max-w-[1400px] mx-auto">
              <div key={pathname} className={isSiblingNav ? '' : 'screen'}>
                <Suspense fallback={<SkeletonPage />}>
                  <Outlet />
                </Suspense>
              </div>
            </div>
          </main>
        </div>

        <BottomNav activeModId={modId} />
        <PWAUpdatePrompt />
      </div>
    </AlertsProvider>
  )
}
