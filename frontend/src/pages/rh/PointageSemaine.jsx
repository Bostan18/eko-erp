import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { fmt } from '../../utils/format'

function getMonday(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().slice(0, 10)
}

function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function PointageSemaine() {
  const [semaine, setSemaine]   = useState(() => getMonday())
  const [feuille, setFeuille]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [draft, setDraft]       = useState({})

  const charger = useCallback(() => {
    setLoading(true)
    setError('')
    api.get(`/rh/presences/feuille_semaine/?semaine=${semaine}`)
      .then(({ data }) => {
        setFeuille(data)
        const initDraft = {}
        data.lignes.forEach((ligne) => {
          ligne.jours.forEach((jour) => {
            initDraft[`${ligne.employe_id}_${jour.date}`] = {
              present: jour.present,
              heures_travaillees: jour.heures_travaillees,
              projet_ref: jour.projet_ref,
              notes: jour.notes,
            }
          })
        })
        setDraft(initDraft)
      })
      .catch(() => setError('Impossible de charger la feuille de présences.'))
      .finally(() => setLoading(false))
  }, [semaine])

  useEffect(() => { charger() }, [charger])

  function setCell(empId, date, field, value) {
    setDraft((prev) => ({
      ...prev,
      [`${empId}_${date}`]: { ...(prev[`${empId}_${date}`] || {}), [field]: value },
    }))
  }

  function togglePresence(empId, date) {
    const key = `${empId}_${date}`
    setDraft((prev) => {
      const current = prev[key]?.present
      const next = current === true ? false : current === false ? null : true
      return { ...prev, [key]: { ...(prev[key] || {}), present: next } }
    })
  }

  async function sauvegarder() {
    if (!feuille) return
    setSaving(true)
    setError('')
    const lignes = feuille.lignes.map((ligne) => ({
      employe_id: ligne.employe_id,
      jours: ligne.jours
        .map((jour) => {
          const cell = draft[`${ligne.employe_id}_${jour.date}`] || {}
          return cell.present !== null && cell.present !== undefined
            ? { date: jour.date, ...cell }
            : null
        })
        .filter(Boolean),
    })).filter((l) => l.jours.length > 0)

    try {
      await api.post('/rh/presences/saisie_semaine/', { lignes })
      charger()
    } catch {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  function semainePrecedente() { setSemaine((s) => addDays(s, -7)) }
  function semaineSuivante()   { setSemaine((s) => addDays(s, 7)) }

  const jours = feuille?.jours ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Pointage semaine</h1>
        <p className="text-sm text-gray-500 mt-1">Présences des journaliers actifs</p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={semainePrecedente} className="btn-secondary text-sm px-3 py-1.5">← Semaine préc.</button>
        <span className="font-display text-sm font-medium text-gray-700">
          Semaine du {new Date(semaine + 'T00:00:00').toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </span>
        <button onClick={semaineSuivante} className="btn-secondary text-sm px-3 py-1.5">Semaine suiv. →</button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Chargement…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-display text-xs font-medium text-gray-500 min-w-[160px]">Employé</th>
                <th className="text-right py-2 pr-4 font-display text-xs font-medium text-gray-500 w-24">Taux/jour</th>
                {jours.map((jour, i) => (
                  <th key={jour} className="text-center py-2 px-2 font-display text-xs font-medium text-gray-500 w-20">
                    <div>{JOURS_COURTS[i]}</div>
                    <div className="text-gray-400">{jour.slice(8)}/{jour.slice(5, 7)}</div>
                  </th>
                ))}
                <th className="text-right py-2 pl-4 font-display text-xs font-medium text-gray-500 w-28">Total semaine</th>
              </tr>
            </thead>
            <tbody>
              {feuille?.lignes.map((ligne) => {
                let totalSemaine = 0
                const cellsJours = ligne.jours.map((jour) => {
                  const cell = draft[`${ligne.employe_id}_${jour.date}`] || {}
                  const present = cell.present
                  if (present === true) totalSemaine += Number(ligne.taux_journalier)
                  const bg = present === true
                    ? 'bg-green-50 border-green-200'
                    : present === false
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                  return (
                    <td key={jour.date} className="py-1.5 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => togglePresence(ligne.employe_id, jour.date)}
                        className={`w-full h-8 rounded border text-xs font-medium transition-colors ${bg} hover:opacity-80`}
                      >
                        {present === true ? '✓' : present === false ? '✗' : '—'}
                      </button>
                    </td>
                  )
                })

                return (
                  <tr key={ligne.employe_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4">
                      <div className="font-body text-gray-800 text-sm">{ligne.employe_nom}</div>
                      <div className="text-xs text-gray-400">{ligne.employe_code}</div>
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-600 text-sm">{fmt(ligne.taux_journalier)} F</td>
                    {cellsJours}
                    <td className="py-2 pl-4 text-right font-display font-bold text-forest-700 text-sm">
                      {fmt(totalSemaine)} F
                    </td>
                  </tr>
                )
              })}
              {(!feuille?.lignes || feuille.lignes.length === 0) && (
                <tr>
                  <td colSpan={jours.length + 3} className="py-8 text-center text-gray-400 text-sm">
                    Aucun journalier actif.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button onClick={charger} className="btn-secondary" disabled={saving || loading}>Actualiser</button>
        <button onClick={sauvegarder} className="btn-primary" disabled={saving || loading}>
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
