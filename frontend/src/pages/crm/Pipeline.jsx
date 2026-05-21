import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import { CenterBadge } from '../../components/ui/Badge'
import ModuleTabs, { CRM_TABS } from '../../components/ui/ModuleTabs'
import OpportuniteForm from '../../components/forms/OpportuniteForm'
import { fmt } from '../../utils/format'

const PHASES = [
  { key: 'prospection',   label: 'Prospection',   accent: 'border-t-sand-400' },
  { key: 'qualification', label: 'Qualification', accent: 'border-t-blue-400' },
  { key: 'proposition',   label: 'Proposition',   accent: 'border-t-gold-400' },
  { key: 'negociation',   label: 'Négociation',   accent: 'border-t-forest-400' },
  { key: 'gagnee',        label: 'Gagnée',        accent: 'border-t-forest-600' },
  { key: 'perdue',        label: 'Perdue',        accent: 'border-t-red-400' },
]
const PROBA_DEFAUT = { prospection: 10, qualification: 30, proposition: 50, negociation: 70, gagnee: 100, perdue: 0 }

export default function Pipeline() {
  const [opps, setOpps]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)

  const charger = useCallback(() => {
    setLoading(true)
    api.get('/crm/opportunites/').then(({ data }) => setOpps(data.results ?? data)).finally(() => setLoading(false))
  }, [])
  useEffect(() => { charger() }, [charger])

  async function deplacer(opp, phase) {
    setOpps((prev) => prev.map((o) => o.id === opp.id ? { ...o, phase, probabilite: PROBA_DEFAUT[phase] } : o))
    try {
      await api.patch(`/crm/opportunites/${opp.id}/`, { phase, probabilite: PROBA_DEFAUT[phase] })
    } finally {
      charger()
    }
  }

  const ouvertes      = opps.filter((o) => o.est_ouverte)
  const pipelineBrut  = ouvertes.reduce((s, o) => s + Number(o.valeur_estimee), 0)
  const pipelinePond  = ouvertes.reduce((s, o) => s + Number(o.valeur_ponderee), 0)
  const nbGagnee = opps.filter((o) => o.phase === 'gagnee').length
  const nbPerdue = opps.filter((o) => o.phase === 'perdue').length
  const tauxConv = (nbGagnee + nbPerdue) > 0 ? Math.round(nbGagnee / (nbGagnee + nbPerdue) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">CRM — Pipeline commercial</div>
          <div className="sec-sub">{loading ? '…' : `${ouvertes.length} opportunité${ouvertes.length !== 1 ? 's' : ''} ouverte${ouvertes.length !== 1 ? 's' : ''}`}</div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouvelle opportunité
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-icon text-2xl">💼</div>
          <p className="kpi-label">Pipeline ouvert</p>
          <p className="kpi-value">{fmt(pipelineBrut)} <span className="kpi-unit">FCFA</span></p>
          <p className="kpi-sub">valeur brute en cours</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">🎯</div>
          <p className="kpi-label">Valeur pondérée</p>
          <p className="kpi-value text-forest-700">{fmt(pipelinePond)} <span className="kpi-unit">FCFA</span></p>
          <p className="kpi-sub">× probabilité</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">🏆</div>
          <p className="kpi-label">Taux de conversion</p>
          <p className="kpi-value">{tauxConv}%</p>
          <p className="kpi-sub">{nbGagnee} gagnée{nbGagnee !== 1 ? 's' : ''} · {nbPerdue} perdue{nbPerdue !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="card p-3">
        <ModuleTabs items={CRM_TABS} />
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 pt-3">
            {PHASES.map((ph) => {
              const items = opps.filter((o) => o.phase === ph.key)
              const totalPond = items.reduce((s, o) => s + Number(o.valeur_ponderee), 0)
              return (
                <div key={ph.key} className="shrink-0 w-[230px]">
                  <div className={`bg-sand-50 rounded-lg border-t-2 ${ph.accent} px-3 py-2 mb-2`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display font-semibold text-[12.5px] text-ink">{ph.label}</span>
                      <span className="badge-gray">{items.length}</span>
                    </div>
                    <p className="font-mono text-[10.5px] text-sand-500 mt-0.5">{fmt(totalPond)} F pondéré</p>
                  </div>
                  <div className="space-y-2">
                    {items.map((o) => (
                      <div key={o.id} className="bg-white rounded-lg border border-sand-200 p-2.5 hover:border-forest-300 transition-colors">
                        <p className="font-display font-medium text-[12.5px] text-ink leading-tight">{o.titre}</p>
                        <p className="text-[11px] text-sand-500 mt-0.5">{o.client_nom}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="font-mono text-[11.5px] font-semibold text-ink">{fmt(o.valeur_estimee)} F</span>
                          <span className="text-[10px] text-sand-500">{o.probabilite}%</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 gap-1">
                          {o.centre_cout_display
                            ? <CenterBadge center={o.centre_cout_display} />
                            : <span className="text-[10px] text-sand-400">—</span>}
                          <select
                            value={o.phase}
                            onChange={(e) => deplacer(o, e.target.value)}
                            className="text-[10.5px] border border-sand-200 rounded px-1 py-0.5 bg-sand-50 text-sand-600 focus:outline-none focus:border-forest-500"
                            title="Changer de phase"
                          >
                            {PHASES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-center text-[11px] text-sand-400 py-3">—</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvelle opportunité" sousTitre="Phase, probabilité et valeur estimée." onClose={() => setModal(false)}>
          <OpportuniteForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
