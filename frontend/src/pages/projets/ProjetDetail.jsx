import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { fmt } from '../../utils/format'
import Modal from '../../components/ui/Modal'
import TacheForm from '../../components/forms/TacheForm'

const STATUT_BADGE = {
  planifie: 'badge-gray', en_cours: 'badge-blue', suspendu: 'badge-yellow',
  termine: 'badge-green', annule: 'badge-red',
}

const TYPE_LABEL = {
  btp: 'BTP', agriculture: 'Agriculture', pepiniere: 'Pépinière',
  location: 'Location', espaces_verts: 'Espaces verts',
}

const TACHE_STATUT_BADGE = {
  a_faire: 'badge-gray', en_cours: 'badge-blue', terminee: 'badge-green', annulee: 'badge-red',
}
const TACHE_STATUT_LABEL = {
  a_faire: 'À faire', en_cours: 'En cours', terminee: 'Terminée', annulee: 'Annulée',
}

export default function ProjetDetail() {
  const { id } = useParams()
  const [projet, setProjet]               = useState(null)
  const [intervenants, setIntervenants]   = useState([])
  const [mouvements, setMouvements]       = useState([])
  const [taches, setTaches]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [modalTache, setModalTache]       = useState(false)

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

  if (loading) return <div className="p-12 text-center text-gray-400 font-body">Chargement…</div>
  if (!projet)  return <div className="p-12 text-center text-red-500 font-body">Projet introuvable.</div>

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-body text-gray-500">
        <Link to="/projets" className="hover:text-forest-700 transition-colors">Projets</Link>
        <span>/</span>
        <span className="text-gray-800">{projet.code}</span>
      </div>

      {/* Header */}
      <div className="card p-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-display font-bold text-forest-600">{projet.code}</span>
            <span className={STATUT_BADGE[projet.statut] ?? 'badge-gray'}>{projet.statut}</span>
            <span className="badge-gray">{TYPE_LABEL[projet.type_projet] ?? projet.type_projet}</span>
          </div>
          <h1 className="font-display font-bold text-gray-900 text-xl">{projet.nom}</h1>
          {projet.localisation && (
            <p className="font-body text-gray-500 text-sm mt-1">📍 {projet.localisation}</p>
          )}
        </div>
        <Link to="/projets" className="btn-secondary text-sm">← Retour</Link>
      </div>

      {/* Infos + budget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-2">
          <p className="font-display text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Détails</p>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-body">
            <div><dt className="text-gray-500">Client</dt><dd className="font-medium text-gray-800">{projet.client_nom || '—'}</dd></div>
            <div><dt className="text-gray-500">Chef de projet</dt><dd className="font-medium text-gray-800">{projet.chef_projet_nom || '—'}</dd></div>
            <div><dt className="text-gray-500">Début</dt><dd className="text-gray-700">{projet.date_debut || '—'}</dd></div>
            <div><dt className="text-gray-500">Fin prévue</dt><dd className="text-gray-700">{projet.date_fin_prevue || '—'}</dd></div>
            <div><dt className="text-gray-500">Fin réelle</dt><dd className="text-gray-700">{projet.date_fin_reelle || '—'}</dd></div>
          </dl>
          {projet.description && (
            <p className="mt-4 text-sm font-body text-gray-600 border-t border-gray-100 pt-4">{projet.description}</p>
          )}
        </div>

        <div className="card p-5 bg-amber-50 border-amber-100">
          <p className="font-display text-xs font-medium text-amber-600 uppercase tracking-wide mb-3">Budget estimé</p>
          <p className="font-display font-bold text-amber-700 text-3xl">{fmt(projet.budget_estime)}</p>
          <p className="font-body text-amber-600 text-sm mt-1">F CFA</p>
        </div>
      </div>

      {/* Tâches */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="font-display font-semibold text-gray-800 text-sm">
            Tâches ({taches.length})
          </p>
          <button onClick={() => setModalTache(true)} className="btn-primary text-xs px-3 py-1.5">
            + Nouvelle tâche
          </button>
        </div>
        {taches.length === 0 ? (
          <p className="px-4 py-6 text-center text-gray-400 font-body text-sm">Aucune tâche créée</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Tâche', 'Objectif', 'Tarif/unité', 'Réalisé', 'Progression', 'Statut', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {taches.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-body font-medium text-gray-800">{t.nom}</div>
                    {t.unite_label && <div className="text-xs text-gray-400">{t.unite_label}</div>}
                  </td>
                  <td className="px-4 py-3 font-body text-gray-600">{fmt(t.objectif_cible)}</td>
                  <td className="px-4 py-3 font-body text-gray-600">{fmt(t.tarif_unitaire)} F</td>
                  <td className="px-4 py-3 font-display font-semibold text-gray-700">{fmt(t.total_realise)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-[60px]">
                        <div
                          className="h-1.5 rounded-full bg-forest-500 transition-all"
                          style={{ width: `${Math.min(100, t.progression_pct)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">{t.progression_pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={TACHE_STATUT_BADGE[t.statut] ?? 'badge-gray'}>
                      {TACHE_STATUT_LABEL[t.statut] ?? t.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/projets/${id}/taches/${t.id}`}
                      className="text-xs font-display font-medium text-forest-700 hover:text-forest-800"
                    >
                      Pointage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Intervenants */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-display font-semibold text-gray-800 text-sm">
            Intervenants ({intervenants.length})
          </p>
        </div>
        {intervenants.length === 0 ? (
          <p className="px-4 py-6 text-center text-gray-400 font-body text-sm">Aucun intervenant affecté</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Employé', 'Rôle', 'Début', 'Fin'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {intervenants.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-body font-medium text-gray-800">{i.employe_nom}</td>
                  <td className="px-4 py-3 font-body text-gray-500">{i.role || '—'}</td>
                  <td className="px-4 py-3 font-body text-gray-500">{i.date_debut || '—'}</td>
                  <td className="px-4 py-3 font-body text-gray-500">{i.date_fin || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mouvements de stock */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-display font-semibold text-gray-800 text-sm">
            Mouvements de stock ({mouvements.length})
          </p>
        </div>
        {mouvements.length === 0 ? (
          <p className="px-4 py-6 text-center text-gray-400 font-body text-sm">Aucun mouvement de stock lié</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Article', 'Type', 'Quantité', 'Notes'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mouvements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-body text-gray-700">{m.date}</td>
                  <td className="px-4 py-3 font-body font-medium text-gray-800">{m.article_nom}</td>
                  <td className="px-4 py-3">
                    <span className={m.type_mouvement === 'entree' ? 'badge-green' : 'badge-red'}>
                      {m.type_mouvement === 'entree' ? 'Entrée' : 'Sortie'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-display font-semibold text-gray-700">{fmt(m.quantite)}</td>
                  <td className="px-4 py-3 font-body text-gray-400 text-xs">{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalTache && (
        <Modal titre="Nouvelle tâche" onClose={() => setModalTache(false)}>
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
