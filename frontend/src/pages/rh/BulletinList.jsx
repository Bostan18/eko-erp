import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useFetchList } from '../../hooks/useFetchList'
import {
  BULLETIN_STATUT_BADGE, BULLETIN_STATUT_LABEL, MOIS_NOMS, moisLabel,
} from '../../utils/constants'
import { fmt } from '../../utils/format'
import { apiErrorMessage } from '../../utils/errors'

function currentMonthIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export default function BulletinList() {
  const [moisActif, setMoisActif] = useState(currentMonthIso())
  const endpoint = `/rh/bulletins/?mois=${moisActif}`
  const { items: bulletins, loading, error, charger } = useFetchList(
    endpoint, 'Impossible de charger les bulletins.'
  )
  const [generating, setGenerating] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => { setFeedback('') }, [moisActif])

  async function handleGenerer() {
    setGenerating(true)
    setFeedback('')
    try {
      const { data } = await api.post('/rh/bulletins/generer/', { mois: moisActif })
      setFeedback(`${data.crees} bulletin${data.crees > 1 ? 's' : ''} créé${data.crees > 1 ? 's' : ''}, ${data.ignores_existants} déjà existant${data.ignores_existants > 1 ? 's' : ''}.`)
      charger()
    } catch (err) {
      setFeedback(apiErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  async function marquerPaye(id) {
    try {
      await api.post(`/rh/bulletins/${id}/marquer_paye/`)
      charger()
    } catch (err) {
      setFeedback(apiErrorMessage(err))
    }
  }

  const totalBrut = bulletins.reduce((s, b) => s + Number(b.brut), 0)
  const totalNet = bulletins.reduce((s, b) => s + Number(b.net), 0)
  const nbPayes = bulletins.filter((b) => b.statut === 'paye').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-body text-[#A59F9B] text-sm">
            {loading ? '…' : `${bulletins.length} bulletin${bulletins.length !== 1 ? 's' : ''} — ${moisLabel(moisActif)}`}
          </p>
          {feedback && <p className="text-xs text-forest-700 mt-1">{feedback}</p>}
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input"
            value={moisActif}
            onChange={(e) => setMoisActif(e.target.value)}
          >
            {generateLast12Months().map((iso) => (
              <option key={iso} value={iso}>{moisLabel(iso)}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleGenerer} disabled={generating}>
            {generating ? 'Génération…' : `Générer la paie de ${moisLabel(moisActif)}`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="font-display text-xs text-[#A59F9B] uppercase tracking-wide mb-1">Total brut</p>
          <p className="font-display font-bold text-[#1C1817] text-2xl">{fmt(totalBrut)} F</p>
        </div>
        <div className="card p-4 ring-forest-100 bg-forest-50">
          <p className="font-display text-xs text-forest-600 uppercase tracking-wide mb-1">Payés</p>
          <p className="font-display font-bold text-forest-700 text-2xl">{nbPayes} / {bulletins.length}</p>
        </div>
        <div className="card p-4">
          <p className="font-display text-xs text-[#A59F9B] uppercase tracking-wide mb-1">Total net</p>
          <p className="font-display font-bold text-[#1C1817] text-2xl">{fmt(totalNet)} F</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">Chargement…</div>
        ) : bulletins.length === 0 ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">
            Aucun bulletin pour {moisLabel(moisActif)}. Clique « Générer la paie » pour créer les bulletins des CDI actifs.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fbf7f0] border-b border-[#ece2d3]">
              <tr>
                {['Code', 'Employé', 'Poste', 'Brut', 'Net', 'Statut', 'Payé le', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {bulletins.map((b) => (
                <tr key={b.id} className="hover:bg-[#fbf7f0] transition-colors">
                  <td className="px-4 py-3 font-display font-medium text-forest-700">{b.employe_code}</td>
                  <td className="px-4 py-3 font-body font-medium text-[#1C1817]">
                    <Link to={`/rh/paie/bulletins/${b.id}`} className="hover:text-forest-700 transition-colors">
                      {b.employe_nom}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{b.employe_poste || '—'}</td>
                  <td className="px-4 py-3 font-body text-[#1C1817] tabular-nums">{fmt(b.brut)} F</td>
                  <td className="px-4 py-3 font-display font-semibold text-[#1C1817] tabular-nums">{fmt(b.net)} F</td>
                  <td className="px-4 py-3">
                    <span className={BULLETIN_STATUT_BADGE[b.statut] ?? 'badge-gray'}>
                      {BULLETIN_STATUT_LABEL[b.statut] ?? b.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{b.paye_le || '—'}</td>
                  <td className="px-4 py-3">
                    {b.statut !== 'paye' && (
                      <button
                        className="text-xs font-display text-forest-700 hover:text-forest-900"
                        onClick={() => marquerPaye(b.id)}
                      >
                        Marquer payé
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function generateLast12Months() {
  const result = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
  }
  return result
}
