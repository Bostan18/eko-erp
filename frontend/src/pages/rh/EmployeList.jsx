import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmployeForm from '../../components/forms/EmployeForm'
import { useFetchList } from '../../hooks/useFetchList'
import { fmt } from '../../utils/format'

const TYPE_TONE  = { permanent: 'green', journalier: 'gold', moo: 'blue' }
const TYPE_LABEL = { permanent: 'Permanent', journalier: 'Journalier', moo: 'MOO' }
const STATUT_TONE = { actif: 'green', conge: 'gold', inactif: 'gray' }

export default function EmployeList() {
  const { items: employes, loading, error, charger } = useFetchList(
    '/rh/employes/',
    'Impossible de charger les employés.'
  )
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [modal, setModal]   = useState(false)

  const filtered = employes
    .filter((e) => filtre === 'tous' ? true : e.type_contrat === filtre)
    .filter(
      (e) =>
        e.nom.toLowerCase().includes(search.toLowerCase()) ||
        e.prenom.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase())
    )

  const nbPermanents  = employes.filter((e) => e.type_contrat === 'permanent').length
  const nbJournaliers = employes.filter((e) => e.type_contrat === 'journalier').length

  return (
    <div className="space-y-6">
      {/* ─── Head ──────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="page-eyebrow mb-1.5">Opérations / RH</p>
          <h1 className="page-title">Employés</h1>
          <p className="page-sub mt-1.5">
            {loading
              ? '…'
              : `${employes.length} employé${employes.length !== 1 ? 's' : ''} · ${nbPermanents} permanent${nbPermanents !== 1 ? 's' : ''} · ${nbJournaliers} journalier${nbJournaliers !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">⬇ Exporter</button>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <IconPlus className="w-3.5 h-3.5" /> Nouvel employé
          </button>
        </div>
      </div>

      {/* ─── Filtres + recherche ─────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {[
            { key: 'tous',       label: 'Tous',        count: employes.length },
            { key: 'permanent',  label: 'Permanents',  count: nbPermanents },
            { key: 'journalier', label: 'Journaliers', count: nbJournaliers },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFiltre(key)}
              className={
                'px-3 py-1.5 rounded-lg text-[12px] font-display font-medium transition-colors flex items-center gap-1.5 ' +
                (filtre === key
                  ? 'bg-forest-700 text-white'
                  : 'bg-white border border-sand-200 text-sand-700 hover:border-forest-300')
              }
            >
              {label}
              <span className={
                'font-mono text-[10px] px-1.5 py-0.5 rounded-full ' +
                (filtre === key ? 'bg-forest-800 text-forest-100' : 'bg-sand-100 text-sand-500')
              }>{count}</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          className="input input-sm max-w-xs ml-auto"
          placeholder="Rechercher par nom ou code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ─── Table ──────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>
                {['Code', 'Nom', 'Poste', 'Type', 'Statut', 'Taux / jour'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sand-500 font-body">
                    Aucun employé trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td className="mono-cell text-forest-700">{emp.code}</td>
                    <td>
                      <Link
                        to={`/rh/${emp.id}`}
                        className="font-display font-medium text-ink hover:text-forest-700 transition-colors"
                      >
                        {emp.nom} {emp.prenom}
                      </Link>
                    </td>
                    <td className="text-sand-600">{emp.poste || '—'}</td>
                    <td>
                      <Badge tone={TYPE_TONE[emp.type_contrat] ?? 'gray'}>
                        {TYPE_LABEL[emp.type_contrat] ?? emp.type_contrat}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={STATUT_TONE[emp.statut] ?? 'gray'}>{emp.statut}</Badge>
                    </td>
                    <td className="mono-cell text-ink">
                      {emp.taux_journalier ? `${fmt(emp.taux_journalier)} F` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          titre="Nouvel employé"
          sousTitre="Renseignez les informations personnelles et le contrat."
          onClose={() => setModal(false)}
        >
          <EmployeForm
            onClose={() => setModal(false)}
            onSuccess={() => { setModal(false); charger() }}
          />
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
