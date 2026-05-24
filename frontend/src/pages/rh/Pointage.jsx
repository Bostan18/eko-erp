import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import ModuleTabs, { RH_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconHardHat, IconCheck, IconWallet } from '../../components/ui/Icons'
import { fmt } from '../../utils/format'

function today() { return new Date().toISOString().slice(0, 10) }

export default function Pointage() {
  const [date, setDate]       = useState(today())
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  const charger = useCallback((d) => {
    setLoading(true)
    setError('')
    setSaved(false)
    api.get(`/rh/presences/feuille_journee/?date=${d}`)
      .then(({ data }) => {
        setRows(data.presences.map((p) => ({
          ...p,
          present: p.present ?? true,
          heures_travaillees: p.heures_travaillees ?? '8.0',
        })))
      })
      .catch(() => setError('Impossible de charger la feuille de pointage.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger(date) }, [date, charger])

  function togglePresent(idx) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, present: !r.present } : r))
  }
  function updateField(idx, field, value) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  async function sauvegarder() {
    setSaving(true)
    setError('')
    try {
      await api.post('/rh/presences/saisie_journee/', {
        date,
        presences: rows.map((r) => ({
          employe_id: r.employe_id,
          present: r.present,
          heures_travaillees: r.heures_travaillees,
          projet_ref: r.projet_ref,
          notes: r.notes,
        })),
      })
      setSaved(true)
      charger(date)
    } catch {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const totalJour = rows.filter((r) => r.present).reduce((s, r) => s + Number(r.taux_journalier || 0), 0)
  const nbPresents = rows.filter((r) => r.present).length

  return (
    <div className="space-y-4 md:space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Pointage journalier</div>
          <div className="sec-sub">Saisie des présences — journaliers actifs</div>
        </div>
        <div className="sec-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              const d = new Date(date)
              api.get(`/rh/presences/export_paie/?mois=${d.getMonth()+1}&annee=${d.getFullYear()}`, { responseType: 'blob' })
                .then(({ data }) => {
                  const href = URL.createObjectURL(data)
                  Object.assign(document.createElement('a'), { href, download: `paie_${d.getMonth()+1}_${d.getFullYear()}.xlsx` }).click()
                  URL.revokeObjectURL(href)
                })
            }}
          >⬇ Feuille de paie</button>
          <button
            onClick={sauvegarder}
            disabled={saving || loading || rows.length === 0}
            className="btn-primary md:min-w-[150px]"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer tout'}
          </button>
        </div>
      </div>

      {/* ─── KPI ────────────────────────────────────────── */}
      <div className="three-col">
        <KpiCard
          icon={<IconHardHat />} tone="sand"
          label="Journaliers"
          value={rows.length}
          sub="Actifs ce jour"
        />
        <KpiCard
          icon={<IconCheck />} tone="forest" valueTone="forest"
          label="Présents"
          value={<>{nbPresents} <span className="kpi-unit">/ {rows.length}</span></>}
          sub="Pointés présents"
        />
        <KpiCard
          icon={<IconWallet />} tone="gold" valueTone="gold"
          label="À payer"
          value={<>{fmt(totalJour)} <span className="kpi-unit">FCFA</span></>}
          sub="Total de la journée"
        />
      </div>

      {error && <div className="alert-red"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{error}</div>}
      {saved && !error && (
        <div className="alert-gold !bg-forest-50 !border-forest-200 !text-forest-700">
          <span className="w-1.5 h-1.5 bg-forest-500 rounded-full" />
          Pointage enregistré avec succès.
        </div>
      )}

      <div className="card overflow-hidden">
        <ModuleTabs items={RH_TABS} />

        <div className="th-row">
          <div className="th-title">Feuille de pointage</div>
          <label className="flex items-center gap-2 text-[12px] font-display font-medium text-sand-600">
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input input-sm w-auto" />
          </label>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Aucun journalier actif trouvé.</div>
        ) : (
        <>
        {/* ─── Cards mobile (< md) ─────────────────────── */}
        <div className="md:hidden divide-y divide-sand-100">
          <div className="px-4 py-2.5 flex items-center gap-2 bg-sand-50 border-b border-sand-200">
            <input
              type="checkbox"
              checked={rows.every((r) => r.present)}
              onChange={(e) => setRows((prev) => prev.map((r) => ({ ...r, present: e.target.checked })))}
              className="w-4 h-4 rounded border-sand-300 text-forest-600 focus:ring-forest-500"
            />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.07em] text-sand-500 font-medium">
              Tout sélectionner — {nbPresents}/{rows.length} présent{nbPresents !== 1 ? 's' : ''}
            </span>
          </div>
          {rows.map((row, idx) => (
            <div
              key={row.employe_id}
              className={`px-4 py-3 transition-colors ${row.present ? 'bg-white' : 'bg-sand-50/60 opacity-70'}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={row.present}
                  onChange={() => togglePresent(idx)}
                  className="w-5 h-5 mt-0.5 rounded border-sand-300 text-forest-600 focus:ring-forest-500 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display font-semibold text-ink text-[13.5px] truncate">{row.employe_nom}</p>
                    <p className="font-mono text-[10.5px] text-forest-700 shrink-0">{row.employe_code}</p>
                  </div>
                  <p className="font-mono text-[10.5px] text-sand-500 mt-0.5">
                    {fmt(row.taux_journalier)} F / j
                    {row.present && (
                      <span className="ml-2 font-display font-semibold text-ink">
                        → {fmt(row.taux_journalier)} F
                      </span>
                    )}
                  </p>

                  {row.present && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.07em] text-sand-500">Heures</span>
                        <input
                          type="number" inputMode="decimal" min="0" max="24" step="0.5"
                          value={row.heures_travaillees}
                          onChange={(e) => updateField(idx, 'heures_travaillees', e.target.value)}
                          className="input input-sm text-center"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.07em] text-sand-500">Projet</span>
                        <input
                          type="text" placeholder="PRJ-001"
                          value={row.projet_ref ?? ''}
                          onChange={(e) => updateField(idx, 'projet_ref', e.target.value)}
                          className="input input-sm"
                        />
                      </label>
                      <label className="col-span-2 flex flex-col gap-1">
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.07em] text-sand-500">Notes</span>
                        <input
                          type="text" placeholder="Notes…"
                          value={row.notes ?? ''}
                          onChange={(e) => updateField(idx, 'notes', e.target.value)}
                          className="input input-sm"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="px-4 py-3 bg-forest-50 border-t-2 border-forest-200 flex items-center justify-between">
            <span className="font-display font-semibold text-forest-800 text-[12.5px]">
              Total — {nbPresents} présent{nbPresents !== 1 ? 's' : ''}
            </span>
            <span className="font-display font-semibold text-forest-800 text-[14px]">
              {fmt(totalJour)} F
            </span>
          </div>
        </div>

        {/* ─── Table desktop (≥ md) ────────────────────── */}
        <div className="hidden md:block">
          <table className="table-eko">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={rows.every((r) => r.present)}
                    onChange={(e) => setRows((prev) => prev.map((r) => ({ ...r, present: e.target.checked })))}
                    className="rounded border-sand-300 text-forest-600 focus:ring-forest-500"
                  />
                </th>
                {['Employé', 'Taux/j', 'Heures', 'Montant', 'Projet', 'Notes'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.employe_id} className={row.present ? '' : 'opacity-50 bg-sand-50/60'}>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.present}
                      onChange={() => togglePresent(idx)}
                      className="rounded border-sand-300 text-forest-600 focus:ring-forest-500"
                    />
                  </td>
                  <td>
                    <p className="font-display font-medium text-ink">{row.employe_nom}</p>
                    <p className="mono-cell text-forest-700">{row.employe_code}</p>
                  </td>
                  <td className="mono-cell">{fmt(row.taux_journalier)} F</td>
                  <td className="w-24">
                    <input
                      type="number" min="0" max="24" step="0.5"
                      value={row.heures_travaillees}
                      onChange={(e) => updateField(idx, 'heures_travaillees', e.target.value)}
                      disabled={!row.present}
                      className="input input-sm text-center w-20 disabled:opacity-40"
                    />
                  </td>
                  <td className="num">{row.present ? `${fmt(row.taux_journalier)} F` : '—'}</td>
                  <td className="w-32">
                    <input
                      type="text" placeholder="PRJ-001"
                      value={row.projet_ref ?? ''}
                      onChange={(e) => updateField(idx, 'projet_ref', e.target.value)}
                      disabled={!row.present}
                      className="input input-sm text-[12px] w-28 disabled:opacity-40"
                    />
                  </td>
                  <td>
                    <input
                      type="text" placeholder="Notes…"
                      value={row.notes ?? ''}
                      onChange={(e) => updateField(idx, 'notes', e.target.value)}
                      disabled={!row.present}
                      className="input input-sm text-[12px] w-36 disabled:opacity-40"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-forest-50 border-t-2 border-forest-200">
              <tr>
                <td colSpan={4} className="px-4 py-3 font-display font-semibold text-forest-800 text-[13px]">
                  Total journée — {nbPresents} présent{nbPresents !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 num text-forest-800 text-[14px]">{fmt(totalJour)} F</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
