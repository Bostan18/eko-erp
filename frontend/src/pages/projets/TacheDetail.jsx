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
  const [tableau, setTableau] = useState(null)
  const [semaine, setSemaine] = useState(() => getMonday())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [draft, setDraft]     = useState({})

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
    } catch {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  function semainePrecedente() { setSemaine((s) => addDays(s, -7)) }
  function semaineSuivante()   { setSemaine((s) => addDays(s, 7)) }

  if (loading) return <div className="p-12 text-center text-sand-500 font-body">Chargement…</div>
  if (error && !tableau) return <div className="alert-red">{error}</div>

  const jours = tableau?.lignes[0]?.jours?.map((j) => j.date) ?? []
  const dateLabel = new Date(semaine + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500">
        <Link to="/projets" className="hover:text-forest-700">Projets</Link>
        <span className="text-sand-300">/</span>
        <Link to={`/projets/${projetId}`} className="hover:text-forest-700">Projet</Link>
        <span className="text-sand-300">/</span>
        <span className="text-ink">Pointage tâche</span>
      </div>

      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">{tableau?.tache_nom}</div>
          <div className="sec-sub">
            Pointage à la tâche · Tarif : {fmt(tableau?.tarif_unitaire)} F / {tableau?.unite_label || 'unité'}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn-secondary" disabled={saving}>Actualiser</button>
          <button onClick={sauvegarder} className="btn-primary min-w-[170px] justify-center" disabled={saving}>
            {saving ? 'Sauvegarde…' : 'Sauvegarder le pointage'}
          </button>
        </div>
      </div>

      {error && <div className="alert-red"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{error}</div>}

      {/* ─── Carte : th-row (semaine) + table ───────────── */}
      <div className="card overflow-hidden">
        <div className="th-row">
          <div className="flex items-center gap-3">
            <button onClick={semainePrecedente} className="btn-secondary btn-sm">← Préc.</button>
            <span className="th-title">Semaine du {dateLabel}</span>
            <button onClick={semaineSuivante} className="btn-secondary btn-sm">Suiv. →</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-eko">
            <thead>
              <tr>
                <th className="min-w-[180px]">Employé</th>
                <th className="text-right w-24">Objectif</th>
                {jours.map((jour, i) => (
                  <th key={jour} className="!text-center w-20">
                    <div>{JOURS_COURTS[i]}</div>
                    <div className="text-sand-400 normal-case tracking-normal mt-0.5">
                      {jour.slice(8)}/{jour.slice(5, 7)}
                    </div>
                  </th>
                ))}
                <th className="text-right w-24">Total</th>
                <th className="text-right w-28">Montant</th>
                <th className="text-right w-20">%</th>
              </tr>
            </thead>
            <tbody>
              {tableau?.lignes.map((ligne) => (
                <tr key={ligne.affectation_id}>
                  <td className="font-display font-medium text-ink">{ligne.employe_nom}</td>
                  <td className="num text-sand-600">{fmt(ligne.objectif_individuel)}</td>
                  {ligne.jours.map((jour) => {
                    const cell = draft[`${ligne.affectation_id}_${jour.date}`] || {}
                    return (
                      <td key={jour.date} className="!px-1 !py-1.5">
                        <input
                          type="number" min="0" step="0.01"
                          className="input input-sm text-center w-full"
                          placeholder="—"
                          value={cell.quantite ?? ''}
                          onChange={(e) => setCell(ligne.affectation_id, jour.date, 'quantite', e.target.value)}
                        />
                      </td>
                    )
                  })}
                  <td className="num">{fmt(ligne.total_realise)}</td>
                  <td className="num">{fmt(ligne.total_montant)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td>
                    <span className={
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-display font-medium border ' +
                      (ligne.progression_pct >= 100
                        ? 'bg-forest-50 text-forest-700 border-forest-100'
                        : ligne.progression_pct >= 50
                          ? 'bg-gold-50 text-gold-700 border-gold-200'
                          : 'bg-sand-100 text-sand-700 border-sand-200')
                    }>{ligne.progression_pct}%</span>
                  </td>
                </tr>
              ))}
              {(!tableau?.lignes || tableau.lignes.length === 0) && (
                <tr>
                  <td colSpan={jours.length + 5} className="px-4 py-10 text-center text-sand-500 font-body">
                    Aucune affectation pour cette tâche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
