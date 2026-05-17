import { useEffect, useState } from 'react'
import api from '../../services/api'
import { fmt } from '../../utils/format'
import { apiErrorMessage } from '../../utils/errors'

export default function PaiementsJournaliers() {
  const [recap, setRecap] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [employeActif, setEmployeActif] = useState(null)
  const [presences, setPresences] = useState([])
  const [loadingPresences, setLoadingPresences] = useState(false)
  const [selection, setSelection] = useState(new Set())
  const [feedback, setFeedback] = useState('')

  function chargerRecap() {
    setLoading(true)
    setError('')
    api.get('/rh/presences/restant_a_payer/')
      .then(({ data }) => setRecap(data))
      .catch(() => setError('Impossible de charger le récap.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { chargerRecap() }, [])

  async function ouvrirEmploye(emp) {
    setEmployeActif(emp)
    setSelection(new Set())
    setFeedback('')
    setLoadingPresences(true)
    try {
      const { data } = await api.get(
        `/rh/presences/?employe=${emp.employe_id}&paye_le__isnull=true&present=true`
      )
      const list = data.results ?? data
      setPresences(list)
    } catch {
      setPresences([])
    } finally {
      setLoadingPresences(false)
    }
  }

  function toggleSelect(id) {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selection.size === presences.length) {
      setSelection(new Set())
    } else {
      setSelection(new Set(presences.map((p) => p.id)))
    }
  }

  async function marquerPayees() {
    if (selection.size === 0) return
    setFeedback('')
    try {
      const ids = Array.from(selection)
      await api.post('/rh/presences/marquer_payees/', { ids })
      setFeedback(`${ids.length} journée${ids.length > 1 ? 's' : ''} marquée${ids.length > 1 ? 's' : ''} payée${ids.length > 1 ? 's' : ''}.`)
      setEmployeActif(null)
      setPresences([])
      setSelection(new Set())
      chargerRecap()
    } catch (err) {
      setFeedback(apiErrorMessage(err))
    }
  }

  const montantSelection = presences
    .filter((p) => selection.has(p.id))
    .reduce((s, p) => s + Number(p.montant_du), 0)

  return (
    <div className="space-y-6">
      <div>
        <p className="font-body text-[#A59F9B] text-sm">
          {loading ? '…' : `${recap.length} journalier${recap.length !== 1 ? 's' : ''} avec présences enregistrées`}
        </p>
        {feedback && <p className="text-xs text-forest-700 mt-1">{feedback}</p>}
      </div>

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">Chargement…</div>
        ) : recap.length === 0 ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">
            Aucun journalier n'a de présence enregistrée.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fbf7f0] border-b border-[#ece2d3]">
              <tr>
                {['Code', 'Employé', 'Total dû', 'Total payé', 'Restant', 'Jours non payés', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {recap.map((r) => (
                <tr key={r.employe_id} className={`hover:bg-[#fbf7f0] transition-colors ${r.restant > 0 ? '' : 'opacity-60'}`}>
                  <td className="px-4 py-3 font-display font-medium text-forest-700">{r.employe_code}</td>
                  <td className="px-4 py-3 font-body font-medium text-[#1C1817]">{r.employe_nom}</td>
                  <td className="px-4 py-3 font-body text-[#1C1817] tabular-nums">{fmt(r.total_du)} F</td>
                  <td className="px-4 py-3 font-body text-forest-700 tabular-nums">{fmt(r.total_paye)} F</td>
                  <td className={`px-4 py-3 font-display font-semibold tabular-nums ${r.restant > 0 ? 'text-amber-700' : 'text-[#A59F9B]'}`}>
                    {fmt(r.restant)} F
                  </td>
                  <td className="px-4 py-3 font-body text-[#A59F9B]">{r.jours_non_payes}</td>
                  <td className="px-4 py-3">
                    {r.jours_non_payes > 0 && (
                      <button
                        className="text-xs font-display text-forest-700 hover:text-forest-900"
                        onClick={() => ouvrirEmploye(r)}
                      >
                        Voir / payer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {employeActif && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEmployeActif(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#ece2d3] flex items-center justify-between">
              <h3 className="font-display font-bold text-[#1C1817] text-lg">
                {employeActif.employe_nom} — journées non payées
              </h3>
              <button className="text-[#A59F9B] hover:text-[#1C1817] text-xl" onClick={() => setEmployeActif(null)}>×</button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-4">
              {loadingPresences ? (
                <p className="text-center text-[#A59F9B] py-12">Chargement…</p>
              ) : presences.length === 0 ? (
                <p className="text-center text-[#A59F9B] py-12">Toutes les journées sont payées.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#fbf7f0] border-b border-[#ece2d3]">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={selection.size === presences.length && presences.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      {['Date', 'Heures', 'Montant dû', 'Projet', 'Notes'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4ebe0]">
                    {presences.map((p) => (
                      <tr key={p.id} className="hover:bg-[#fbf7f0]">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selection.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                          />
                        </td>
                        <td className="px-3 py-2 font-body text-[#1C1817] tabular-nums">{p.date}</td>
                        <td className="px-3 py-2 font-body text-[#A59F9B]">{p.heures_travaillees} h</td>
                        <td className="px-3 py-2 font-display font-semibold text-[#1C1817] tabular-nums">{fmt(p.montant_du)} F</td>
                        <td className="px-3 py-2 font-body text-[#A59F9B] text-xs">{p.projet_ref || '—'}</td>
                        <td className="px-3 py-2 font-body text-[#A59F9B] text-xs">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#ece2d3] flex items-center justify-between">
              <p className="font-body text-sm text-[#1C1817]">
                <span className="font-display font-semibold">{selection.size}</span> sélectionnée{selection.size > 1 ? 's' : ''}
                {selection.size > 0 && <span className="ml-2 text-forest-700">— {fmt(montantSelection)} F</span>}
              </p>
              <div className="flex gap-3">
                <button className="btn-secondary" onClick={() => setEmployeActif(null)}>Annuler</button>
                <button className="btn-primary" onClick={marquerPayees} disabled={selection.size === 0}>
                  Marquer payées
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
