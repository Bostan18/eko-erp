import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { RH_TABS } from '../../components/ui/ModuleTabs'
import MissionMooForm from '../../components/forms/MissionMooForm'
import api from '../../services/api'
import { useFetchList } from '../../hooks/useFetchList'
import { fmt } from '../../utils/format'
import { apiErrorMessage } from '../../utils/errors'

export default function MissionsMoo() {
  const { items: missions, loading, error, charger } = useFetchList(
    '/rh/missions-moo/', 'Impossible de charger les missions.'
  )
  const [filtre, setFiltre] = useState('toutes')
  const [modal, setModal]   = useState(false)
  const [feedback, setFeedback] = useState('')

  const filtered = missions.filter((m) => {
    if (filtre === 'a_payer') return !m.paye_le
    if (filtre === 'payees') return !!m.paye_le
    return true
  })

  const totalAPayer = missions
    .filter((m) => !m.paye_le)
    .reduce((s, m) => s + Number(m.montant_forfaitaire), 0)
  const totalPayees = missions
    .filter((m) => m.paye_le)
    .reduce((s, m) => s + Number(m.montant_forfaitaire), 0)

  async function marquerPayee(id) {
    setFeedback('')
    try {
      await api.post(`/rh/missions-moo/${id}/marquer_payee/`)
      charger()
    } catch (err) {
      setFeedback(apiErrorMessage(err))
    }
  }

  const FILTRES = [
    { key: 'toutes',  label: 'Toutes' },
    { key: 'a_payer', label: 'À payer' },
    { key: 'payees',  label: 'Payées' },
  ]

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Missions MOO</div>
          <div className="sec-sub">
            Main d'œuvre occasionnelle · forfaits ·{' '}
            {loading ? '…' : `${missions.length} mission${missions.length !== 1 ? 's' : ''}`}
          </div>
          {feedback && <p className="text-[12px] text-red-600 mt-1">{feedback}</p>}
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouvelle mission
        </button>
      </div>

      {/* ─── KPI ────────────────────────────────────────── */}
      <div className="three-col">
        <div className="kpi">
          <div className="kpi-icon text-2xl">🛠</div>
          <p className="kpi-label">Missions</p>
          <p className="kpi-value">{missions.length}</p>
          <p className="kpi-sub">Forfaits enregistrés</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">⏳</div>
          <p className="kpi-label">À payer</p>
          <p className="kpi-value text-gold-600">{fmt(totalAPayer)} <span className="kpi-unit">FCFA</span></p>
          <p className="kpi-sub">Missions non réglées</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">✅</div>
          <p className="kpi-label">Payées</p>
          <p className="kpi-value text-forest-700">{fmt(totalPayees)} <span className="kpi-unit">FCFA</span></p>
          <p className="kpi-sub">Cumul réglé</p>
        </div>
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={RH_TABS} />

        <div className="th-row">
          <div className="th-title">
            Missions ·{' '}
            <span className="text-sand-500 font-normal">{filtered.length}</span>
          </div>
          <select
            className="input input-sm w-auto"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
          >
            {FILTRES.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>
                {['Employé', 'Description', 'Période', 'Projet', 'Montant', 'Statut', ''].map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sand-500 font-body">
                    Aucune mission
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="mono-cell text-forest-700 font-medium">{m.employe_code}</div>
                      <div className="font-display font-medium text-ink">{m.employe_nom}</div>
                    </td>
                    <td className="text-[12px] text-ink">{m.description}</td>
                    <td className="text-[12px] text-sand-500 tabular-nums">
                      {m.date_debut} → {m.date_fin}
                    </td>
                    <td className="text-[12px] text-sand-500">{m.projet_nom || '—'}</td>
                    <td className="num">
                      {fmt(m.montant_forfaitaire)} <span className="text-[10px] font-normal text-sand-500">F</span>
                    </td>
                    <td>
                      {m.paye_le ? <Badge tone="green">Payée</Badge> : <Badge tone="gold">À payer</Badge>}
                      {m.paye_le && <div className="text-[10.5px] text-sand-500 mt-0.5">{m.paye_le}</div>}
                    </td>
                    <td>
                      {!m.paye_le && (
                        <button
                          className="text-[12px] font-display font-medium text-forest-700 hover:text-forest-900"
                          onClick={() => marquerPayee(m.id)}
                        >
                          Marquer payée
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvelle mission MOO" onClose={() => setModal(false)}>
          <MissionMooForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
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
