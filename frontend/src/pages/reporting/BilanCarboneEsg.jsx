import { useEffect, useState } from 'react'
import api from '../../services/api'
import ModuleTabs, { REPORTING_TABS } from '../../components/ui/ModuleTabs'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })

export default function BilanCarboneEsg() {
  const [co2, setCo2]     = useState(null)
  const [esg, setEsg]     = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/reporting/bilan-carbone/'),
      api.get('/reporting/esg/'),
    ])
      .then(([{ data: c }, { data: e }]) => { setCo2(c); setEsg(e) })
      .catch(() => setError('Impossible de charger les données ESG.'))
  }, [])

  if (!co2 || !esg) return (
    <div className="space-y-5">
      <div className="card overflow-hidden"><ModuleTabs items={REPORTING_TABS} /></div>
      {error
        ? <p className="alert-red m-5">{error}</p>
        : <p className="text-center text-sand-500 font-body text-sm py-12">Chargement…</p>}
    </div>
  )

  const soldeTone = co2.solde_net_kg >= 0 ? 'green' : 'red'

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden"><ModuleTabs items={REPORTING_TABS} /></div>

      <div className="sec-head">
        <div>
          <div className="sec-title">Bilan Carbone &amp; ESG</div>
          <div className="sec-sub">Mesure annuelle consolidée — plantations, parc, déchets, social, gouvernance.</div>
        </div>
      </div>

      {/* Bilan Carbone */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-ink text-base">Bilan Carbone (annualisé)</h2>
          <span className="text-[10px] font-mono uppercase tracking-wider text-sand-500">
            kg CO₂eq
          </span>
        </div>
        <div className="kpi-grid">
          <Kpi label="CO₂ séquestré" value={`${fmt(co2.co2_sequestre_kg)} kg`}
            sub={`${co2.nb_lots} lot${co2.nb_lots !== 1 ? 's' : ''} actif${co2.nb_lots !== 1 ? 's' : ''}`} tone="green" />
          <Kpi label="CO₂ émis" value={`${fmt(co2.co2_emis_kg)} kg`}
            sub={`${co2.nb_engins} engin${co2.nb_engins !== 1 ? 's' : ''}`} tone="red" />
          <Kpi label="Solde net" value={`${fmt(co2.solde_net_kg)} kg`}
            sub={co2.solde_net_kg >= 0 ? 'Bilan positif' : 'À compenser'} tone={soldeTone} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <div>
            <p className="font-display font-semibold text-ink text-sm mb-2">Séquestration par espèce</p>
            <table className="table-eko">
              <thead><tr>{['Espèce', 'Plants', 'CO₂/an'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {co2.par_espece.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-sand-500 font-body text-[12px]">Aucun lot</td></tr>
                ) : co2.par_espece.map((e) => (
                  <tr key={e.espece}>
                    <td className="font-display text-ink">{e.espece}</td>
                    <td className="num">{fmt(e.plants)}</td>
                    <td className="num text-forest-700">{fmt(e.co2_kg)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p className="font-display font-semibold text-ink text-sm mb-2">Émissions par type d'engin</p>
            <table className="table-eko">
              <thead><tr>{['Type', 'Nb', 'Heures', 'CO₂'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {co2.par_type_engin.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-sand-500 font-body text-[12px]">Aucun engin</td></tr>
                ) : co2.par_type_engin.map((e) => (
                  <tr key={e.type}>
                    <td className="font-display text-ink">{e.type}</td>
                    <td className="num">{e.nb}</td>
                    <td className="num">{fmt(e.heures)}</td>
                    <td className="num text-red-600">{fmt(e.co2_kg)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ESG */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-ink text-base">Score ESG</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-sand-500">Global</span>
            <span className={`font-display font-bold text-2xl ${
              esg.score_global >= 70 ? 'text-forest-700' : esg.score_global >= 40 ? 'text-gold-600' : 'text-red-600'
            }`}>
              {esg.score_global}/100
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AxeCard titre="Environnement" score={esg.environnement.score} accent="green">
            <Row label="Valorisation déchets"  value={`${esg.environnement.taux_valorisation_dechets} %`} />
            <Row label="CO₂ séquestré"         value={`${fmt(esg.environnement.co2_sequestre_kg)} kg`} />
            <Row label="CO₂ émis"              value={`${fmt(esg.environnement.co2_emis_kg)} kg`} />
          </AxeCard>
          <AxeCard titre="Social" score={esg.social.score} accent="blue">
            <Row label="Employés actifs"       value={esg.social.nb_employes} />
            <Row label="% CDI permanents"      value={`${esg.social.pct_cdi} %`} />
            <Row label="% certifs valides"     value={`${esg.social.pct_certifs_valides} %`} />
          </AxeCard>
          <AxeCard titre="Gouvernance" score={esg.gouvernance.score} accent="gold">
            <Row label="Factures FNE"          value={`${esg.gouvernance.pct_factures_fne} %`} />
            <Row label="Paiement à temps"      value={`${esg.gouvernance.pct_factures_a_temps} %`} />
            <Row label="En retard"             value={`${esg.gouvernance.nb_factures_retard} / ${esg.gouvernance.nb_factures_total}`} />
          </AxeCard>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, tone }) {
  const valueClass = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-forest-700' : tone === 'gold' ? 'text-gold-600' : 'text-ink'
  return (
    <div className="kpi">
      <p className="kpi-label">{label}</p>
      <p className={`kpi-value ${valueClass}`}>{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}

function AxeCard({ titre, score, accent, children }) {
  const border = accent === 'green' ? 'border-forest-200 bg-forest-50/40'
               : accent === 'blue'  ? 'border-blue-200 bg-blue-50/40'
               : 'border-gold-200 bg-gold-50/40'
  const scoreColor = score >= 70 ? 'text-forest-700' : score >= 40 ? 'text-gold-600' : 'text-red-600'
  return (
    <div className={`rounded-xl p-4 ring-1 ${border}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-display font-semibold text-ink text-sm">{titre}</p>
        <span className={`font-display font-bold text-lg ${scoreColor}`}>{score}/100</span>
      </div>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-[12px]">
      <dt className="text-sand-500">{label}</dt>
      <dd className="font-display text-ink">{value}</dd>
    </div>
  )
}
