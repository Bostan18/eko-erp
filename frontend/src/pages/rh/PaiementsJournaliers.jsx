import { useEffect, useState } from 'react'
import api from '../../services/api'
import ModuleTabs, { RH_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconHardHat, IconClipboard, IconCheck, IconHourglass } from '../../components/ui/Icons'
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

  const totalDu      = recap.reduce((s, r) => s + Number(r.total_du), 0)
  const totalPaye    = recap.reduce((s, r) => s + Number(r.total_paye), 0)
  const totalRestant = recap.reduce((s, r) => s + Number(r.restant), 0)

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Paiements journaliers</div>
          <div className="sec-sub">
            Règlement des présences à la tâche ·{' '}
            {loading ? '…' : `${recap.length} journalier${recap.length !== 1 ? 's' : ''}`}
          </div>
          {feedback && <p className="text-[12px] text-forest-700 mt-1">{feedback}</p>}
        </div>
      </div>

      {/* ─── KPI grid ───────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          icon={<IconHardHat />} tone="sand"
          label="Journaliers"
          value={recap.length}
          sub="Avec présences"
        />
        <KpiCard
          icon={<IconClipboard />} tone="sand"
          label="Total dû"
          value={<>{fmt(totalDu)} <span className="kpi-unit">FCFA</span></>}
          sub="Cumul des journées"
        />
        <KpiCard
          icon={<IconCheck />} tone="forest" valueTone="forest"
          label="Payé"
          value={<>{fmt(totalPaye)} <span className="kpi-unit">FCFA</span></>}
          sub="Déjà réglé"
        />
        <KpiCard
          icon={<IconHourglass />} tone={totalRestant > 0 ? 'gold' : 'sand'} valueTone={totalRestant > 0 ? 'gold' : 'sand'}
          label="Restant à payer"
          value={<>{fmt(totalRestant)} <span className="kpi-unit">FCFA</span></>}
          sub={totalRestant > 0 ? 'À régler' : 'Tout est payé'}
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={RH_TABS} />

        <div className="th-row">
          <div className="th-title">
            Récapitulatif par journalier ·{' '}
            <span className="text-sand-500 font-normal">{recap.length}</span>
          </div>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : recap.length === 0 ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">
            Aucun journalier n'a de présence enregistrée.
          </div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>
                {['Code', 'Employé', 'Total dû', 'Total payé', 'Restant', 'Jours non payés', 'Action'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recap.map((r) => (
                <tr key={r.employe_id} className={r.restant > 0 ? '' : 'opacity-60'}>
                  <td className="mono-cell text-forest-700">{r.employe_code}</td>
                  <td className="font-display font-medium text-ink">{r.employe_nom}</td>
                  <td className="num">{fmt(r.total_du)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td className="num text-forest-700">{fmt(r.total_paye)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td className={`num ${r.restant > 0 ? 'text-gold-600' : 'text-sand-400'}`}>
                    {fmt(r.restant)} <span className="text-[10px] font-normal text-sand-500">F</span>
                  </td>
                  <td className="text-sand-600">{r.jours_non_payes}</td>
                  <td>
                    {r.jours_non_payes > 0 && (
                      <button
                        className="text-[12px] font-display font-medium text-forest-700 hover:text-forest-900"
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
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-sand-200 flex items-center justify-between">
              <h3 className="font-display font-bold text-ink text-lg">
                {employeActif.employe_nom} — journées non payées
              </h3>
              <button className="text-sand-500 hover:text-ink text-xl" onClick={() => setEmployeActif(null)}>×</button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-4">
              {loadingPresences ? (
                <p className="text-center text-sand-500 py-12">Chargement…</p>
              ) : presences.length === 0 ? (
                <p className="text-center text-sand-500 py-12">Toutes les journées sont payées.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-sand-50 border-b border-sand-200">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={selection.size === presences.length && presences.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      {['Date', 'Heures', 'Montant dû', 'Projet', 'Notes'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-display font-semibold text-sand-500 text-xs uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    {presences.map((p) => (
                      <tr key={p.id} className="hover:bg-sand-50">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selection.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                          />
                        </td>
                        <td className="px-3 py-2 font-body text-ink tabular-nums">{p.date}</td>
                        <td className="px-3 py-2 font-body text-sand-500">{p.heures_travaillees} h</td>
                        <td className="px-3 py-2 font-display font-semibold text-ink tabular-nums">{fmt(p.montant_du)} F</td>
                        <td className="px-3 py-2 font-body text-sand-500 text-xs">{p.projet_ref || '—'}</td>
                        <td className="px-3 py-2 font-body text-sand-500 text-xs">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t border-sand-200 flex items-center justify-between">
              <p className="font-body text-sm text-ink">
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
