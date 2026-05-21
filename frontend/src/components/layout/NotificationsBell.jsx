import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../../context/AlertsContext'
import { useClickOutside } from '../../hooks/useClickOutside'
import { tempsRelatif } from '../../utils/format'

const TONE_DOT = {
  bad:  'bg-red-500',
  good: 'bg-forest-500',
  info: 'bg-blue-500',
}
const TONE_BADGE = {
  bad:  'badge-red',
  good: 'badge-green',
  info: 'badge-blue',
}

export default function NotificationsBell() {
  const { activite, totalAlertes, loading } = useAlerts()
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useClickOutside(ref, () => setOuvert(false), ouvert)

  function ouvrir(event) {
    setOuvert(false)
    if (event?.url) navigate(event.url)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOuvert((v) => !v)}
        className="w-8 h-8 rounded-lg border border-sand-200 bg-white flex items-center justify-center hover:bg-sand-50 relative"
        title="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-sand-700">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {totalAlertes > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center
                           bg-red-500 text-white text-[9px] font-mono font-bold rounded-full ring-2 ring-white">
            {totalAlertes > 9 ? '9+' : totalAlertes}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 mt-2 w-[340px] bg-white border border-sand-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-sand-100">
            <p className="font-display font-semibold text-[13px] text-ink">Activité récente</p>
            {totalAlertes > 0 && (
              <span className="badge-red">{totalAlertes} alerte{totalAlertes > 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading && activite.length === 0 && (
              <p className="px-4 py-6 text-center text-[12px] text-sand-500">Chargement…</p>
            )}
            {!loading && activite.length === 0 && (
              <p className="px-4 py-6 text-center text-[12px] text-sand-500">Aucune activité récente.</p>
            )}
            {activite.map((e, i) => (
              <button
                key={`${e.id}-${i}`}
                onClick={() => ouvrir(e)}
                className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-sand-50 transition-colors border-b border-sand-50 last:border-0"
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${TONE_DOT[e.tone] ?? 'bg-sand-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-medium text-[12.5px] text-ink truncate flex-1">{e.label}</p>
                    {e.status && (
                      <span className={`${TONE_BADGE[e.tone] ?? 'badge-gray'} shrink-0`}>{e.status}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-sand-500 mt-0.5 truncate">
                    {e.meta}
                    {e.meta && e.date && <span className="text-sand-300 mx-1">·</span>}
                    {e.date && <span>{tempsRelatif(e.date)}</span>}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
