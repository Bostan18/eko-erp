import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const nav = [
  {
    label: 'Tableau de bord', path: '/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'RH & Paie', path: '/rh',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    children: [
      { label: 'Employés', path: '/rh' },
      { label: 'Pointage', path: '/rh/pointage' },
    ],
  },
  {
    label: 'Projets', path: '/projets',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M2 20h20M5 20V8l7-5 7 5v12" /><path d="M9 20v-5h6v5" />
      </svg>
    ),
  },
  {
    label: 'CRM', path: '/crm',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Stocks', path: '/stocks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M5 8h14M5 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-14 0-2-4h18l-2 4" />
      </svg>
    ),
  },
  {
    label: 'Comptabilité', path: '/comptabilite',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M6 15h2M10 15h4" />
      </svg>
    ),
    children: [
      { label: 'Factures', path: '/comptabilite/factures' },
      { label: 'Charges',  path: '/comptabilite/charges' },
    ],
  },
  {
    label: 'Reporting', path: '/reporting',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-forest-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-forest-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-forest-500 rounded-lg flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M12 2C8 2 4 5 4 9c0 5 8 13 8 13s8-8 8-13c0-4-4-7-8-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
            </svg>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-tight">EKO SARL</p>
            <p className="font-body text-forest-400 text-xs">Système ERP</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ label, path, icon, children }) => {
          const parentActive = location.pathname === path || (children && location.pathname.startsWith(path + '/'))
          return (
            <div key={path}>
              <NavLink
                to={children ? children[0].path : path}
                end={!children && path === '/'}
                className={() =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display font-medium transition-all duration-150 ${
                    parentActive
                      ? 'bg-forest-700 text-white'
                      : 'text-forest-300 hover:bg-forest-800 hover:text-white'
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
              {children && parentActive && (
                <div className="ml-8 mt-0.5 space-y-0.5">
                  {children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end
                      className={({ isActive }) =>
                        `block px-3 py-1.5 rounded-md text-xs font-display font-medium transition-colors ${
                          isActive
                            ? 'text-white bg-forest-600'
                            : 'text-forest-400 hover:text-white hover:bg-forest-800'
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-forest-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 bg-forest-600 rounded-full flex items-center justify-center shrink-0">
            <span className="font-display text-white text-xs font-bold">
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-white text-xs font-medium truncate">{user?.username ?? 'Utilisateur'}</p>
            <p className="text-forest-400 text-xs truncate">Admin</p>
          </div>
          <button onClick={handleLogout} title="Déconnexion" className="text-forest-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
