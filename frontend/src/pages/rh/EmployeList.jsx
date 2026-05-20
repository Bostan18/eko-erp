import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { RH_TABS } from '../../components/ui/ModuleTabs'
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
  const nbMoo         = employes.filter((e) => e.type_contrat === 'moo').length

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Employés</div>
          <div className="sec-sub">
            Permanents, journaliers & MOO ·{' '}
            {loading ? '…' : `${employes.length} employé${employes.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">⬇ Exporter</button>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <IconPlus className="w-3.5 h-3.5" /> Nouvel employé
          </button>
        </div>
      </div>

      {/* ─── KPI grid ───────────────────────────────────── */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-icon text-2xl">👥</div>
          <p className="kpi-label">Effectif total</p>
          <p className="kpi-value">{employes.length}</p>
          <p className="kpi-sub">Tous contrats</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">👔</div>
          <p className="kpi-label">Permanents</p>
          <p className="kpi-value text-forest-700">{nbPermanents}</p>
          <p className="kpi-sub">CDI / CDD</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">👷</div>
          <p className="kpi-label">Journaliers</p>
          <p className="kpi-value text-gold-600">{nbJournaliers}</p>
          <p className="kpi-sub">Payés à la journée</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">🛠</div>
          <p className="kpi-label">MOO</p>
          <p className="kpi-value text-blue-600">{nbMoo}</p>
          <p className="kpi-sub">Main d'œuvre occasionnelle</p>
        </div>
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={RH_TABS} />

        <div className="th-row">
          <div className="th-title">
            Liste des employés ·{' '}
            <span className="text-sand-500 font-normal">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input input-sm w-auto"
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
            >
              <option value="tous">Tous les contrats</option>
              <option value="permanent">Permanents</option>
              <option value="journalier">Journaliers</option>
              <option value="moo">MOO</option>
            </select>
            <input
              type="text"
              className="input input-sm w-[210px]"
              placeholder="Rechercher par nom ou code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

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
