import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseISO, joursEntreDates, dateFR } from '../../utils/dateHelpers'

/**
 * Barre horizontale colorée pour un projet ou une tâche.
 * Position et largeur en pixels, calculées par le parent ou ici à partir des dates.
 *
 * Props:
 *  - dateDebut, dateFin : strings ISO (peuvent être null)
 *  - periodeDebut       : Date — origine de la timeline
 *  - pxParJour          : pixels par jour
 *  - couleur            : hex
 *  - progression        : 0..100 (overlay foncé)
 *  - enRetard           : bool → bordure rouge + pulse
 *  - termine            : bool → opacité 0.6 + hachures
 *  - planifie           : bool → opacité 0.5 sans remplissage progression
 *  - hauteur            : px
 *  - label              : string (affiché si la barre est assez large)
 *  - tooltip            : string
 *  - href               : optionnel — clic = navigate(href)
 *  - dateDebutISO / dateFinISO : pour tooltip de dates
 */
function GanttBarImpl({
  dateDebut, dateFin,
  periodeDebut, pxParJour,
  couleur = '#888780',
  progression = 0,
  enRetard = false,
  termine = false,
  planifie = false,
  hauteur = 28,
  label,
  tooltip,
  href,
}) {
  const navigate = useNavigate()
  const d = parseISO(dateDebut)
  const f = parseISO(dateFin)
  if (!d || !f) return null

  const offset = Math.max(0, joursEntreDates(periodeDebut, d))
  const duree  = Math.max(1, joursEntreDates(d, f) + 1)
  const left   = offset * pxParJour
  const width  = duree * pxParJour - 2 // léger gap visuel

  const showLabel = width > 60 && label
  const showProgress = !planifie && progression > 0
  const bgPattern = termine
    ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 4px, transparent 4px 8px)'
    : 'none'

  const tt = tooltip ?? `${label ?? ''} · ${dateFR(d)} → ${dateFR(f)}`

  function handleClick() {
    if (href) navigate(href)
  }

  return (
    <div
      onClick={handleClick}
      title={tt}
      role={href ? 'button' : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={(e) => { if (href && (e.key === 'Enter' || e.key === ' ')) navigate(href) }}
      className={`absolute rounded-md shadow-sm transition-shadow hover:shadow-md ${href ? 'cursor-pointer' : ''} ${
        enRetard ? 'ring-2 ring-[#E24B4A]' : ''
      } ${termine ? 'opacity-60' : ''} ${planifie ? 'opacity-60' : ''}`}
      style={{
        left,
        width,
        height: hauteur,
        backgroundColor: couleur,
        backgroundImage: bgPattern,
      }}
    >
      {showProgress && (
        <div
          className="absolute inset-y-0 left-0 rounded-md"
          style={{
            width: `${Math.min(100, progression)}%`,
            backgroundColor: 'rgba(0, 0, 0, 0.22)',
          }}
        />
      )}
      {showLabel && (
        <div className="relative h-full flex items-center px-2">
          <span className="font-display text-[12px] font-medium text-white truncate drop-shadow-sm">
            {label}
            {progression > 0 && !planifie && (
              <span className="ml-1.5 opacity-80">· {Math.round(progression)}%</span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}

export default memo(GanttBarImpl)
