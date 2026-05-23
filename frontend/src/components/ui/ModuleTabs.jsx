import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

/**
 * Onglets in-card servant de navigation entre les pages sœurs d'un module
 * (gabarit maquette EKO : ex. Comptabilité → Factures · Devis · Charges).
 * L'onglet actif est animé via un indicateur glissant.
 *
 *   <ModuleTabs items={[{ label: 'Factures', to: '/comptabilite/factures' }, …]} />
 */
export default function ModuleTabs({ items }) {
  const containerRef = useRef(null)
  const { pathname } = useLocation()
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 })

  // Recalcule la position de la barre à chaque changement de route ou de taille
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const measure = () => {
      const active = containerRef.current?.querySelector('.tab.active')
      if (active) {
        setIndicator({
          left: active.offsetLeft,
          width: active.offsetWidth,
          opacity: 1,
        })
      } else {
        setIndicator((s) => ({ ...s, opacity: 0 }))
      }
    }
    measure()
    // Si les fonts arrivent en retard, on relance une mesure tardive
    const t = setTimeout(measure, 120)
    return () => clearTimeout(t)
  }, [pathname, items])

  useEffect(() => {
    const onResize = () => {
      const active = containerRef.current?.querySelector('.tab.active')
      if (active) {
        setIndicator({
          left: active.offsetLeft,
          width: active.offsetWidth,
          opacity: 1,
        })
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div ref={containerRef} className="tabs has-indicator">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
        >
          {it.label}
        </NavLink>
      ))}
      <span
        className="tab-indicator"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.opacity,
        }}
      />
    </div>
  )
}

/* ─── Définitions de modules réutilisables ───────────────── */
/* end:true sur les routes qui sont préfixes d'autres onglets, pour
   que l'onglet ne reste pas actif sur les routes sœurs. */
export const COMPTA_TABS = [
  { label: 'Factures', to: '/comptabilite/factures' },
  { label: 'Avoirs',   to: '/comptabilite/avoirs' },
  { label: 'Devis',    to: '/comptabilite/devis' },
  { label: 'Stickers', to: '/comptabilite/stickers' },
  { label: 'Charges',  to: '/comptabilite/charges' },
]

export const ACHATS_TABS = [
  { label: 'Factures achats', to: '/achats/factures', end: true },
  { label: 'Fournisseurs',    to: '/achats/fournisseurs' },
  { label: 'Comptes',         to: '/achats/comptes' },
  { label: 'Paiements',       to: '/achats/tresorerie' },
]

export const RH_TABS = [
  { label: 'Employés',     to: '/rh', end: true },
  { label: 'Pointage',     to: '/rh/pointage' },
  { label: 'Semaine',      to: '/rh/pointage-semaine' },
  { label: 'Congés',       to: '/rh/conges' },
  { label: 'Bulletins',    to: '/rh/paie/bulletins' },
  { label: 'Journaliers',  to: '/rh/paie/journaliers' },
  { label: 'Missions MOO', to: '/rh/paie/missions' },
]

export const STOCKS_TABS = [
  { label: 'Articles',          to: '/stocks', end: true },
  { label: 'Mouvements',        to: '/stocks/mouvements' },
  { label: 'Lots biologiques',  to: '/stocks/lots-biologiques' },
  { label: 'Matériaux BTP',     to: '/stocks/materiaux-btp' },
  { label: 'Déchets',           to: '/stocks/dechets' },
  { label: 'Alertes',           to: '/stocks/alertes' },
]

export const CRM_TABS = [
  { label: 'Clients',   to: '/crm', end: true },
  { label: 'Prospects', to: '/crm/prospects' },
  { label: 'Devis',     to: '/comptabilite/devis' },
  { label: 'Pipeline',  to: '/crm/pipeline' },
  { label: 'Contrats',  to: '/crm/contrats' },
]

export const PROJETS_TABS = [
  { label: 'Projets',        to: '/projets', end: true },
  { label: 'Planning Gantt', to: '/projets/planning' },
]

export const REPORTING_TABS = [
  { label: 'Tableau de bord',       to: '/' , end: true },
  { label: 'KPIs métier',           to: '/reporting', end: true },
  { label: 'Bilan Carbone & ESG',   to: '/reporting/esg' },
  { label: 'Rapports',              to: '/reporting/rapports' },
]

export const OPERATIONS_TABS = [
  { label: 'Sites',           to: '/operations/sites', end: true },
  { label: 'Journaliers',     to: '/operations/journaliers' },
  { label: 'Logs de travail', to: '/operations/logs' },
  { label: 'Tâches',          to: '/operations/taches-catalogue' },
]
