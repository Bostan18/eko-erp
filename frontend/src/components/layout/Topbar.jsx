import { useLocation } from 'react-router-dom'
import GlobalSearch from './GlobalSearch'
import NotificationsBell from './NotificationsBell'
import { breadcrumbFor } from './modules'

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const crumb = breadcrumbFor(pathname)
  const current = crumb[crumb.length - 1]
  const parents = crumb.slice(0, -1)

  return (
    <header className="h-[52px] bg-white border-b border-sand-200 flex items-center px-3 md:px-6 gap-2 md:gap-4 shrink-0">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
        className="md:hidden -ml-1 p-2 rounded-lg text-sand-700 hover:bg-sand-100 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex items-baseline gap-2 min-w-0">
        <p className="font-display font-semibold text-sm truncate">{current}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500 hidden md:flex items-center gap-1">
          {parents.map((c, i) => (
            <span key={i}>
              {c}
              {i < parents.length - 1 && <span className="text-sand-300 mx-1">›</span>}
            </span>
          ))}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:block topbar-search">
          <GlobalSearch />
        </div>

        <NotificationsBell />
      </div>
    </header>
  )
}
