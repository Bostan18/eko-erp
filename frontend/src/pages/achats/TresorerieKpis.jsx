import { useState, useEffect } from 'react'
import api from '../../services/api'
import { fmt } from '../../utils/format'
import KpiCard from '../../components/ui/KpiCard'
import { IconBank, IconArrowUp, IconArrowDown, IconChartBar } from '../../components/ui/Icons'

/* Bandeau KPI trésorerie — partagé entre les pages Comptes et Paiements. */
export default function TresorerieKpis() {
  const [k, setK] = useState(null)

  useEffect(() => {
    api.get('/achats/tresorerie/kpis/').then(({ data }) => setK(data)).catch(() => setK(null))
  }, [])

  const soldeNeg = k && k.solde_total < 0
  const fluxNeg  = k && k.flux_net_mois < 0

  return (
    <div className="kpi-grid">
      <KpiCard
        icon={<IconBank />} tone={soldeNeg ? 'red' : 'forest'} valueTone={soldeNeg ? 'red' : 'forest'}
        label="Solde total"
        value={<>{k ? fmt(k.solde_total) : '…'} <span className="kpi-unit">FCFA</span></>}
        sub={k ? `${k.comptes.length} compte${k.comptes.length !== 1 ? 's' : ''} actif${k.comptes.length !== 1 ? 's' : ''}` : ''}
      />
      <KpiCard
        icon={<IconArrowUp />} tone="forest" valueTone="forest"
        label="Encaissements (mois)"
        value={<>{k ? fmt(k.entrees_mois) : '…'} <span className="kpi-unit">FCFA</span></>}
        sub="entrées du mois"
      />
      <KpiCard
        icon={<IconArrowDown />} tone="red" valueTone="red"
        label="Décaissements (mois)"
        value={<>{k ? fmt(k.sorties_mois) : '…'} <span className="kpi-unit">FCFA</span></>}
        sub="sorties du mois"
      />
      <KpiCard
        icon={<IconChartBar />} tone={fluxNeg ? 'red' : 'forest'} valueTone={fluxNeg ? 'red' : 'forest'}
        label="Flux net (mois)"
        value={<>{k ? fmt(k.flux_net_mois) : '…'} <span className="kpi-unit">FCFA</span></>}
        sub="entrées − sorties"
      />
    </div>
  )
}
