import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ProjetForm from '../../components/forms/ProjetForm'
import { useFetchList } from '../../hooks/useFetchList'
import { fmt } from '../../utils/format'

const TYPE_LABEL = {
  btp: 'BTP', agriculture: 'Agriculture', pepiniere: 'Pépinière',
  location: 'Location', espaces_verts: 'Espaces verts',
}
const TYPE_TONE = {
  btp: 'blue', agriculture: 'green', pepiniere: 'green',
  location: 'gold', espaces_verts: 'green',
}
const STATUT_TONE = {
  planifie: 'gray', en_cours: 'blue', suspendu: 'gold',
  termine: 'green', annule: 'red',
}
const STATUT_LABEL = {
  planifie: 'Planifié', en_cours: 'En cours', suspendu: 'Suspendu',
  termine: 'Terminé', annule: 'Annulé',
}

export default function ProjetList() {
  const { items: projets, loading, error, charger } = useFetchList(
    '/projets/projets/', 'Impossible de charger les projets.'
  )
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [modal, setModal]   = useState(false)

  const filtered = projets
    .filter((p) => filtre === 'tous' ? true : p.type_projet === filtre)
    .filter((p) =>
      !search ? true :
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    )

  const nbEnCours = projets.filter((p) => p.statut === 'en_cours').length
  const nbTermines = projets.filter((p) => p.statut === 'termine').length
  const budgetTotal = projets.reduce((s, p) => s + Number(p.budget_estime ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="page-eyebrow mb-1.5">Opérations / Projets</p>
          <h1 className="page-title">Projets</h1>
          <p className="page-sub mt-1.5">
            {loading ? '…' : `${projets.length} projet${projets.length !== 1 ? 's' : ''} · ${nbEnCours} en cours · ${nbTermines} terminés`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau projet
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi">
          <p className="kpi-label">En cours</p>
          <p className="kpi-value">{nbEnCours}</p>
          <p className="kpi-sub text-sand-500">Projets actifs</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Terminés</p>
          <p className="kpi-value text-forest-700">{nbTermines}</p>
          <p className="kpi-sub text-sand-500">Cumul</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Budget cumulé</p>
          <p className="kpi-value">{fmt(budgetTotal)} <span className="kpi-unit">FCFA</span></p>
          <p className="kpi-sub text-sand-500">Tous projets confondus</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {[['tous','Tous'], ...Object.entries(TYPE_LABEL)].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFiltre(key)}
              className={
                'px-3 py-1.5 rounded-lg text-[12px] font-display font-medium transition-colors ' +
                (filtre === key
                  ? 'bg-forest-700 text-white'
                  : 'bg-white border border-sand-200 text-sand-700 hover:border-forest-300')
              }
            >{label}</button>
          ))}
        </div>
        <input
          type="text"
          className="input input-sm max-w-xs ml-auto"
          placeholder="Rechercher nom ou code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>{['Code','Nom','Type','Statut','Client','Début','Budget'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sand-500 font-body">Aucun projet</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id}>
                  <td className="mono-cell text-forest-700">{p.code}</td>
                  <td>
                    <Link to={`/projets/${p.id}`} className="font-display font-medium text-ink hover:text-forest-700 transition-colors">
                      {p.nom}
                    </Link>
                  </td>
                  <td><Badge tone={TYPE_TONE[p.type_projet] ?? 'gray'}>{TYPE_LABEL[p.type_projet] ?? p.type_projet}</Badge></td>
                  <td><Badge tone={STATUT_TONE[p.statut] ?? 'gray'}>{STATUT_LABEL[p.statut] ?? p.statut}</Badge></td>
                  <td className="text-sand-600">{p.client_nom ?? '—'}</td>
                  <td className="mono-cell">{p.date_debut ?? '—'}</td>
                  <td className="num">{p.budget_estime ? `${fmt(p.budget_estime)} F` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau projet" sousTitre="Définir le projet, client, planning et budget." onClose={() => setModal(false)}>
          <ProjetForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
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
