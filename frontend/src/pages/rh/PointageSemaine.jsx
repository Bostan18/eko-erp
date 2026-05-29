import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import ModuleTabs, { RH_TABS } from '../../components/ui/ModuleTabs'
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
  const [semaine, setSemaine] = useState(() => getMonday())
  const [feuille, setFeuille] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [draft, setDraft]     = useState({})

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
      jours: ligne.jours.map((jour) => {
        const cell = draft[`${ligne.employe_id}_${jour.date}`] || {}
        return cell.present !== null && cell.present !== undefined
          ? { date: jour.date, ...cell }
          : null
      }).filter(Boolean),
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
  const dateLabel = new Date(semaine + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Pointage semaine</div>
          <div className="sec-sub">Présences des journaliers actifs — saisie hebdomadaire</div>
        </div>
        <div className="flex gap-2">
          <button onClick={charger} className="btn-secondary" disabled={saving || loading}>Actualiser</button>
          <button onClick={sauvegarder} className="btn-primary min-w-[140px] justify-center" disabled={saving || loading}>
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {error && <div className="alert-red"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{error}</div>}

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={RH_TABS} />

        <div className="th-row">
          <div className="flex items-center gap-3">
            <button onClick={semainePrecedente} className="btn-secondary btn-sm">← Préc.</button>
            <span className="th-title">Semaine du {dateLabel}</span>
            <button onClick={semaineSuivante} className="btn-secondary btn-sm">Suiv. →</button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-eko">
              <thead>
                <tr>
                  <th className="min-w-[180px]">Employé</th>
                  <th className="text-right w-28">Taux/jour</th>
                  {jours.map((jour, i) => (
                    <th key={jour} className="!text-center w-20">
                      <div>{JOURS_COURTS[i]}</div>
                      <div className="text-sand-400 normal-case tracking-normal mt-0.5">{jour.slice(8)}/{jour.slice(5, 7)}</div>
                    </th>
                  ))}
                  <th className="text-right w-32">Total semaine</th>
                </tr>
              </thead>
              <tbody>
                {feuille?.lignes.map((ligne) => {
                  let totalSemaine = 0
                  return (
                    <tr key={ligne.employe_id}>
                      <td>
                        <p className="font-display font-medium text-ink">{ligne.employe_nom}</p>
                        <p className="mono-cell text-forest-700">{ligne.employe_code}</p>
                      </td>
                      <td className="num text-sand-600">{fmt(ligne.taux_journalier)} F</td>
                      {ligne.jours.map((jour) => {
                        const cell = draft[`${ligne.employe_id}_${jour.date}`] || {}
                        const present = cell.present
                        if (present === true) totalSemaine += Number(ligne.taux_journalier)
                        const cls =
                          present === true
                            ? 'bg-forest-50 border-forest-200 text-forest-700'
                            : present === false
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-white border-sand-200 text-sand-400'
                        const symbol = present === true ? '✓' : present === false ? '✗' : '—'
                        return (
                          <td key={jour.date} className="!px-1 !py-1.5">
                            <button
                              type="button"
                              onClick={() => togglePresence(ligne.employe_id, jour.date)}
                              className={`w-full h-8 rounded-md border text-[13px] font-display font-semibold transition-colors ${cls} hover:opacity-90`}
                            >{symbol}</button>
                          </td>
                        )
                      })}
                      <td className="num text-forest-700">{fmt(totalSemaine)} F</td>
                    </tr>
                  )
                })}
                {(!feuille?.lignes || feuille.lignes.length === 0) && (
                  <tr>
                    <td colSpan={jours.length + 3} className="px-4 py-10 text-center text-sand-500 font-body">
                      Aucun journalier actif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
