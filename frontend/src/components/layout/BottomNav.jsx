import { useNavigate } from 'react-router-dom'
import { Icon } from '../icons'
import { BOTTOM_NAV_IDS, MODULE_BY_ID } from './modules'
import useAuthStore from '../../store/authStore'

export default function BottomNav({ activeModId }) {
  const navigate = useNavigate()
  const can = useAuthStore((s) => s.can)

  // Filtre par rôle pour éviter d'exposer des modules qui redirigeraient
  // immédiatement vers /. Aligné avec la Sidebar et la garde de MainLayout.
  const ids = BOTTOM_NAV_IDS.filter((id) => can(id))

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-forest-950 border-t border-forest-900 px-2 pt-1.5 pb-[max(4px,env(safe-area-inset-bottom))] z-30 md:hidden">
      <div className="flex items-stretch justify-between">
        {ids.map((id) => {
          const m = MODULE_BY_ID[id]
          if (!m) return null
          const I = Icon[m.icon]
          const isActive = activeModId === id
          return (
            <button
              key={id}
              onClick={() => navigate(m.path)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-forest-300' : 'text-forest-500/70'
              }`}
            >
              <div className={`relative px-3.5 py-1 rounded-full ${isActive ? 'bg-forest-500/15' : ''}`}>
                <I className="w-[19px] h-[19px]" />
              </div>
              <span className="text-[10px] font-display font-medium">{m.short}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
