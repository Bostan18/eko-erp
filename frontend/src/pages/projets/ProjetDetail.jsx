import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import TacheForm from '../../components/forms/TacheForm'
import { fmt } from '../../utils/format'

const STATUT_TONE = {
  planifie: 'gray', en_cours: 'blue', suspendu: 'gold',
  termine: 'green', annule: 'red',
}
const STATUT_LABEL = {
  planifie: 'Planifié', en_cours: 'En cours', suspendu: 'Suspendu',
  termine: 'Terminé', annule: 'Annulé',
}
const TYPE_LABEL = {
  btp: 'BTP', agriculture: 'Agriculture', pepiniere: 'Pépinière',
  location: 'Location', espaces_verts: 'Espaces verts',
}
const TACHE_STATUT_TONE = {
  a_faire: 'gray', en_cours: 'blue', terminee: 'green', annulee: 'red',
}
const TACHE_STATUT_LABEL = {
  a_faire: 'À faire', en_cours: 'En cours', terminee: 'Terminée', annulee: 'Annulée',
}

export default function ProjetDetail() {
  const { id } = useParams()
  const [projet, setProjet]             = useState(null)
  const [intervenants, setIntervenants] = useState([])
  const [mouvements, setMouvements]     = useState([])
  const [taches, setTaches]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [modalTache, setModalTache]     = useState(false)

  const chargerTaches = useCallback(() => {
    api.get(`/projets/taches/?projet=${id}`).then(({ data }) => setTaches(data.results ?? data))
  }, [id])

  useEffect(() => {
    Promise.all([
      api.get(`/projets/projets/${id}/`),
      api.get(`/projets/intervenants/?projet=${id}`),
      api.get(`/stocks/mouvements/?projet=${id}`),
      api.get(`/projets/taches/?projet=${id}`),
    ])
      .then(([{ data: p }, { data: i }, { data: m }, { data: t }]) => {
        setProjet(p)
        setIntervenants(i.results ?? i)
        setMouvements(m.results ?? m)
        setTaches(t.results ?? t)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-12 text-center text-sand-500 font-body">Chargement…</div>
  if (!projet) return <div className="p-12 text-center text-red-500 font-body">Projet introuvable.</div>

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500">
        <Link to="/projets" className="hover:text-forest-700 transition-colors">Projets</Link>
        <span className="text-sand-300">/</span>
        <span className="text-ink">{projet.code}</span>
      </div>

      {/* Header */}
      <div className="card p-6 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[11px] text-forest-700 font-medium">{projet.code}</span>
            <Badge tone={STATUT_TONE[projet.statut] ?? 'gray'}>{STATUT_LABEL[projet.statut] ?? projet.statut}</Badge>
            <Badge tone="gray">{TYPE_LABEL[projet.type_projet] ?? projet.type_projet}</Badge>
          </div>
          <h1 className="font-display font-bold text-ink text-xl">{projet.nom}</h1>
          {projet.localisation && (
            <p className="font-body text-sand-600 text-[13px] mt-1">📍 {projet.localisation}</p>
          )}
        </div>
        <Link to="/projets" className="btn-ghost">← Retour</Link>
      </div>

      {/* Détails + budget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-2">
          <p className="kpi-label mb-3">Détails</p>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-[13px] font-body">
            <Row label="Client"          value={projet.client_nom || '—'} />
            <Row label="Chef de projet"  value={projet.chef_projet_nom || '—'} />
            <Row label="Début"           value={projet.date_debut || '—'} mono />
            <Row label="Fin prévue"      value={projet.date_fin_prevue || '—'} mono />
            <Row label="Fin réelle"      value={projet.date_fin_reelle || '—'} mono />
          </dl>
          {projet.description && (
            <p className="mt-4 text-[13px] font-body text-sand-700 border-t border-sand-200 pt-4">
              {projet.description}
            </p>
          )}
        </div>

        <div className="kpi">
          <p className="kpi-label">Budget estimé</p>
          <p className="kpi-value text-gold-700">{fmt(projet.budget_estime)} <span className="kpi-unit">FCFA</span></p>
          <p className="kpi-sub text-sand-500">Estimation initiale</p>
        </div>
      </div>

      {/* Tâches */}
      <div className="card overflow-hidden">
        <div className="card-head">
          <div>
            <p className="card-title">Tâches ({taches.length})</p>
            <p className="text-[11px] text-sand-500 mt-0.5">Tarifs · objectifs · pointage</p>
          </div>
          <button onClick={() => setModalTache(true)} className="btn-primary btn-sm">
            <IconPlus className="w-3 h-3" /> Nouvelle tâche
          </button>
        </div>
        {taches.length === 0 ? (
          <p className="px-4 py-8 text-center text-sand-500 font-body text-sm">Aucune tâche créée</p>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>{['Tâche', 'Objectif', 'Tarif/unité', 'Réalisé', 'Progression', 'Statut', ''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {taches.map((t) => (
                <tr key={t.id}>
                  <td>
                    <p className="font-display font-medium text-ink">{t.nom}</p>
                    {t.unite_label && <p className="text-[11px] text-sand-500 mt-0.5">{t.unite_label}</p>}
                  </td>
                  <td className="mono-cell">{fmt(t.objectif_cible)}</td>
                  <td className="mono-cell">{fmt(t.tarif_unitaire)} F</td>
                  <td className="num">{fmt(t.total_realise)}</td>
                  <td className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-sand-100 rounded-full h-1.5 min-w-[60px]">
                        <div
                          className="h-full rounded-full bg-forest-500 transition-all"
                          style={{ width: `${Math.min(100, t.progression_pct)}%` }}
                        />
                      </div>
                      <span className="mono-cell text-sand-600 shrink-0">{t.progression_pct}%</span>
                    </div>
                  </td>
                  <td><Badge tone={TACHE_STATUT_TONE[t.statut] ?? 'gray'}>{TACHE_STATUT_LABEL[t.statut] ?? t.statut}</Badge></td>
                  <td>
                    <Link
                      to={`/projets/${id}/taches/${t.id}`}
                      className="text-[12px] font-display font-medium text-forest-700 hover:text-forest-900"
                    >Pointage →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Intervenants */}
      <div className="card overflow-hidden">
        <div className="card-head"><p className="card-title">Intervenants ({intervenants.length})</p></div>
        {intervenants.length === 0 ? (
          <p className="px-4 py-8 text-center text-sand-500 font-body text-sm">Aucun intervenant affecté</p>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Employé', 'Rôle', 'Début', 'Fin'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {intervenants.map((i) => (
                <tr key={i.id}>
                  <td className="font-display font-medium text-ink">{i.employe_nom}</td>
                  <td className="text-sand-600">{i.role || '—'}</td>
                  <td className="mono-cell">{i.date_debut || '—'}</td>
                  <td className="mono-cell">{i.date_fin || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mouvements stock */}
      <div className="card overflow-hidden">
        <div className="card-head"><p className="card-title">Mouvements de stock ({mouvements.length})</p></div>
        {mouvements.length === 0 ? (
          <p className="px-4 py-8 text-center text-sand-500 font-body text-sm">Aucun mouvement de stock lié</p>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Date', 'Article', 'Type', 'Quantité', 'Notes'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {mouvements.map((m) => (
                <tr key={m.id}>
                  <td className="mono-cell">{m.date}</td>
                  <td className="font-display font-medium text-ink">{m.article_nom}</td>
                  <td><Badge tone={m.type_mouvement === 'entree' ? 'green' : 'red'}>{m.type_mouvement === 'entree' ? 'Entrée' : 'Sortie'}</Badge></td>
                  <td className="num">{fmt(m.quantite)}</td>
                  <td className="text-sand-500 text-[12px]">{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalTache && (
        <Modal
          titre="Nouvelle tâche"
          sousTitre="Définir un objectif et un tarif unitaire."
          onClose={() => setModalTache(false)}
        >
          <TacheForm
            projetId={id}
            onSuccess={() => { setModalTache(false); chargerTaches() }}
            onClose={() => setModalTache(false)}
          />
        </Modal>
      )}
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div>
      <dt className="text-sand-500">{label}</dt>
      <dd className={`font-medium text-ink ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</dd>
    </div>
  )
}

function IconPlus({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
