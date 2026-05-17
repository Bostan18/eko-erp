import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import GanttBar from './GanttBar'
import { dateFR, parseISO } from '../../utils/dateHelpers'

const HAUTEUR_LIGNE_PROJET = 44
const HAUTEUR_LIGNE_TACHE  = 28

function statutLabelTache(s) {
  return { a_faire: 'À faire', en_cours: 'En cours', terminee: 'Terminée', annulee: 'Annulée' }[s] ?? s
}

function GanttRowImpl({ projet, periodeDebut, pxParJour, largeurNom, largeurTimeline }) {
  const [ouvert, setOuvert] = useState(false)
  const aDesTaches = (projet.taches?.length ?? 0) > 0

  const tooltipProjet =
    `${projet.nom}\n` +
    `Client : ${projet.client_nom || '—'}\n` +
    `Période : ${dateFR(parseISO(projet.date_debut))} → ${dateFR(parseISO(projet.date_fin_prevue))}\n` +
    `Progression : ${Math.round(projet.progression_pct)} %` +
    (projet.est_en_retard ? '\n⚠ En retard' : '')

  return (
    <div className="border-b border-[#f4ebe0] hover:bg-[#E1F5EE]/40 transition-colors">
      {/* Ligne projet */}
      <div className="flex" style={{ height: HAUTEUR_LIGNE_PROJET }}>
        <div
          className="shrink-0 px-3 py-2 border-r border-[#ece2d3] bg-[#fbf7f0] flex items-center gap-2"
          style={{ width: largeurNom }}
        >
          {aDesTaches ? (
            <button
              type="button"
              onClick={() => setOuvert((v) => !v)}
              aria-label={ouvert ? 'Replier' : 'Déplier'}
              className="text-[#A59F9B] hover:text-[#1C1817] transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 transition-transform ${ouvert ? 'rotate-90' : ''}`}>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <Link
              to={`/projets/${projet.id}`}
              className="block font-display text-[13px] font-medium text-[#1C1817] hover:text-forest-700 truncate"
              title={projet.nom}
            >
              {projet.nom}
            </Link>
            <p className="font-body text-[11px] text-[#A59F9B] truncate">{projet.client_nom || '—'}</p>
          </div>
        </div>
        <div className="relative" style={{ width: largeurTimeline, height: HAUTEUR_LIGNE_PROJET }}>
          <GanttBar
            dateDebut={projet.date_debut}
            dateFin={projet.date_fin_prevue}
            periodeDebut={periodeDebut}
            pxParJour={pxParJour}
            couleur={projet.couleur}
            progression={projet.progression_pct}
            enRetard={projet.est_en_retard}
            termine={projet.statut === 'termine'}
            planifie={projet.statut === 'planifie'}
            hauteur={28}
            label={projet.nom}
            tooltip={tooltipProjet}
            href={`/projets/${projet.id}`}
          />
        </div>
      </div>

      {/* Lignes tâches */}
      {ouvert && projet.taches.map((t) => (
        <div key={t.id} className="flex" style={{ height: HAUTEUR_LIGNE_TACHE }}>
          <div
            className="shrink-0 pl-10 pr-3 py-1 border-r border-[#ece2d3] bg-[#fbf7f0] flex items-center"
            style={{ width: largeurNom }}
          >
            <Link
              to={`/projets/${projet.id}/taches/${t.id}`}
              className="font-body text-[12px] text-[#1C1817] hover:text-forest-700 truncate"
              title={t.nom}
            >
              {t.nom}
            </Link>
          </div>
          <div className="relative" style={{ width: largeurTimeline, height: HAUTEUR_LIGNE_TACHE }}>
            <GanttBar
              dateDebut={t.date_debut}
              dateFin={t.date_fin_prevue}
              periodeDebut={periodeDebut}
              pxParJour={pxParJour}
              couleur={projet.couleur}
              progression={t.progression_pct}
              termine={t.statut === 'terminee'}
              planifie={t.statut === 'a_faire'}
              hauteur={20}
              label={t.nom}
              tooltip={`${t.nom}\n${statutLabelTache(t.statut)} · ${Math.round(t.progression_pct)} %`}
              href={`/projets/${projet.id}/taches/${t.id}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default memo(GanttRowImpl)
