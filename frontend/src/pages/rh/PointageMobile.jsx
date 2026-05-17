import { useEffect, useState } from 'react'
import api from '../../services/api'
import { db } from '../../offline/db'
import SyncStatus from '../../components/offline/SyncStatus'

const STATUTS = [
  { key: 'present',     label: '✓ Présent',        color: 'bg-[#639922] text-white' },
  { key: 'demi',        label: '½ Demi-journée',   color: 'bg-[#BA7517] text-white' },
  { key: 'absent',      label: '✗ Absent',         color: 'bg-[#E24B4A] text-white' },
]

function aujourdhuiISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function PointageMobile() {
  const [journaliers, setJournaliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saisies, setSaisies] = useState({}) // { employeId: 'present' | 'demi' | 'absent' }
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    (async () => {
      // Tente d'abord le réseau ; sinon fallback IndexedDB
      try {
        const { data } = await api.get('/rh/employes/?type_contrat=journalier')
        const list = (data.results ?? data).filter((e) => e.type_contrat === 'journalier')
        setJournaliers(list)
      } catch {
        const cache = await db.employes.toArray()
        setJournaliers(cache.filter((e) => e.type_contrat === 'journalier'))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function pointer(employeId, statut) {
    setSaisies((s) => ({ ...s, [employeId]: statut }))
  }

  async function valider() {
    if (Object.keys(saisies).length === 0) return
    setSaving(true)
    setFeedback('')
    const date = aujourdhuiISO()
    const presences = Object.entries(saisies).map(([emp, st]) => ({
      employe: Number(emp),
      date,
      statut: st === 'present' ? 'present' : st === 'absent' ? 'absent' : 'present',
      heures: st === 'present' ? 8 : st === 'demi' ? 4 : 0,
    }))
    try {
      const { data } = await api.post('/rh/presences/saisie_journee/', { date, presences })
      if (data?.offline) {
        setFeedback(`${presences.length} pointage(s) enregistré(s) localement.`)
      } else {
        setFeedback(`${presences.length} pointage(s) enregistré(s).`)
      }
      setSaisies({})
    } catch (err) {
      setFeedback('Échec de l\'enregistrement. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  const total = journaliers.length
  const pointes = Object.keys(saisies).length

  if (loading) return <div className="p-12 text-center text-[#A59F9B] font-body">Chargement…</div>

  return (
    <div className="max-w-xl mx-auto space-y-3 pb-24">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display font-bold text-[#1C1817] text-[20px]">Pointage rapide</h1>
          <p className="font-body text-[12px] text-[#A59F9B]">{aujourdhuiISO()}</p>
        </div>
        <SyncStatus />
      </div>

      <div className="bg-white ring-1 ring-[#ece2d3] rounded-xl px-3 py-2 flex items-center justify-between sticky top-10 z-10">
        <span className="font-display text-[13px] text-[#1C1817]">
          {pointes} / {total} pointés
        </span>
        <div className="h-1.5 bg-[#f4ebe0] rounded-full flex-1 mx-3 overflow-hidden">
          <div className="h-full bg-forest-600 rounded-full" style={{ width: `${total ? (pointes / total) * 100 : 0}%` }} />
        </div>
      </div>

      {journaliers.length === 0 ? (
        <p className="text-center text-[#A59F9B] font-body py-8">Aucun journalier disponible (cache vide ?).</p>
      ) : (
        <ul className="space-y-2">
          {journaliers.map((j) => {
            const choix = saisies[j.id]
            return (
              <li key={j.id} className="bg-white ring-1 ring-[#ece2d3] rounded-xl p-3 space-y-2">
                <p className="font-display font-medium text-[#1C1817] text-[15px] truncate">
                  {(j.nom_complet ?? `${j.prenom ?? ''} ${j.nom}`).trim()}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {STATUTS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => pointer(j.id, s.key)}
                      aria-pressed={choix === s.key}
                      className={`min-h-[44px] rounded-lg font-display font-medium text-[13px] transition-all ${
                        choix === s.key ? s.color + ' ring-2 ring-offset-1 ring-[#1C1817]' : 'bg-[#f4ebe0] text-[#5d4f3a]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-[#ece2d3]">
        <button
          onClick={valider}
          disabled={saving || pointes === 0}
          className="w-full min-h-[52px] bg-forest-700 text-white rounded-xl font-display font-semibold text-[15px] active:bg-forest-800 disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : `Valider la journée (${pointes})`}
        </button>
        {feedback && <p className="mt-2 text-center text-[12px] font-body text-[#5d4f3a]">{feedback}</p>}
      </div>
    </div>
  )
}
