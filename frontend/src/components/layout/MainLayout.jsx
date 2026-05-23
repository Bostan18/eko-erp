import { Suspense, useEffect, useRef } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { AlertsProvider } from '../../context/AlertsContext'
import useAuthStore from '../../store/authStore'
import { SkeletonPage } from '../ui/Skeleton'

// Renvoie le préfixe « parent » d'un path : /comptabilite/factures → /comptabilite
const parentOf = (p) => (p ? p.split('/').slice(0, -1).join('/') : '')

export default function MainLayout() {
  const token = useAuthStore((s) => s.token)
  const { pathname } = useLocation()

  // Détection « onglet voisin du même module » → on supprime l'animation .screen
  // pour que le swap d'onglet ne donne plus l'impression d'un rechargement.
  const prevPath = useRef(pathname)
  const parentNow  = parentOf(pathname)
  const parentPrev = parentOf(prevPath.current)
  const isSiblingNav = !!parentNow && parentNow === parentPrev

  useEffect(() => {
    prevPath.current = pathname
  }, [pathname])

  if (!token) return <Navigate to="/login" replace />

  return (
    <AlertsProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-sand-100">
            <div className="p-[22px] max-w-[1400px] mx-auto">
              {/* key={pathname} → reset le sous-arbre à chaque route.
                  .screen anime SAUF entre onglets sœurs (swap instantané). */}
              <div key={pathname} className={isSiblingNav ? '' : 'screen'}>
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
