import { useEffect, useRef } from 'react'
import { Icon } from '../icons'
import { MODULE_BY_ID } from './modules'
import SyncStatus from '../offline/SyncStatus'

export default function Header({ activeModId, activeChildId }) {
  const searchRef = useRef(null)
  const mod = MODULE_BY_ID[activeModId]
  const child = mod?.children?.find((c) => c.id === activeChildId) ?? null

  useEffect(() => {
    function onKey(e) {
      const cmd = e.metaKey || e.ctrlKey
      if (cmd && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const title = child ? child.label : mod?.label ?? 'Tableau de bord'

  return (
    <header className="bg-white/60 backdrop-blur border-b border-[#ece2d3] px-7 py-3.5 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[12.8px] font-body font-medium text-[#A59F9B] leading-[1.4]">
            <span>{mod?.group}</span>
            <Icon.Chevron className="w-3 h-3" />
            <span className="text-[#1C1817]">{mod?.label}</span>
            {child && (
              <>
                <Icon.Chevron className="w-3 h-3" />
                <span className="text-[#1C1817]">{child.label}</span>
              </>
            )}
          </div>
          <h1 className="font-display font-bold text-[#1C1817] text-[24px] leading-[1.2] mt-0.5 truncate">
            {title}
          </h1>
        </div>

        <div className="relative w-[340px] max-w-[40%] hidden md:block">
          <Icon.Search className="w-4 h-4 text-[#A59F9B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Rechercher clients, chantiers, factures…"
            className="w-full pl-9 pr-14 py-2 rounded-lg bg-white ring-1 ring-[#ece2d3] text-[14px] font-body text-[#1C1817] placeholder:text-[#A59F9B] focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] rounded bg-[#f4ebe0] text-[#8b7a5f] font-mono">
            ⌘K
          </span>
        </div>

        <SyncStatus />

        <button
          title="Notifications"
          className="px-3 py-2 rounded-lg bg-white ring-1 ring-[#ece2d3] text-[#1C1817] hover:bg-[#fbf7f0] relative"
        >
          <Icon.Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-forest-500" />
        </button>
      </div>
    </header>
  )
}
