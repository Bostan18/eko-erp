import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { useAlerts } from '../../context/AlertsContext'
import { sidebarSections } from './modules'
import {
  IconDashboard, IconUsers, IconProjects, IconCRM, IconStocks,
  IconCard, IconShoppingBag, IconExcavator, IconShield,
  IconChartBar, IconDocument, IconSettings, IconUser, IconLogout,
} from '../ui/Icons'

const BADGE_TONE = {
  red:  'bg-red-500 text-white',
  gold: 'bg-gold-500 text-forest-950',
}

// Mapping clé (sidebarIcon dans modules.js) → composant.
const ICON_REGISTRY = {
  Dashboard:    IconDashboard,
  Users:        IconUsers,
  Projects:     IconProjects,
  CRM:          IconCRM,
  Stocks:       IconStocks,
  Card:         IconCard,
  ShoppingBag:  IconShoppingBag,
  Excavator:    IconExcavator,
  Shield:       IconShield,
  ChartBar:     IconChartBar,
  Document:     IconDocument,
  Settings:     IconSettings,
}

const NAV = sidebarSections()
const COLLAPSE_KEY = 'sidebar.collapsed'

function isActive(pathname, item) {
  if (item.exact) return pathname === item.path
  const p = item.prefix ?? item.path
  return pathname === p || pathname.startsWith(p + '/')
}

function readCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false }
}

export default function Sidebar({ open = false, onClose }) {
  const { user, logout, can } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { badges } = useAlerts()

  // Filtre par rôle : on garde un groupe seulement s'il reste des items
  // autorisés. `can()` est aligné avec apps/accounts/permissions.py.
  const navFiltered = NAV
    .map(({ section, items }) => ({
      section,
      items: items.filter((it) => can(it.id)),
    }))
    .filter(({ items }) => items.length > 0)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // collapsed = mode icon-only desktop. Mobile l'ignore (drawer slide-in plein).
  const [collapsed, setCollapsed] = useState(readCollapsed)

  // Persistance localStorage
  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0') } catch { /* quota */ }
  }, [collapsed])

  // Raccourci ⌘B / Ctrl+B — ignoré dans les champs de saisie.
  useEffect(() => {
    function onKey(e) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'b') return
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      e.preventDefault()
      setCollapsed((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <aside
      data-collapsed={collapsed ? 'true' : undefined}
      className={`
        fixed md:relative inset-y-0 left-0 z-40
        w-[240px] min-w-[240px] h-screen bg-forest-950 text-forest-100
        flex flex-col shrink-0
        transform transition-[transform,width,min-width] duration-200 ease-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        ${collapsed ? 'md:w-[56px] md:min-w-[56px]' : 'md:w-[240px] md:min-w-[240px]'}
      `}
    >
      {/* Header sidebar — hauteur calée sur la topbar (52px) */}
      <div className={`h-[52px] shrink-0 border-b border-forest-900 flex items-center
                       ${collapsed ? 'md:px-1 md:justify-center px-[18px] justify-between' : 'px-[18px] justify-between'}`}>
        <div className={collapsed ? 'md:hidden' : ''}>
          <p className="font-display font-extrabold text-white text-[22px] leading-none tracking-[-0.04em]">
            EK<span className="text-forest-500">O</span>
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-forest-500/80 mt-[3px]">
            ERP · Côte d'Ivoire
          </p>
        </div>

        {/* Toggle collapse — desktop only, sert de "logo" en mode collapsed */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Déployer (Ctrl/⌘ B)' : 'Réduire (Ctrl/⌘ B)'}
          aria-label={collapsed ? 'Déployer la sidebar' : 'Réduire la sidebar'}
          aria-pressed={collapsed}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg
                     text-forest-400 hover:text-white hover:bg-forest-900 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Close mobile */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le menu"
          className="md:hidden -mr-1 p-2 rounded-lg text-forest-300 hover:text-white hover:bg-forest-900 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Nav plate */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {navFiltered.map(({ section, items }) => (
          <div key={section} className="mb-1">
            {!collapsed && <p className="nav-eyebrow">{section}</p>}
            {collapsed && <div className="md:my-2 md:mx-3 md:border-t md:border-forest-900" />}
            {items.map((it) => {
              const { label, path, iconKey, exact } = it
              const Icon = ICON_REGISTRY[iconKey]
              const active = isActive(location.pathname, it)
              const badge = badges?.[it.prefix ?? path]

              return (
                <NavLink
                  key={path}
                  to={path}
                  end={exact}
                  title={collapsed ? label : undefined}
                  className={`nav-item ${active ? 'active' : ''}
                              ${collapsed ? 'md:justify-center md:px-0' : ''}`}
                >
                  {Icon && <Icon className="w-[15px] h-[15px] opacity-90" />}
                  <span className={`flex-1 whitespace-nowrap ${collapsed ? 'md:hidden' : ''}`}>{label}</span>
                  {badge?.count > 0 && (
                    <span className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center
                                      text-[10px] font-mono font-bold rounded-full shrink-0
                                      ${collapsed ? 'md:hidden' : ''}
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

      {/* User menu (popover dropdown) */}
      <div className="px-3 py-3 border-t border-forest-900 relative" ref={menuRef}>
        {menuOpen && (
          <div className={`absolute bg-white rounded-xl shadow-lg py-1.5 z-20 border border-sand-200 animate-popover
                          ${collapsed
                            ? 'md:left-full md:bottom-3 md:ml-2 md:w-[200px] left-3 right-3 bottom-full mb-2'
                            : 'left-3 right-3 bottom-full mb-2'}`}>
            <NavLink
              to="/profil"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink hover:bg-sand-100 font-display font-medium transition-colors"
            >
              <IconUser className="w-4 h-4 text-sand-500" />
              Mon profil
            </NavLink>
            <div className="border-t border-sand-100 my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 font-display font-medium transition-colors"
            >
              <IconLogout className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          title={collapsed ? (user?.username ?? 'Utilisateur') : undefined}
          className={`w-full flex items-center gap-2.5 rounded-lg transition-colors
                     ${menuOpen ? 'bg-forest-900' : 'hover:bg-forest-900/60'}
                     ${collapsed ? 'md:justify-center md:px-1 px-2 py-1.5' : 'px-2 py-1.5'}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <div className="w-8 h-8 bg-forest-600 rounded-full flex items-center justify-center shrink-0">
            <span className="font-display text-white text-xs font-bold">
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className={`flex-1 min-w-0 text-left ${collapsed ? 'md:hidden' : ''}`}>
            <p className="font-display text-white text-xs font-medium truncate">
              {user?.username ?? 'Utilisateur'}
            </p>
            <p className="font-mono text-forest-500 text-[10px] uppercase tracking-wider truncate">
              {user?.role_display ?? 'Utilisateur'}
            </p>
          </div>
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`w-3.5 h-3.5 text-forest-400 transition-transform duration-200
                       ${menuOpen ? 'rotate-180' : ''}
                       ${collapsed ? 'md:hidden' : ''}`}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
