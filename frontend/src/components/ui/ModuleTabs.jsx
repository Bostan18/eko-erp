import { NavLink } from 'react-router-dom'

/**
 * Onglets in-card servant de navigation entre les pages sœurs d'un module
 * (gabarit maquette EKO : ex. Comptabilité → Factures · Devis · Charges).
 * Chaque onglet est un lien ; l'onglet actif suit la route courante.
 *
 *   <ModuleTabs items={[{ label: 'Factures', to: '/comptabilite/factures' }, …]} />
 */
export default function ModuleTabs({ items }) {
  return (
    <div className="tabs">
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
  { label: 'Bulletins',    to: '/rh/paie/bulletins' },
  { label: 'Journaliers',  to: '/rh/paie/journaliers' },
  { label: 'Missions MOO', to: '/rh/paie/missions' },
]

export const STOCKS_TABS = [
  { label: 'Articles',   to: '/stocks', end: true },
  { label: 'Mouvements', to: '/stocks/mouvements' },
  { label: 'Alertes',    to: '/stocks/alertes' },
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
