import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

/* Contexte partagé des alertes opérationnelles.
   Source unique pour : badges sidebar, cloche de notifications.
   Agrège /reporting/kpis/ (compteurs) + /reporting/activite-recente/ (flux). */

const AlertsContext = createContext(null)

const POLL_MS = 120_000 // rafraîchit toutes les 2 min

export function AlertsProvider({ children }) {
  const [kpis, setKpis]         = useState(null)
  const [activite, setActivite] = useState([])
  const [loading, setLoading]   = useState(true)

  const charger = useCallback(() => {
    Promise.all([
      api.get('/reporting/kpis/').then((r) => r.data).catch(() => null),
      api.get('/reporting/activite-recente/').then((r) => r.data).catch(() => []),
    ]).then(([k, a]) => {
      if (k) setKpis(k)
      setActivite(Array.isArray(a) ? a : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    charger()
    const id = setInterval(charger, POLL_MS)
    return () => clearInterval(id)
  }, [charger])

  const facturesEnRetard = kpis?.finance?.factures_en_retard ?? 0
  const stockAlertes     = kpis?.stocks?.alertes ?? 0
  const totalAlertes     = facturesEnRetard + stockAlertes

  // Badges par préfixe de route (consommés par la Sidebar)
  const badges = {
    '/comptabilite': { count: facturesEnRetard, tone: 'red' },
    '/stocks':       { count: stockAlertes,     tone: 'gold' },
  }

  const value = {
    loading,
    kpis,
    activite,
    facturesEnRetard,
    stockAlertes,
    totalAlertes,
    badges,
    recharger: charger,
  }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export function useAlerts() {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlerts doit être utilisé dans un AlertsProvider')
  return ctx
}
