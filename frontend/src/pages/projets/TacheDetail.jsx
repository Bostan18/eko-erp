import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
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

export default function TacheDetail() {
  const { projetId, tacheId } = useParams()
  const [tableau, setTableau]   = useState(null)
  const [semaine, setSemaine]   = useState(() => getMonday())
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [draft, setDraft]       = useState({})

  const charger = useCallback(() => {
    setLoading(true)
    setError('')
    api.get(`/projets/taches/${tacheId}/tableau_pointage/?semaine=${semaine}`)
      .then(({ data }) => {
        setTableau(data)
        const initDraft = {}
        data.lignes.forEach((ligne) => {
          ligne.jours.forEach((jour) => {
            initDraft[`${ligne.affectation_id}_${jour.date}`] = {
              quantite: jour.quantite,
              notes: jour.notes,
            }
          })
        })
        setDraft(initDraft)
      })
      .catch(() => setError('Impossible de charger le tableau de pointage.'))
      .finally(() => setLoading(false))
  }, [tacheId, semaine])

  useEffect(() => { charger() }, [charger])

  function setCell(affId, date, field, value) {
    setDraft((prev) => ({
      ...prev,
      [`${affId}_${date}`]: { ...(prev[`${affId}_${date}`] || {}), [field]: value },
    }))
  }

  async function sauvegarder() {
    if (!tableau) return
    setSaving(true)
    setError('')
    const lignes = []
    tableau.lignes.forEach((ligne) => {
      ligne.jours.forEach((jour) => {
        const cell = draft[`${ligne.affectation_id}_${jour.date}`] || {}
        if (cell.quantite !== undefined) {
          lignes.push({
            affectation_id: ligne.affectation_id,
            date: jour.date,
            quantite: cell.quantite,
            notes: cell.notes || '',
          })
        }
      })
    })
    try {
      await api.post('/projets/realisations/saisie_multiple/', { lignes })
      charger()
    } catch (err) {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  function semainePrecedente() { setSemaine((s) => addDays(s, -7)) }
  function semaineSuivante()   { setSemaine((s) => addDays(s, 7)) }

  if (loading) return <div className="p-6 text-gray-500 text-sm">Chargement…</div>
  if (error && !tableau) return <div className="p-6 text-red-500 text-sm">{error}</div>

  const jours = tableau?.lignes[0]?.jours?.map((j) => j.date) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/projets/${projetId}`} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-gray-900">{tableau?.tache_nom}</h1>
          <p className="text-sm text-gray-500">
            Tarif : {fmt(tableau?.tarif_unitaire)} F / {tableau?.unite_label || 'unité'}
          </p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={semainePrecedente} className="btn-secondary text-sm px-3 py-1.5">← Semaine préc.</button>
        <span className="font-display text-sm font-medium text-gray-700">
          Semaine du {new Date(semaine + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <button onClick={semaineSuivante} className="btn-secondary text-sm px-3 py-1.5">Semaine suiv. →</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-display text-xs font-medium text-gray-500 min-w-[160px]">Employé</th>
              <th className="text-right py-2 pr-4 font-display text-xs font-medium text-gray-500 w-24">Objectif</th>
              {jours.map((jour, i) => (
                <th key={jour} className="text-center py-2 px-2 font-display text-xs font-medium text-gray-500 w-20">
                  <div>{JOURS_COURTS[i]}</div>
                  <div className="text-gray-400">{jour.slice(8)}/{jour.slice(5, 7)}</div>
                </th>
              ))}
              <th className="text-right py-2 pl-4 font-display text-xs font-medium text-gray-500 w-24">Total</th>
              <th className="text-right py-2 pl-4 font-display text-xs font-medium text-gray-500 w-24">Montant</th>
              <th className="text-right py-2 pl-4 font-display text-xs font-medium text-gray-500 w-20">%</th>
            </tr>
          </thead>
          <tbody>
            {tableau?.lignes.map((ligne) => (
              <tr key={ligne.affectation_id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 font-body text-gray-800 text-sm">{ligne.employe_nom}</td>
                <td className="py-2 pr-4 text-right text-gray-600 text-sm">{fmt(ligne.objectif_individuel)}</td>
                {ligne.jours.map((jour) => {
                  const cell = draft[`${ligne.affectation_id}_${jour.date}`] || {}
                  return (
                    <td key={jour.date} className="py-1.5 px-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input text-center text-sm py-1 px-1.5 w-full"
                        placeholder="—"
                        value={cell.quantite ?? ''}
                        onChange={(e) => setCell(ligne.affectation_id, jour.date, 'quantite', e.target.value)}
                      />
                    </td>
                  )
                })}
                <td className="py-2 pl-4 text-right font-medium text-gray-700">{fmt(ligne.total_realise)}</td>
                <td className="py-2 pl-4 text-right font-medium text-gray-700">{fmt(ligne.total_montant)} F</td>
                <td className="py-2 pl-4 text-right">
                  <span className={`text-xs font-display font-medium px-1.5 py-0.5 rounded-full ${
                    ligne.progression_pct >= 100
                      ? 'bg-green-100 text-green-700'
                      : ligne.progression_pct >= 50
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ligne.progression_pct}%
                  </span>
                </td>
              </tr>
            ))}
            {(!tableau?.lignes || tableau.lignes.length === 0) && (
              <tr>
                <td colSpan={jours.length + 5} className="py-8 text-center text-gray-400 text-sm">
                  Aucune affectation pour cette tâche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={charger} className="btn-secondary" disabled={saving}>Actualiser</button>
        <button onClick={sauvegarder} className="btn-primary" disabled={saving}>
          {saving ? 'Sauvegarde…' : 'Sauvegarder le pointage'}
        </button>
      </div>
    </div>
  )
}
