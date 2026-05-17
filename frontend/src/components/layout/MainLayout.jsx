import { Suspense, useEffect, useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import { matchActive } from './modules'
import useAuthStore from '../../store/authStore'
import OfflineBanner from '../offline/OfflineBanner'
import InstallPrompt from '../offline/InstallPrompt'

const COLLAPSED_KEY = 'eko.sidebar.collapsed'

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-[#A59F9B] font-body text-sm">Chargement…</p>
    </div>
  )
}

export default function MainLayout() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1')

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    // Auto-sync au passage online + prefetch initial des données de référence
    Promise.all([
      import('../../offline/syncManager'),
      import('../../offline/networkStatus'),
    ]).then(([offline, net]) => {
      if (cancelled) return
      offline.prefetchReferenceData()
      const handler = () => offline.syncAll().catch(() => {})
      window.addEventListener('online', handler)
      if (net.isOnline()) offline.syncAll().catch(() => {})
      return () => window.removeEventListener('online', handler)
    })
    return () => { cancelled = true }
  }, [token])

  if (!token) return <Navigate to="/login" replace />

  const { modId, childId } = matchActive(location.pathname)

  return (
    <div className="flex min-h-screen bg-[#fbf7f0]">
      <div className="hidden md:block">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          activeModId={modId}
          activeChildId={childId}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 bg-[#faf6ee]">
        <OfflineBanner />
        <div className="hidden md:block">
          <Header activeModId={modId} activeChildId={childId} />
        </div>

        <div className="flex-1 p-4 md:p-7 pb-20 md:pb-7">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <BottomNav activeModId={modId} />
      <InstallPrompt />
    </div>
  )
}
