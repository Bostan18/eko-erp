import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'
import { matchActive } from './modules'
import { AlertsProvider } from '../../context/AlertsContext'
import useAuthStore from '../../store/authStore'
import { SkeletonPage } from '../ui/Skeleton'
import ErrorBoundary from '../ui/ErrorBoundary'
import PWAUpdatePrompt from '../PWAUpdatePrompt'

const parentOf = (p) => (p ? p.split('/').slice(0, -1).join('/') : '')

export default function MainLayout() {
  const token   = useAuthStore((s) => s.token)
  const user    = useAuthStore((s) => s.user)
  const loadMe  = useAuthStore((s) => s.loadMe)
  const can     = useAuthStore((s) => s.can)
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

  // Si on a un token mais pas de profil chargé (refresh sur user vieux
  // localStorage sans `modules`), on hydrate via /me. Loader pendant ce temps.
  const needsBootstrap = !!token && (!user || !Array.isArray(user.modules))
  useEffect(() => {
    if (needsBootstrap) loadMe()
  }, [needsBootstrap, loadMe])

  if (!token) return <Navigate to="/login" replace />
  if (needsBootstrap) {
    return (
      <div className="h-screen flex items-center justify-center bg-sand-100">
        <SkeletonPage />
      </div>
    )
  }

  const { modId } = matchActive(pathname)

  // Garde de route : si l'utilisateur n'a pas accès à ce module, on
  // redirige vers le dashboard. Le dashboard reste ouvert à tous les rôles.
  if (modId !== 'dashboard' && !can(modId)) {
    return <Navigate to="/" replace />
  }

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
                <ErrorBoundary>
                  <Suspense fallback={<SkeletonPage />}>
                    <Outlet />
                  </Suspense>
                </ErrorBoundary>
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
