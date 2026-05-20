import { useMemo, useRef, useEffect } from 'react'
import GanttHeader from './GanttHeader'
import GanttRow from './GanttRow'
import {
  parseISO, genererSemaines, joursEntreDates,
} from '../../utils/dateHelpers'

const LARGEUR_NOM      = 220   // colonne gauche
const PX_PAR_JOUR_DEF  = 16    // ~ 112 px / semaine

export default function GanttView({ data, pxParJour = PX_PAR_JOUR_DEF, scrollOnToday = false }) {
  const scrollRef = useRef(null)
  const periodeDebut = useMemo(() => parseISO(data.periode.debut), [data.periode.debut])
  const periodeFin   = useMemo(() => parseISO(data.periode.fin),   [data.periode.fin])
  const today        = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0); return t
  }, [])

  const semaines = useMemo(
    () => genererSemaines(periodeDebut, periodeFin),
    [periodeDebut, periodeFin],
  )

  const largeurTimeline = semaines.length * 7 * pxParJour

  useEffect(() => {
    if (!scrollOnToday || !scrollRef.current) return
    const offset = Math.max(0, joursEntreDates(periodeDebut, today)) * pxParJour
    scrollRef.current.scrollTo({ left: Math.max(0, offset - 200), behavior: 'smooth' })
  }, [scrollOnToday, periodeDebut, today, pxParJour])

  if (data.projets.length === 0) {
    return (
      <div className="card p-12 text-center text-sand-500 font-body">
        Aucun projet sur cette période.
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {/* Vue Gantt (>= md) : timeline scrollable */}
      <div ref={scrollRef} className="hidden md:block overflow-x-auto">
        <div style={{ minWidth: LARGEUR_NOM + largeurTimeline }}>
          <GanttHeader
            semaines={semaines}
            periodeDebut={periodeDebut}
            pxParJour={pxParJour}
            today={today}
            largeurNom={LARGEUR_NOM}
          />
          <div>
            {data.projets.map((p) => (
              <GanttRow
                key={p.id}
                projet={p}
                periodeDebut={periodeDebut}
                pxParJour={pxParJour}
                largeurNom={LARGEUR_NOM}
                largeurTimeline={largeurTimeline}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Vue mobile (< md) : liste compacte avec mini-barre */}
      <div className="md:hidden divide-y divide-sand-100">
        {data.projets.map((p) => (
          <MobileRow key={p.id} projet={p} />
        ))}
      </div>
    </div>
  )
}

function MobileRow({ projet }) {
  const prog = Math.min(100, Math.round(projet.progression_pct))
  return (
    <a
      href={`/projets/${projet.id}`}
      className="block px-4 py-3 hover:bg-sand-50 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="font-display text-[14px] font-medium text-ink truncate">{projet.nom}</p>
        <span className="font-mono text-[11px] text-sand-500 shrink-0">{prog}%</span>
      </div>
      <p className="font-body text-[12px] text-sand-500 mb-2 truncate">{projet.client_nom || '—'}</p>
      <div
        className={`h-2 rounded-full overflow-hidden bg-sand-100 ${projet.est_en_retard ? 'ring-2 ring-red-500' : ''}`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${prog}%`, backgroundColor: projet.couleur }}
        />
      </div>
    </a>
  )
}
