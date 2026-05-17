import { memo } from 'react'
import { genererMoisGroupes, joursEntreDates, estWeekend, memeJour } from '../../utils/dateHelpers'

const JOUR_PAR_SEMAINE = 7

function GanttHeaderImpl({ semaines, periodeDebut, pxParJour, today, largeurNom }) {
  const groupes = genererMoisGroupes(semaines)
  const largeurSemaine = pxParJour * JOUR_PAR_SEMAINE
  const totalJours = semaines.length * JOUR_PAR_SEMAINE
  const offsetAujourdhui = Math.max(0, joursEntreDates(periodeDebut, today)) * pxParJour
  const aujourdhuiVisible = today >= periodeDebut

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-[#ece2d3]">
      <div className="flex">
        <div
          className="shrink-0 border-r border-[#ece2d3] bg-[#fbf7f0]"
          style={{ width: largeurNom }}
        />
        <div className="relative overflow-hidden" style={{ width: totalJours * pxParJour }}>
          {/* Bandeau mois */}
          <div className="flex border-b border-[#ece2d3]">
            {groupes.map((g) => (
              <div
                key={g.cle}
                className="text-[11px] font-display font-semibold text-[#1C1817] px-2 py-1.5 truncate border-r border-[#ece2d3] bg-[#fbf7f0]"
                style={{ width: g.semaines * largeurSemaine }}
              >
                {g.label}
              </div>
            ))}
          </div>
          {/* Bandeau semaines */}
          <div className="flex">
            {semaines.map((s, i) => {
              const wkBg = (estWeekend(s.debut) || estWeekend(s.fin)) ? 'bg-[#F1EFE8]' : ''
              return (
                <div
                  key={i}
                  className={`text-[10px] font-mono text-[#A59F9B] px-1 py-1 border-r border-[#ece2d3] ${wkBg}`}
                  style={{ width: largeurSemaine }}
                >
                  S{s.num}
                </div>
              )
            })}
          </div>
          {/* Trait "aujourd'hui" */}
          {aujourdhuiVisible && (
            <div
              className="absolute top-0 bottom-0 border-l-2 border-[#E24B4A] z-10 pointer-events-none"
              style={{ left: offsetAujourdhui }}
              title="Aujourd'hui"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(GanttHeaderImpl)
