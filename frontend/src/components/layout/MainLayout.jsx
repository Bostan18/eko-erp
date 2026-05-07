import { Suspense } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import useAuthStore from '../../store/authStore'

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 font-body text-sm">Chargement…</p>
    </div>
  )
}

export default function MainLayout() {
  const token = useAuthStore((s) => s.token)

  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
