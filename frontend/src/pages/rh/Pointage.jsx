import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function fmt(n) {
  return Number(n).toLocaleString('fr-FR')
}

export default function Pointage() {
  const [date, setDate]           = useState(today())
  const [rows, setRows]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')

  const charger = useCallback((d) => {
    setLoading(true)
    setError('')
    setSaved(false)
    api.get(`/rh/presences/feuille_journee/?date=${d}`)
      .then(({ data }) => {
        setRows(
          data.presences.map((p) => ({
            ...p,
            present: p.present ?? true,
            heures_travaillees: p.heures_travaillees ?? '8.0',
          }))
        )
      })
      .catch(() => setError('Impossible de charger la feuille de pointage.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger(date) }, [date, charger])

  function togglePresent(idx) {
    setRows((prev) =>
      prev.map((r, i) => i === idx ? { ...r, present: !r.present } : r)
    )
  }

  function updateField(idx, field, value) {
    setRows((prev) =>
      prev.map((r, i) => i === idx ? { ...r, [field]: value } : r)
    )
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

  const totalJour = rows
    .filter((r) => r.present)
    .reduce((s, r) => s + Number(r.taux_journalier || 0), 0)

  const nbPresents = rows.filter((r) => r.present).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-gray-900 text-2xl">Pointage journalier</h1>
          <p className="font-body text-gray-500 text-sm mt-1">
            Saisie des présences — journaliers actifs
          </p>
        </div>
        <button
          onClick={sauvegarder}
          disabled={saving || loading || rows.length === 0}
          className="btn-primary min-w-[140px]"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer tout'}
        </button>
      </div>

      {/* Date + stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-gray-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-44"
          />
        </div>

        <div className="flex gap-3 mt-5">
          <div className="card px-4 py-2 flex items-center gap-2 border-forest-100">
            <span className="font-display font-bold text-forest-700 text-lg">{nbPresents}</span>
            <span className="font-body text-gray-500 text-sm">présent{nbPresents !== 1 ? 's' : ''} / {rows.length}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2 border-amber-100 bg-amber-50">
            <span className="font-display font-bold text-amber-700 text-lg">{fmt(totalJour)}</span>
            <span className="font-body text-amber-600 text-sm">F à payer</span>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-body">
          {error}
        </div>
      )}
      {saved && !error && (
        <div className="px-4 py-3 bg-forest-50 border border-forest-100 rounded-lg text-forest-700 text-sm font-body">
          Pointage enregistré avec succès.
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-body text-sm">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-body text-sm">
            Aucun journalier actif trouvé.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-display font-semibold text-gray-500 text-xs uppercase tracking-wide w-10">
                  <input
                    type="checkbox"
                    checked={rows.every((r) => r.present)}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => ({ ...r, present: e.target.checked })))
                    }
                    className="rounded border-gray-300 text-forest-600 focus:ring-forest-500"
                  />
                </th>
                {['Employé', 'Taux/j', 'Heures', 'Montant', 'Projet', 'Notes'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, idx) => (
                <tr
                  key={row.employe_id}
                  className={`transition-colors ${row.present ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 opacity-60'}`}
                >
                  {/* Présent toggle */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.present}
                      onChange={() => togglePresent(idx)}
                      className="rounded border-gray-300 text-forest-600 focus:ring-forest-500"
                    />
                  </td>

                  {/* Employé */}
                  <td className="px-4 py-3">
                    <p className="font-body font-medium text-gray-800">{row.employe_nom}</p>
                    <p className="font-display text-xs text-forest-600">{row.employe_code}</p>
                  </td>

                  {/* Taux */}
                  <td className="px-4 py-3 font-body text-gray-600">
                    {fmt(row.taux_journalier)} F
                  </td>

                  {/* Heures */}
                  <td className="px-4 py-3 w-24">
                    <input
                      type="number"
                      min="0" max="24" step="0.5"
                      value={row.heures_travaillees}
                      onChange={(e) => updateField(idx, 'heures_travaillees', e.target.value)}
                      disabled={!row.present}
                      className="input py-1 text-center w-20 disabled:opacity-40"
                    />
                  </td>

                  {/* Montant calculé */}
                  <td className="px-4 py-3 font-display font-semibold text-gray-700">
                    {row.present ? `${fmt(row.taux_journalier)} F` : '—'}
                  </td>

                  {/* Projet */}
                  <td className="px-4 py-3 w-32">
                    <input
                      type="text"
                      placeholder="PRJ-001"
                      value={row.projet_ref}
                      onChange={(e) => updateField(idx, 'projet_ref', e.target.value)}
                      disabled={!row.present}
                      className="input py-1 text-xs w-28 disabled:opacity-40"
                    />
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="Notes…"
                      value={row.notes}
                      onChange={(e) => updateField(idx, 'notes', e.target.value)}
                      disabled={!row.present}
                      className="input py-1 text-xs w-36 disabled:opacity-40"
                    />
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer totaux */}
            <tfoot className="bg-forest-50 border-t-2 border-forest-100">
              <tr>
                <td colSpan={4} className="px-4 py-3 font-display font-semibold text-forest-800 text-sm">
                  Total journée — {nbPresents} présent{nbPresents !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 font-display font-bold text-forest-800">
                  {fmt(totalJour)} F
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
