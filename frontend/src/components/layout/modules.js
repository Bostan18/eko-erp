/* Définition des modules de la coquille — alignée sur les routes de App.jsx.
   Les sous-items sans route dédiée pointent vers le parent ou le placeholder
   le plus proche. */

export const MODULES = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    short: 'Accueil',
    icon: 'Dashboard',
    group: 'Pilotage',
    path: '/',
  },
  {
    id: 'rh',
    label: 'GRH',
    short: 'GRH',
    icon: 'RH',
    group: 'Équipe',
    path: '/rh',
    children: [
      { id: 'rh/employes',         label: 'Employés',          path: '/rh' },
      { id: 'rh/pointage',         label: 'Pointage journée',  path: '/rh/pointage' },
      { id: 'rh/pointage-semaine', label: 'Pointage semaine',  path: '/rh/pointage-semaine' },
      { id: 'rh/paie/bulletins',   label: 'Bulletins CDI',     path: '/rh/paie/bulletins' },
      { id: 'rh/paie/journaliers', label: 'Paiements journaliers', path: '/rh/paie/journaliers' },
      { id: 'rh/paie/missions',    label: 'Missions MOO',      path: '/rh/paie/missions' },
    ],
  },
  {
    id: 'projets',
    label: 'Projets',
    short: 'Projets',
    icon: 'Projets',
    group: 'Exploitation',
    path: '/projets',
    children: [
      { id: 'projets/planning',  label: 'Planning Gantt', path: '/projets/planning' },
      { id: 'projets/btp',       label: 'BTP',            path: '/projets/btp' },
      { id: 'projets/agri',      label: 'Agriculture',    path: '/projets/agriculture' },
      { id: 'projets/pepiniere', label: 'Pépinière',      path: '/projets/pepiniere' },
      { id: 'projets/locations', label: 'Locations',      path: '/projets/locations' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    short: 'CRM',
    icon: 'CRM',
    group: 'Commercial',
    path: '/crm',
    children: [
      { id: 'crm/clients',   label: 'Clients',   path: '/crm' },
      { id: 'crm/devis',     label: 'Devis',     path: '/comptabilite/devis' },
      { id: 'crm/prospects', label: 'Prospects', path: '/crm/prospects' },
    ],
  },
  {
    id: 'stocks',
    label: 'Stocks',
    short: 'Stocks',
    icon: 'Stocks',
    group: 'Exploitation',
    path: '/stocks',
    children: [
      { id: 'stocks/articles',    label: 'Articles',    path: '/stocks' },
      { id: 'stocks/mouvements',  label: 'Mouvements',  path: '/stocks/mouvements' },
      { id: 'stocks/alertes',     label: 'Alertes',     path: '/stocks/alertes' },
    ],
  },
  {
    id: 'compta',
    label: 'Comptabilité',
    short: 'Compta',
    icon: 'Compta',
    group: 'Commercial',
    path: '/comptabilite/factures',
    children: [
      { id: 'compta/factures',  label: 'Factures',  path: '/comptabilite/factures' },
      { id: 'compta/devis',     label: 'Devis',     path: '/comptabilite/devis' },
      { id: 'compta/charges',   label: 'Charges',   path: '/comptabilite/charges' },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    short: 'KPI',
    icon: 'Reporting',
    group: 'Pilotage',
    path: '/reporting',
  },
  {
    id: 'parametres',
    label: 'Paramètres',
    short: 'Config',
    icon: 'Settings',
    group: 'Configuration',
    path: '/parametres/entreprise',
    children: [
      { id: 'parametres/entreprise', label: 'Entreprise', path: '/parametres/entreprise' },
    ],
  },
]

export const BOTTOM_NAV_IDS = ['dashboard', 'rh', 'projets', 'crm', 'compta']

const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]))
export { MODULE_BY_ID }

const ROUTE_TO_MODULE = [
  { test: (p) => p === '/' || p === '',                              modId: 'dashboard' },
  { test: (p) => p.startsWith('/rh/pointage-semaine'),               modId: 'rh', childId: 'rh/pointage-semaine' },
  { test: (p) => p.startsWith('/rh/pointage'),                       modId: 'rh', childId: 'rh/pointage' },
  { test: (p) => p.startsWith('/rh/paie/bulletins'),                 modId: 'rh', childId: 'rh/paie/bulletins' },
  { test: (p) => p.startsWith('/rh/paie/journaliers'),               modId: 'rh', childId: 'rh/paie/journaliers' },
  { test: (p) => p.startsWith('/rh/paie/missions'),                  modId: 'rh', childId: 'rh/paie/missions' },
  { test: (p) => p.startsWith('/rh'),                                modId: 'rh', childId: 'rh/employes' },
  { test: (p) => p.startsWith('/projets/planning'),                  modId: 'projets', childId: 'projets/planning' },
  { test: (p) => p.startsWith('/projets/btp'),                       modId: 'projets', childId: 'projets/btp' },
  { test: (p) => p.startsWith('/projets/agriculture'),               modId: 'projets', childId: 'projets/agri' },
  { test: (p) => p.startsWith('/projets/pepiniere'),                 modId: 'projets', childId: 'projets/pepiniere' },
  { test: (p) => p.startsWith('/projets/locations'),                 modId: 'projets', childId: 'projets/locations' },
  { test: (p) => p.startsWith('/projets'),                           modId: 'projets' },
  { test: (p) => p.startsWith('/crm/prospects'),                     modId: 'crm', childId: 'crm/prospects' },
  { test: (p) => p.startsWith('/crm'),                               modId: 'crm', childId: 'crm/clients' },
  { test: (p) => p.startsWith('/stocks/alertes'),                    modId: 'stocks', childId: 'stocks/alertes' },
  { test: (p) => p.startsWith('/stocks/mouvements'),                 modId: 'stocks', childId: 'stocks/mouvements' },
  { test: (p) => p.startsWith('/stocks'),                            modId: 'stocks', childId: 'stocks/articles' },
  { test: (p) => p.startsWith('/comptabilite/charges'),              modId: 'compta', childId: 'compta/charges' },
  { test: (p) => p.startsWith('/comptabilite/devis'),                modId: 'compta', childId: 'compta/devis' },
  { test: (p) => p.startsWith('/comptabilite'),                      modId: 'compta', childId: 'compta/factures' },
  { test: (p) => p.startsWith('/reporting'),                         modId: 'reporting' },
  { test: (p) => p.startsWith('/parametres'),                        modId: 'parametres', childId: 'parametres/entreprise' },
]

export function matchActive(pathname) {
  const hit = ROUTE_TO_MODULE.find((r) => r.test(pathname))
  return {
    modId: hit?.modId ?? 'dashboard',
    childId: hit?.childId ?? null,
  }
}
