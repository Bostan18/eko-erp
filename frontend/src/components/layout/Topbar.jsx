import { useLocation, Link } from 'react-router-dom'

const ROUTE_LABELS = {
  '/':                          ['Pilotage', 'Tableau de bord'],
  '/reporting':                 ['Pilotage', 'Reporting'],
  '/rh':                        ['Opérations', 'RH & Paie', 'Employés'],
  '/rh/pointage':               ['Opérations', 'RH & Paie', 'Pointage journée'],
  '/rh/pointage-semaine':       ['Opérations', 'RH & Paie', 'Pointage semaine'],
  '/projets':                   ['Opérations', 'Projets'],
  '/stocks':                    ['Opérations', 'Stocks'],
  '/crm':                       ['Commerce', 'CRM'],
  '/comptabilite/factures':     ['Finance', 'Comptabilité', 'Factures'],
  '/comptabilite/charges':      ['Finance', 'Comptabilité', 'Charges'],
  '/documents':                 ['Conformité', 'Documents'],
}

function deriveCrumb(pathname) {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  // Fallback : prefix match
  const match = Object.keys(ROUTE_LABELS)
    .filter((k) => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? [...ROUTE_LABELS[match], '…'] : ['EKO']
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
              {i < parents.length - 1 && <span className="text-sand-300 mx-1">/</span>}
            </span>
          ))}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-sand-500">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="bg-sand-100 border border-sand-200 rounded-lg pl-8 pr-3 py-1.5 text-[13px] w-[240px]
                       focus:outline-none focus:border-forest-500 focus:bg-white transition"
            placeholder="Rechercher facture, client, employé…"
          />
        </div>

        <button className="w-8 h-8 rounded-lg border border-sand-200 bg-white flex items-center justify-center hover:bg-sand-50 relative" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-sand-700">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

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
