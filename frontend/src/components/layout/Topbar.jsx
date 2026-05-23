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

export default function Topbar() {
  const { pathname } = useLocation()
  const crumb = deriveCrumb(pathname)
  const current = crumb[crumb.length - 1]
  const parents = crumb.slice(0, -1)

  return (
    <header className="h-[52px] bg-white border-b border-sand-200 flex items-center px-6 gap-4 shrink-0">
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
        <GlobalSearch />

        <NotificationsBell />

        <button className="w-8 h-8 rounded-lg border border-sand-200 bg-white flex items-center justify-center hover:bg-sand-50" title="Aide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-sand-700">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1.2-1.5 2.2" />
            <circle cx="12" cy="17" r=".8" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  )
}
