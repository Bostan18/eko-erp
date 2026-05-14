import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../icons'
import { MODULES } from './modules'
import useAuthStore from '../../store/authStore'

function initials(user) {
  const src = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`
    : user?.username ?? 'U'
  return src.slice(0, 2).toUpperCase()
}

function displayName(user) {
  if (user?.first_name || user?.last_name) {
    return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
  }
  return user?.username ?? 'Utilisateur'
}

export default function Sidebar({ collapsed, onToggleCollapsed, activeModId, activeChildId }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [openChild, setOpenChild] = useState(activeModId)
  const [openProfile, setOpenProfile] = useState(false)
  const [hoverTip, setHoverTip] = useState(null)

  useEffect(() => {
    setOpenChild(activeModId)
  }, [activeModId])

  useEffect(() => {
    if (!openProfile) return
    const onDoc = (e) => {
      if (!e.target.closest('[data-profile-pop]') && !e.target.closest('[data-profile-trigger]')) {
        setOpenProfile(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openProfile])

  function handleModuleClick(m) {
    navigate(m.path)
    if (m.children && !collapsed) {
      setOpenChild((prev) => (prev === m.id ? null : m.id))
    }
  }

  function handleChildClick(child) {
    navigate(child.path)
  }

  function handleLogout() {
    setOpenProfile(false)
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`shrink-0 h-screen sticky top-0 flex flex-col bg-[#212121] border-r border-black/40 transition-[width] duration-200 ease-out relative ${
        collapsed ? 'w-[68px]' : 'w-[244px]'
      }`}
    >
      {/* Brand */}
      <div className={`pt-5 pb-4 shrink-0 flex items-center ${collapsed ? 'px-3 justify-center' : 'px-5 gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-forest-600 flex items-center justify-center shadow-sm ring-1 ring-forest-400/30 shrink-0">
          <Icon.Leaf className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-white text-[15px] leading-tight">eko</div>
            <div className="text-[10.5px] font-body uppercase tracking-[0.12em] text-gray-500">EKO SARL</div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapsed}
        title={collapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-[#2a2a2a] ring-1 ring-white/10 text-gray-300 hover:text-white hover:bg-forest-600 hover:ring-forest-400/40 flex items-center justify-center shadow-md z-30 transition-colors"
      >
        <Icon.ChevronLeft className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto pb-2 space-y-0.5 ${collapsed ? 'px-2.5' : 'px-3'}`}>
        {MODULES.map((m) => {
          const I = Icon[m.icon]
          const isActive = activeModId === m.id
          const isExpanded = !collapsed && (openChild === m.id || (isActive && m.children))
          return (
            <div key={m.id} className="relative">
              <button
                onClick={() => handleModuleClick(m)}
                onMouseEnter={() => collapsed && setHoverTip(m.id)}
                onMouseLeave={() => collapsed && setHoverTip(null)}
                className={`w-full flex items-center rounded-lg text-[13.5px] font-display font-medium transition-colors relative ${
                  collapsed ? 'justify-center h-10' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-forest-500/10 text-white ring-1 ring-forest-400/25'
                    : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                {isActive && (
                  <span
                    className={`absolute top-2 bottom-2 w-[2px] rounded-r bg-forest-400 ${
                      collapsed ? '-left-2.5' : '-left-3'
                    }`}
                  />
                )}
                <I className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-forest-300' : 'text-gray-500'}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{m.label}</span>
                    {m.children && (
                      <Icon.ChevronDown
                        className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </>
                )}
              </button>

              {collapsed && hoverTip === m.id && (
                <span className="absolute left-[58px] top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-[#2a2a2a] ring-1 ring-white/[0.08] text-white text-[12px] font-display font-medium whitespace-nowrap shadow-xl z-50">
                  {m.label}
                </span>
              )}

              {m.children && isExpanded && (
                <div className="ml-[34px] mt-0.5 pl-3 border-l border-white/[0.06] space-y-0.5">
                  {m.children.map((c) => {
                    const cActive = activeChildId === c.id
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleChildClick(c)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-[12.5px] font-body transition-colors ${
                          cActive
                            ? 'text-forest-300 bg-forest-500/10'
                            : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Profile */}
      <div className={`py-3 border-t border-white/[0.06] relative shrink-0 ${collapsed ? 'px-2.5' : 'px-3'}`}>
        {openProfile && (
          <div
            data-profile-pop
            className={`absolute bottom-[68px] bg-[#2a2a2a] rounded-xl ring-1 ring-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden z-50 ${
              collapsed ? 'left-[60px] w-[220px]' : 'left-3 right-3'
            }`}
          >
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <div className="text-[13px] font-display font-semibold text-white truncate">
                {displayName(user)}
              </div>
              <div className="text-[11.5px] text-gray-400 font-body truncate">
                {user?.email ?? '—'}
              </div>
            </div>
            <div className="py-1">
              <PopItem icon="User" label="Mon profil" />
              <PopItem icon="Help" label="Aide & support" />
              <div className="h-px bg-white/[0.06] my-1 mx-2" />
              <PopItem icon="Logout" label="Déconnexion" tone="danger" onClick={handleLogout} />
            </div>
          </div>
        )}
        <button
          data-profile-trigger
          onClick={() => setOpenProfile((o) => !o)}
          className={`w-full flex items-center rounded-lg transition-colors ${
            collapsed ? 'justify-center py-1' : 'gap-3 px-2.5 py-2'
          } ${openProfile ? 'bg-white/[0.06] ring-1 ring-white/[0.08]' : 'hover:bg-white/[0.04]'}`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center shrink-0 ring-1 ring-forest-400/30">
            <span className="text-white font-display font-semibold text-[13px]">
              {initials(user)}
            </span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-white text-[13px] font-display font-medium truncate">
                  {displayName(user)}
                </div>
                <div className="text-gray-500 text-[11px] font-body truncate">
                  {user?.is_staff ? 'Administrateur' : 'Utilisateur'}
                </div>
              </div>
              <Icon.ChevronUp
                className={`w-3.5 h-3.5 text-gray-500 transition-transform ${openProfile ? '' : 'rotate-180'}`}
              />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

function PopItem({ icon, label, tone, onClick }) {
  const I = Icon[icon]
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-body transition-colors ${
        tone === 'danger'
          ? 'text-red-300 hover:bg-red-500/10'
          : 'text-gray-200 hover:bg-white/[0.06]'
      }`}
    >
      <I className="w-[15px] h-[15px]" />
      <span>{label}</span>
    </button>
  )
}
