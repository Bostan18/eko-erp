import { useState, useEffect } from 'react'
import api from '../../services/api'
import { fmt } from '../../utils/format'

/* Bandeau KPI trésorerie — partagé entre les pages Comptes et Paiements. */
export default function TresorerieKpis() {
  const [k, setK] = useState(null)

  useEffect(() => {
    api.get('/achats/tresorerie/kpis/').then(({ data }) => setK(data)).catch(() => setK(null))
  }, [])

  return (
    <div className="kpi-grid">
      <div className="kpi">
        <div className="kpi-icon text-2xl">🏦</div>
        <p className="kpi-label">Solde total</p>
        <p className={`kpi-value ${k && k.solde_total < 0 ? 'text-red-600' : 'text-forest-700'}`}>
          {k ? fmt(k.solde_total) : '…'} <span className="kpi-unit">FCFA</span>
        </p>
        <p className="kpi-sub">{k ? `${k.comptes.length} compte${k.comptes.length !== 1 ? 's' : ''} actif${k.comptes.length !== 1 ? 's' : ''}` : ''}</p>
      </div>
      <div className="kpi">
        <div className="kpi-icon text-2xl">⬆</div>
        <p className="kpi-label">Encaissements (mois)</p>
        <p className="kpi-value text-forest-700">{k ? fmt(k.entrees_mois) : '…'} <span className="kpi-unit">FCFA</span></p>
        <p className="kpi-sub">entrées du mois</p>
      </div>
      <div className="kpi">
        <div className="kpi-icon text-2xl">⬇</div>
        <p className="kpi-label">Décaissements (mois)</p>
        <p className="kpi-value text-red-600">{k ? fmt(k.sorties_mois) : '…'} <span className="kpi-unit">FCFA</span></p>
        <p className="kpi-sub">sorties du mois</p>
      </div>
      <div className="kpi">
        <div className="kpi-icon text-2xl">📊</div>
        <p className="kpi-label">Flux net (mois)</p>
        <p className={`kpi-value ${k && k.flux_net_mois < 0 ? 'text-red-600' : 'text-forest-700'}`}>
          {k ? fmt(k.flux_net_mois) : '…'} <span className="kpi-unit">FCFA</span>
        </p>
        <p className="kpi-sub">entrées − sorties</p>
      </div>
    </div>
  )
}
