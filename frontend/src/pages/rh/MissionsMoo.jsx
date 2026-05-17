import { useState } from 'react'
import Modal from '../../components/ui/Modal'
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
    if (filtre === 'toutes') return true
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-[#A59F9B] text-sm">
            {loading ? '…' : `${missions.length} mission${missions.length !== 1 ? 's' : ''} MOO`}
          </p>
          {feedback && <p className="text-xs text-red-500 mt-1">{feedback}</p>}
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouvelle mission</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 ring-amber-100 bg-amber-50">
          <p className="font-display text-xs text-amber-600 uppercase tracking-wide mb-1">À payer</p>
          <p className="font-display font-bold text-amber-700 text-2xl">{fmt(totalAPayer)} F</p>
        </div>
        <div className="card p-4 ring-forest-100 bg-forest-50">
          <p className="font-display text-xs text-forest-600 uppercase tracking-wide mb-1">Payées</p>
          <p className="font-display font-bold text-forest-700 text-2xl">{fmt(totalPayees)} F</p>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {[
          { key: 'toutes',  label: 'Toutes' },
          { key: 'a_payer', label: 'À payer' },
          { key: 'payees',  label: 'Payées' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltre(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-colors ${
              filtre === key
                ? 'bg-forest-700 text-white'
                : 'bg-white border border-[#ece2d3] text-[#1C1817] hover:border-forest-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fbf7f0] border-b border-[#ece2d3]">
              <tr>
                {['Employé', 'Description', 'Période', 'Projet', 'Montant', 'Statut', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A59F9B] font-body">Aucune mission</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id} className="hover:bg-[#fbf7f0] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-display font-medium text-forest-700 text-xs">{m.employe_code}</div>
                    <div className="font-body text-[#1C1817]">{m.employe_nom}</div>
                  </td>
                  <td className="px-4 py-3 font-body text-[#1C1817]">{m.description}</td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-xs tabular-nums">
                    {m.date_debut} → {m.date_fin}
                  </td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{m.projet_nom || '—'}</td>
                  <td className="px-4 py-3 font-display font-semibold text-[#1C1817] tabular-nums">{fmt(m.montant_forfaitaire)} F</td>
                  <td className="px-4 py-3">
                    {m.paye_le ? (
                      <span className="badge-green">Payée</span>
                    ) : (
                      <span className="badge-yellow">À payer</span>
                    )}
                    {m.paye_le && <div className="text-[10.5px] text-[#A59F9B] mt-0.5">{m.paye_le}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {!m.paye_le && (
                      <button
                        className="text-xs font-display text-forest-700 hover:text-forest-900"
                        onClick={() => marquerPayee(m.id)}
                      >
                        Marquer payée
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
