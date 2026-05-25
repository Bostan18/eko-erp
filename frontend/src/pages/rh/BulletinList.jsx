import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import ModuleTabs, { RH_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconDocument, IconCard, IconWallet, IconCheck } from '../../components/ui/Icons'
import { useFetchList } from '../../hooks/useFetchList'
import {
  BULLETIN_STATUT_BADGE, BULLETIN_STATUT_LABEL, moisLabel,
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
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Bulletins de paie</div>
          <div className="sec-sub">
            Paie mensuelle des permanents · {moisLabel(moisActif)}
          </div>
          {feedback && <p className="text-[12px] text-forest-700 mt-1">{feedback}</p>}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input input-sm w-auto"
            value={moisActif}
            onChange={(e) => setMoisActif(e.target.value)}
          >
            {generateLast12Months().map((iso) => (
              <option key={iso} value={iso}>{moisLabel(iso)}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleGenerer} disabled={generating}>
            {generating ? 'Génération…' : '⚙ Générer la paie'}
          </button>
        </div>
      </div>

      {/* ─── KPI grid ───────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          icon={<IconDocument />} tone="sand"
          label="Bulletins"
          value={bulletins.length}
          sub={moisLabel(moisActif)}
        />
        <KpiCard
          icon={<IconCard />} tone="blue"
          label="Masse salariale brute"
          value={<>{fmt(totalBrut)} <span className="kpi-unit">FCFA</span></>}
          sub="Cumul du mois"
        />
        <KpiCard
          icon={<IconWallet />} tone="forest"
          label="Net à payer"
          value={<>{fmt(totalNet)} <span className="kpi-unit">FCFA</span></>}
          sub="Après cotisations"
        />
        <KpiCard
          icon={<IconCheck />} tone="forest"
          label="Payés"
          value={<>{nbPayes} <span className="kpi-unit">/ {bulletins.length}</span></>}
          sub="Bulletins réglés"
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={RH_TABS} />

        <div className="th-row">
          <div className="th-title">
            Bulletins · {moisLabel(moisActif)} ·{' '}
            <span className="text-sand-500 font-normal">{bulletins.length}</span>
          </div>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : bulletins.length === 0 ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">
            Aucun bulletin pour {moisLabel(moisActif)}. Clique « Générer la paie » pour créer les bulletins des CDI actifs.
          </div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>
                {['Code', 'Employé', 'Poste', 'Brut', 'Net', 'Statut', 'Payé le', 'Action'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b) => (
                <tr key={b.id}>
                  <td className="mono-cell text-forest-700">{b.employe_code}</td>
                  <td className="font-display font-medium text-ink">
                    <Link to={`/rh/paie/bulletins/${b.id}`} className="hover:text-forest-700 transition-colors">
                      {b.employe_nom}
                    </Link>
                  </td>
                  <td className="text-[12px] text-sand-500">{b.employe_poste || '—'}</td>
                  <td className="num">{fmt(b.brut)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td className="num text-forest-700">{fmt(b.net)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td>
                    <span className={BULLETIN_STATUT_BADGE[b.statut] ?? 'badge-gray'}>
                      {BULLETIN_STATUT_LABEL[b.statut] ?? b.statut}
                    </span>
                  </td>
                  <td className="text-[12px] text-sand-500">{b.paye_le || '—'}</td>
                  <td>
                    {b.statut !== 'paye' && (
                      <button
                        className="text-[12px] font-display font-medium text-forest-700 hover:text-forest-900"
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
