import { useLocation } from 'react-router-dom'
import GlobalSearch from './GlobalSearch'
import NotificationsBell from './NotificationsBell'

// Sections alignées sur la maquette
const ROUTE_LABELS = {
  '/':                          ["Vue d'ensemble", 'Tableau de bord'],
  '/reporting':                 ['Analyse', 'BI & Reporting'],
  '/reporting/esg':             ['Analyse', 'BI & Reporting', 'Bilan Carbone & ESG'],
  '/reporting/rapports':        ['Analyse', 'BI & Reporting', 'Rapports'],
  '/rh':                        ['Ressources Humaines', 'RH & Paie', 'Employés'],
  '/rh/pointage':               ['Ressources Humaines', 'RH & Paie', 'Pointage journée'],
  '/rh/pointage-semaine':       ['Ressources Humaines', 'RH & Paie', 'Pointage semaine'],
  '/rh/conges':                 ['Ressources Humaines', 'RH & Paie', 'Congés'],
  '/projets':                   ['Opérations', 'Projets'],
  '/operations':                ['Opérations', 'Opérations terrain'],
  '/parc':                      ['Opérations', 'Parc machines'],
  '/stocks':                    ['Opérations', 'Stocks'],
  '/crm':                       ['Commercial', 'CRM & Ventes'],
  '/comptabilite/factures':     ['Comptabilité', 'Facturation FNE', 'Factures'],
  '/comptabilite/charges':      ['Comptabilité', 'Facturation FNE', 'Charges'],
  '/comptabilite/devis':        ['Comptabilité', 'Facturation FNE', 'Devis'],
  '/achats/factures':           ['Comptabilité', 'Achats & Trésorerie', 'Factures'],
  '/documents':                 ['Analyse', 'Documents'],
}

function deriveCrumb(pathname) {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  // Fallback : prefix match
  const match = Object.keys(ROUTE_LABELS)
    .filter((k) => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? [...ROUTE_LABELS[match], '…'] : ['EKO ERP']
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const crumb = deriveCrumb(pathname)
  const current = crumb[crumb.length - 1]
  const parents = crumb.slice(0, -1)

  return (
    <header className="h-[52px] bg-white border-b border-sand-200 flex items-center px-3 md:px-6 gap-2 md:gap-4 shrink-0">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
        className="md:hidden -ml-1 p-2 rounded-lg text-sand-700 hover:bg-sand-100 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex items-baseline gap-2 min-w-0">
        <p className="font-display font-semibold text-sm truncate">{current}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500 hidden md:flex items-center gap-1">
          {parents.map((c, i) => (
            <span key={i}>
              {c}
              {i < parents.length - 1 && <span className="text-sand-300 mx-1">›</span>}
            </span>
          ))}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:block">
          <GlobalSearch />
        </div>

        <NotificationsBell />
      </div>
    </header>
  )
}
