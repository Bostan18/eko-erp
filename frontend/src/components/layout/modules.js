/* Source unique de vérité pour la navigation.
 * Consommée par :
 *   - Sidebar.jsx        via sidebarSections()
 *   - Topbar.jsx         via breadcrumbFor(pathname)
 *   - ModuleTabs.jsx     via tabsForModule(id)
 *   - BottomNav.jsx      via BOTTOM_NAV_IDS + MODULE_BY_ID
 *   - MainLayout.jsx     via matchActive(pathname)
 *
 * Schéma d'un module :
 *   id            id technique (ex: 'compta')
 *   label         libellé "long" (breadcrumb, BottomNav fallback)
 *   sidebarLabel  libellé affiché dans la sidebar (souvent ≠ label)
 *   short         libellé court pour BottomNav
 *   section       titre de groupe dans la sidebar (eyebrow)
 *   icon          clé du registre BottomNav (components/icons.jsx)
 *   sidebarIcon   clé du registre Sidebar (components/ui/Icons.jsx)
 *   path          route par défaut (1er onglet du module)
 *   prefix        préfixe d'URL pour activer la sidebar (défaut = path)
 *   exact         match strict de path (réservé à '/')
 *   bottomNav     présent dans la BottomNav mobile
 *   children      sous-onglets — utilisés par tabsForModule + matchActive
 *     { id, label, path, end?, tab? }   tab: false pour exclure d'un X_TABS
 */

export const MODULES = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    sidebarLabel: 'Tableau de bord',
    short: 'Accueil',
    section: "Vue d'ensemble",
    icon: 'Dashboard',
    sidebarIcon: 'Dashboard',
    path: '/',
    exact: true,
    bottomNav: true,
  },

  {
    id: 'compta',
    label: 'Comptabilité',
    sidebarLabel: 'Facturation FNE',
    short: 'Compta',
    section: 'Comptabilité',
    icon: 'Compta',
    sidebarIcon: 'Card',
    path: '/comptabilite/factures',
    prefix: '/comptabilite',
    bottomNav: true,
    children: [
      { id: 'compta/factures', label: 'Factures', path: '/comptabilite/factures', end: true },
      { id: 'compta/avoirs',   label: 'Avoirs',   path: '/comptabilite/avoirs' },
      { id: 'compta/devis',    label: 'Devis',    path: '/comptabilite/devis' },
      { id: 'compta/stickers', label: 'Stickers', path: '/comptabilite/stickers' },
      { id: 'compta/charges',  label: 'Charges',  path: '/comptabilite/charges' },
    ],
  },

  {
    id: 'achats',
    label: 'Achats',
    sidebarLabel: 'Achats & Trésorerie',
    short: 'Achats',
    section: 'Comptabilité',
    icon: 'Compta',
    sidebarIcon: 'ShoppingBag',
    path: '/achats/factures',
    prefix: '/achats',
    children: [
      { id: 'achats/factures',     label: 'Factures achats', path: '/achats/factures', end: true },
      { id: 'achats/fournisseurs', label: 'Fournisseurs',    path: '/achats/fournisseurs' },
      { id: 'achats/comptes',      label: 'Comptes',         path: '/achats/comptes' },
      { id: 'achats/tresorerie',   label: 'Paiements',       path: '/achats/tresorerie' },
    ],
  },

  {
    id: 'rh',
    label: 'GRH',
    sidebarLabel: 'RH & Paie',
    short: 'GRH',
    section: 'Ressources Humaines',
    icon: 'RH',
    sidebarIcon: 'Users',
    path: '/rh',
    prefix: '/rh',
    bottomNav: true,
    children: [
      { id: 'rh/employes',         label: 'Employés',     path: '/rh', end: true },
      { id: 'rh/pointage',         label: 'Pointage',     path: '/rh/pointage' },
      { id: 'rh/pointage-semaine', label: 'Semaine',      path: '/rh/pointage-semaine' },
      { id: 'rh/conges',           label: 'Congés',       path: '/rh/conges' },
      { id: 'rh/paie/bulletins',   label: 'Bulletins',    path: '/rh/paie/bulletins' },
      { id: 'rh/paie/journaliers', label: 'Journaliers',  path: '/rh/paie/journaliers' },
      { id: 'rh/paie/missions',    label: 'Missions MOO', path: '/rh/paie/missions' },
    ],
  },

  {
    id: 'projets',
    label: 'Projets',
    sidebarLabel: 'Projets',
    short: 'Projets',
    section: 'Opérations',
    icon: 'Projets',
    sidebarIcon: 'Projects',
    path: '/projets',
    prefix: '/projets',
    bottomNav: true,
    children: [
      { id: 'projets/liste',     label: 'Projets',        path: '/projets', end: true },
      { id: 'projets/planning',  label: 'Planning Gantt', path: '/projets/planning' },
      // Vues filtrées (matchActive uniquement, pas d'onglet dédié)
      { id: 'projets/btp',       label: 'BTP',            path: '/projets/btp',          tab: false },
      { id: 'projets/agri',      label: 'Agriculture',    path: '/projets/agriculture',  tab: false },
      { id: 'projets/pepiniere', label: 'Pépinière',      path: '/projets/pepiniere',    tab: false },
      { id: 'projets/locations', label: 'Locations',      path: '/projets/locations',    tab: false },
    ],
  },

  {
    id: 'operations',
    label: 'Opérations',
    sidebarLabel: 'Opérations terrain',
    short: 'Ops',
    section: 'Opérations',
    icon: 'Projets',
    sidebarIcon: 'Shield',
    path: '/operations/sites',
    prefix: '/operations',
    children: [
      { id: 'operations/sites',       label: 'Sites',           path: '/operations/sites', end: true },
      { id: 'operations/journaliers', label: 'Journaliers',     path: '/operations/journaliers' },
      { id: 'operations/logs',        label: 'Logs de travail', path: '/operations/logs' },
      { id: 'operations/taches',      label: 'Tâches',          path: '/operations/taches-catalogue' },
    ],
  },

  {
    id: 'parc',
    label: 'Parc machines',
    sidebarLabel: 'Parc machines',
    short: 'Parc',
    section: 'Opérations',
    icon: 'Projets',
    sidebarIcon: 'Excavator',
    path: '/parc',
    prefix: '/parc',
  },

  {
    id: 'stocks',
    label: 'Stocks',
    sidebarLabel: 'Stocks',
    short: 'Stocks',
    section: 'Opérations',
    icon: 'Stocks',
    sidebarIcon: 'Stocks',
    path: '/stocks',
    prefix: '/stocks',
    children: [
      { id: 'stocks/articles',    label: 'Articles',         path: '/stocks', end: true },
      { id: 'stocks/mouvements',  label: 'Mouvements',       path: '/stocks/mouvements' },
      { id: 'stocks/lots-bio',    label: 'Lots biologiques', path: '/stocks/lots-biologiques' },
      { id: 'stocks/materiaux',   label: 'Matériaux BTP',    path: '/stocks/materiaux-btp' },
      { id: 'stocks/dechets',     label: 'Déchets',          path: '/stocks/dechets' },
      { id: 'stocks/alertes',     label: 'Alertes',          path: '/stocks/alertes' },
    ],
  },

  {
    id: 'crm',
    label: 'CRM',
    sidebarLabel: 'CRM & Ventes',
    short: 'CRM',
    section: 'Commercial',
    icon: 'CRM',
    sidebarIcon: 'CRM',
    path: '/crm',
    prefix: '/crm',
    bottomNav: true,
    children: [
      { id: 'crm/clients',   label: 'Clients',   path: '/crm', end: true },
      { id: 'crm/prospects', label: 'Prospects', path: '/crm/prospects' },
      // Onglet cross-module : pointe vers compta/devis depuis l'écran CRM
      { id: 'crm/devis',     label: 'Devis',     path: '/comptabilite/devis' },
      { id: 'crm/pipeline',  label: 'Pipeline',  path: '/crm/pipeline' },
      { id: 'crm/contrats',  label: 'Contrats',  path: '/crm/contrats' },
    ],
  },

  {
    id: 'reporting',
    label: 'Reporting',
    sidebarLabel: 'BI & Reporting',
    short: 'KPI',
    section: 'Analyse',
    icon: 'Reporting',
    sidebarIcon: 'ChartBar',
    path: '/reporting',
    prefix: '/reporting',
    children: [
      { id: 'reporting/dashboard', label: 'Tableau de bord',     path: '/',                   end: true },
      { id: 'reporting/kpis',      label: 'KPIs métier',         path: '/reporting',          end: true },
      { id: 'reporting/esg',       label: 'Bilan Carbone & ESG', path: '/reporting/esg' },
      { id: 'reporting/rapports',  label: 'Rapports',            path: '/reporting/rapports' },
    ],
  },

  {
    id: 'documents',
    label: 'Documents',
    sidebarLabel: 'Documents',
    short: 'Docs',
    section: 'Analyse',
    icon: 'Reporting',
    sidebarIcon: 'Document',
    path: '/documents',
    prefix: '/documents',
  },

  {
    id: 'parametres',
    label: 'Paramètres',
    sidebarLabel: 'Paramètres',
    short: 'Config',
    section: 'Configuration',
    icon: 'Settings',
    sidebarIcon: 'Settings',
    path: '/parametres/entreprise',
    prefix: '/parametres',
    children: [
      { id: 'parametres/entreprise',   label: 'Entreprise',   path: '/parametres/entreprise' },
      { id: 'parametres/utilisateurs', label: 'Utilisateurs', path: '/parametres/utilisateurs' },
    ],
  },
]

/* ─── Index dérivés ──────────────────────────────────────── */

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]))

export const BOTTOM_NAV_IDS = MODULES.filter((m) => m.bottomNav).map((m) => m.id)

/* ─── Sidebar : groupe les modules par section ───────────── */

export function sidebarSections() {
  const groups = new Map()
  for (const m of MODULES) {
    if (!m.section) continue
    if (!groups.has(m.section)) groups.set(m.section, [])
    groups.get(m.section).push({
      id: m.id,
      label: m.sidebarLabel ?? m.label,
      path: m.path,
      prefix: m.prefix,
      exact: m.exact === true,
      iconKey: m.sidebarIcon,
    })
  }
  return Array.from(groups, ([section, items]) => ({ section, items }))
}

/* ─── ModuleTabs : onglets in-page d'un module ───────────── */

export function tabsForModule(id) {
  const m = MODULE_BY_ID[id]
  if (!m?.children) return []
  return m.children
    .filter((c) => c.tab !== false)
    .map((c) => ({ label: c.label, to: c.path, end: c.end }))
}

/* ─── matchActive : résout pathname → module + child ─────── */
/* Ordre important : les routes les plus spécifiques d'abord. */

const ROUTE_TO_MODULE = [
  { test: (p) => p === '/' || p === '',                          modId: 'dashboard' },

  { test: (p) => p.startsWith('/rh/pointage-semaine'),           modId: 'rh', childId: 'rh/pointage-semaine' },
  { test: (p) => p.startsWith('/rh/pointage'),                   modId: 'rh', childId: 'rh/pointage' },
  { test: (p) => p.startsWith('/rh/conges'),                     modId: 'rh', childId: 'rh/conges' },
  { test: (p) => p.startsWith('/rh/paie/bulletins'),             modId: 'rh', childId: 'rh/paie/bulletins' },
  { test: (p) => p.startsWith('/rh/paie/journaliers'),           modId: 'rh', childId: 'rh/paie/journaliers' },
  { test: (p) => p.startsWith('/rh/paie/missions'),              modId: 'rh', childId: 'rh/paie/missions' },
  { test: (p) => p.startsWith('/rh'),                            modId: 'rh', childId: 'rh/employes' },

  { test: (p) => p.startsWith('/projets/planning'),              modId: 'projets', childId: 'projets/planning' },
  { test: (p) => p.startsWith('/projets/btp'),                   modId: 'projets', childId: 'projets/btp' },
  { test: (p) => p.startsWith('/projets/agriculture'),           modId: 'projets', childId: 'projets/agri' },
  { test: (p) => p.startsWith('/projets/pepiniere'),             modId: 'projets', childId: 'projets/pepiniere' },
  { test: (p) => p.startsWith('/projets/locations'),             modId: 'projets', childId: 'projets/locations' },
  { test: (p) => p.startsWith('/projets'),                       modId: 'projets', childId: 'projets/liste' },

  { test: (p) => p.startsWith('/operations/journaliers'),        modId: 'operations', childId: 'operations/journaliers' },
  { test: (p) => p.startsWith('/operations/logs'),               modId: 'operations', childId: 'operations/logs' },
  { test: (p) => p.startsWith('/operations/taches-catalogue'),   modId: 'operations', childId: 'operations/taches' },
  { test: (p) => p.startsWith('/operations'),                    modId: 'operations', childId: 'operations/sites' },

  { test: (p) => p.startsWith('/parc'),                          modId: 'parc' },

  { test: (p) => p.startsWith('/crm/prospects'),                 modId: 'crm', childId: 'crm/prospects' },
  { test: (p) => p.startsWith('/crm/pipeline'),                  modId: 'crm', childId: 'crm/pipeline' },
  { test: (p) => p.startsWith('/crm/contrats'),                  modId: 'crm', childId: 'crm/contrats' },
  { test: (p) => p.startsWith('/crm'),                           modId: 'crm', childId: 'crm/clients' },

  { test: (p) => p.startsWith('/stocks/alertes'),                modId: 'stocks', childId: 'stocks/alertes' },
  { test: (p) => p.startsWith('/stocks/mouvements'),             modId: 'stocks', childId: 'stocks/mouvements' },
  { test: (p) => p.startsWith('/stocks/lots-biologiques'),       modId: 'stocks', childId: 'stocks/lots-bio' },
  { test: (p) => p.startsWith('/stocks/materiaux-btp'),          modId: 'stocks', childId: 'stocks/materiaux' },
  { test: (p) => p.startsWith('/stocks/dechets'),                modId: 'stocks', childId: 'stocks/dechets' },
  { test: (p) => p.startsWith('/stocks'),                        modId: 'stocks', childId: 'stocks/articles' },

  { test: (p) => p.startsWith('/comptabilite/avoirs'),           modId: 'compta', childId: 'compta/avoirs' },
  { test: (p) => p.startsWith('/comptabilite/devis'),            modId: 'compta', childId: 'compta/devis' },
  { test: (p) => p.startsWith('/comptabilite/stickers'),         modId: 'compta', childId: 'compta/stickers' },
  { test: (p) => p.startsWith('/comptabilite/charges'),          modId: 'compta', childId: 'compta/charges' },
  { test: (p) => p.startsWith('/comptabilite'),                  modId: 'compta', childId: 'compta/factures' },

  { test: (p) => p.startsWith('/achats/fournisseurs'),           modId: 'achats', childId: 'achats/fournisseurs' },
  { test: (p) => p.startsWith('/achats/comptes'),                modId: 'achats', childId: 'achats/comptes' },
  { test: (p) => p.startsWith('/achats/tresorerie'),             modId: 'achats', childId: 'achats/tresorerie' },
  { test: (p) => p.startsWith('/achats'),                        modId: 'achats', childId: 'achats/factures' },

  { test: (p) => p.startsWith('/documents'),                     modId: 'documents' },

  { test: (p) => p.startsWith('/reporting/esg'),                 modId: 'reporting', childId: 'reporting/esg' },
  { test: (p) => p.startsWith('/reporting/rapports'),            modId: 'reporting', childId: 'reporting/rapports' },
  { test: (p) => p.startsWith('/reporting'),                     modId: 'reporting', childId: 'reporting/kpis' },

  { test: (p) => p.startsWith('/parametres/utilisateurs'),       modId: 'parametres', childId: 'parametres/utilisateurs' },
  { test: (p) => p.startsWith('/parametres'),                    modId: 'parametres', childId: 'parametres/entreprise' },
]

export function matchActive(pathname) {
  const hit = ROUTE_TO_MODULE.find((r) => r.test(pathname))
  return {
    modId:   hit?.modId   ?? 'dashboard',
    childId: hit?.childId ?? null,
  }
}

/* ─── Topbar : breadcrumb dérivé du match ────────────────── */

export function breadcrumbFor(pathname) {
  const { modId, childId } = matchActive(pathname)
  const mod = MODULE_BY_ID[modId]
  if (!mod) return ['EKO ERP']
  const crumb = [mod.section, mod.sidebarLabel ?? mod.label].filter(Boolean)
  if (childId) {
    const child = mod.children?.find((c) => c.id === childId)
    // N'ajoute le child que s'il diffère du libellé module (évite "Projets / Projets").
    if (child && child.label !== mod.sidebarLabel && child.label !== mod.label) {
      crumb.push(child.label)
    }
  }
  return crumb
}
