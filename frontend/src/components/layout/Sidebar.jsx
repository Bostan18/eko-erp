import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { useAlerts } from '../../context/AlertsContext'

const BADGE_TONE = {
  red:  'bg-red-500 text-white',
  gold: 'bg-gold-500 text-forest-950',
}

/**
 * Sidebar plate, alignée maquette.
 * `path` = cible de navigation (1er onglet d'un module).
 * `prefix` = préfixe d'URL pour matcher l'état actif (le sous-onglet courant
 *            laisse le parent surligné).
 * Les ModuleTabs in-page prennent le relais pour naviguer entre sous-pages.
 */
const NAV = [
  {
    section: "Vue d'ensemble",
    items: [
      { label: 'Tableau de bord', path: '/', exact: true, icon: IconDash },
    ],
  },
  {
    section: 'Comptabilité',
    items: [
      { label: 'Facturation FNE',     path: '/comptabilite/factures', prefix: '/comptabilite', icon: IconCompta },
      { label: 'Achats & Trésorerie', path: '/achats/factures',       prefix: '/achats',       icon: IconAchats },
    ],
  },
  {
    section: 'Ressources Humaines',
    items: [
      { label: 'RH & Paie', path: '/rh', prefix: '/rh', icon: IconRH },
    ],
  },
  {
    section: 'Opérations',
    items: [
      { label: 'Projets',            path: '/projets',          prefix: '/projets',    icon: IconProjets },
      { label: 'Opérations terrain', path: '/operations/sites', prefix: '/operations', icon: IconOperations },
      { label: 'Parc machines',      path: '/parc',             prefix: '/parc',       icon: IconParc },
      { label: 'Stocks',             path: '/stocks',           prefix: '/stocks',     icon: IconStocks },
    ],
  },
  {
    section: 'Commercial',
    items: [
      { label: 'CRM & Ventes', path: '/crm', prefix: '/crm', icon: IconCRM },
    ],
  },
  {
    section: 'Analyse',
    items: [
      { label: 'BI & Reporting', path: '/reporting',  prefix: '/reporting',  icon: IconReport },
      { label: 'Documents',      path: '/documents',  prefix: '/documents',  icon: IconDoc },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { label: 'Paramètres', path: '/parametres', prefix: '/parametres', icon: IconSettings },
    ],
  },
]

function isActive(pathname, item) {
  if (item.exact) return pathname === item.path
  const p = item.prefix ?? item.path
  return pathname === p || pathname.startsWith(p + '/')
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { badges } = useAlerts()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 min-w-[15rem] h-screen bg-forest-950 text-forest-100 flex flex-col shrink-0">
      {/* Logo — wordmark maquette : EK<span vert>O</span> */}
      <div className="px-[18px] py-[18px] border-b border-forest-900">
        <p className="font-display font-extrabold text-white text-[24px] leading-none tracking-[-0.04em]">
          EK<span className="text-forest-500">O</span>
        </p>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-forest-500/80 mt-[3px]">
          ERP · Côte d'Ivoire
        </p>
      </div>

      {/* Nav plate */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map(({ section, items }) => (
          <div key={section} className="mb-1">
            <p className="nav-eyebrow">{section}</p>
            {items.map((it) => {
              const { label, path, icon: Icon, exact } = it
              const active = isActive(location.pathname, it)
              const badge = badges?.[it.prefix ?? path]

              return (
                <NavLink
                  key={path}
                  to={path}
                  end={exact}
                  className={`nav-item ${active ? 'active' : ''}`}
                >
                  <Icon className="w-[15px] h-[15px] opacity-90" />
                  <span className="flex-1">{label}</span>
                  {badge?.count > 0 && (
                    <span className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center
                                      text-[10px] font-mono font-bold rounded-full shrink-0
                                      ${BADGE_TONE[badge.tone] ?? 'bg-forest-600 text-white'}`}>
                      {badge.count > 99 ? '99+' : badge.count}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3 border-t border-forest-900">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 bg-forest-600 rounded-full flex items-center justify-center shrink-0">
            <span className="font-display text-white text-xs font-bold">
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-white text-xs font-medium truncate">
              {user?.username ?? 'Utilisateur'}
            </p>
            <p className="font-mono text-forest-500 text-[10px] uppercase tracking-wider truncate">
              Admin
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="text-forest-400 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─── Icons (Lucide-like, stroke 1.8) ─────────────────────── */
function IconDash({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function IconRH({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconProjets({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M2 20h20M5 20V8l7-5 7 5v12" /><path d="M9 20v-5h6v5" />
    </svg>
  )
}
function IconCRM({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconStocks({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M5 8h14M5 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-14 0-2-4h18l-2 4" />
    </svg>
  )
}
function IconCompta({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
      <path d="M6 15h2M10 15h4" />
    </svg>
  )
}
function IconAchats({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M2 7h20l-1.5 10.5a2 2 0 0 1-2 1.5H5.5a2 2 0 0 1-2-1.5L2 7Z" />
      <path d="M8 7V5a4 4 0 0 1 8 0v2" />
    </svg>
  )
}
function IconParc({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M3 17h14v-5a3 3 0 0 0-3-3H3v8Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="15" cy="18" r="2" />
      <path d="M17 12h3l1 2v3h-4" />
    </svg>
  )
}
function IconOperations({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}
function IconReport({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  )
}
function IconDoc({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  )
}
function IconSettings({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
