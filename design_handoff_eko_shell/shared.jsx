/* Shared icons + module data for the 3 directions */

const Icon = {
  Dashboard: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  RH: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.7-3.4 3.5-5.5 6.5-5.5s5.8 2.1 6.5 5.5" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M16 13.5c2.6.1 4.7 1.8 5.5 4.5" />
    </svg>
  ),
  Projets: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 21h18" />
      <path d="M5 21V10l7-5 7 5v11" />
      <path d="M9 21v-6h6v6" />
      <circle cx="12" cy="11" r="1" />
    </svg>
  ),
  CRM: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  ),
  Stocks: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 12l9 4 9-4" />
      <path d="M3 17l9 4 9-4" />
    </svg>
  ),
  Compta: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M7 14h3M14 14h3M7 17h6" />
    </svg>
  ),
  Reporting: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 21V5" />
      <path d="M3 21h18" />
      <rect x="7" y="13" width="3" height="6" rx="0.5" />
      <rect x="12" y="9" width="3" height="10" rx="0.5" />
      <rect x="17" y="5" width="3" height="14" rx="0.5" />
    </svg>
  ),
  Chevron: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  ChevronUp: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  ),
  ChevronDown: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Logout: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  ),
  Help: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  ),
  Menu: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  Bell: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  ArrowUp: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M7 14l5-5 5 5" />
    </svg>
  ),
  ArrowDown: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M7 10l5 5 5-5" />
    </svg>
  ),
  Leaf: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M17 3c-5 0-9 4-11 8s-2 8 0 10c2-2 6-2 10-4s8-6 8-11c0-2-1-3-2-3-1-1-3 0-5 0z" />
    </svg>
  ),
};

/* Modules — used by all 3 directions */
const MODULES = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    short: 'Accueil',
    icon: 'Dashboard',
    group: 'Pilotage',
  },
  {
    id: 'rh',
    label: 'GRH',
    short: 'GRH',
    icon: 'RH',
    group: 'Équipe',
    children: [
      { id: 'rh/employes', label: 'Employés' },
      { id: 'rh/pointage', label: 'Pointage journée' },
      { id: 'rh/pointage-semaine', label: 'Pointage semaine' },
      { id: 'rh/paie', label: 'Paie & bulletins' },
    ],
  },
  {
    id: 'projets',
    label: 'Projets',
    short: 'Projets',
    icon: 'Projets',
    group: 'Exploitation',
    children: [
      { id: 'projets/chantiers', label: 'Chantiers BTP' },
      { id: 'projets/agri', label: 'Agriculture' },
      { id: 'projets/locations', label: 'Locations' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    short: 'CRM',
    icon: 'CRM',
    group: 'Commercial',
    children: [
      { id: 'crm/clients', label: 'Clients' },
      { id: 'crm/devis', label: 'Devis' },
      { id: 'crm/prospects', label: 'Prospects' },
    ],
  },
  {
    id: 'stocks',
    label: 'Stocks',
    short: 'Stocks',
    icon: 'Stocks',
    group: 'Exploitation',
    children: [
      { id: 'stocks/articles', label: 'Articles' },
      { id: 'stocks/mouvements', label: 'Mouvements' },
      { id: 'stocks/alertes', label: 'Alertes' },
    ],
  },
  {
    id: 'compta',
    label: 'Comptabilité',
    short: 'Compta',
    icon: 'Compta',
    group: 'Commercial',
    children: [
      { id: 'compta/factures', label: 'Factures' },
      { id: 'compta/paiements', label: 'Paiements' },
      { id: 'compta/charges', label: 'Charges' },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    short: 'KPI',
    icon: 'Reporting',
    group: 'Pilotage',
  },
];

const MODULE_BY_ID = Object.fromEntries(MODULES.map(m => [m.id, m]));

const GROUPS = ['Pilotage', 'Exploitation', 'Équipe', 'Commercial'];

/* Bottom-nav set for mobile (5 max) */
const BOTTOM_NAV = ['dashboard', 'rh', 'projets', 'crm', 'compta'];

/* Demo page content — keyed by module top-level id and child id */
const PAGES = {
  dashboard: {
    title: 'Tableau de bord',
    subtitle: 'Vue d\u2019ensemble \u2014 Avril 2026',
    kpis: [
      { label: 'CA mensuel', value: '38,2 M', unit: 'FCFA', trend: '+12%', up: true },
      { label: 'Chantiers actifs', value: '14', unit: '', trend: '+2', up: true },
      { label: 'Journaliers présents', value: '87', unit: '/ 102', trend: '-5', up: false },
      { label: 'Factures impayées', value: '8,4 M', unit: 'FCFA', trend: '-18%', up: true },
    ],
  },
  rh: {
    title: 'RH & Paie',
    subtitle: '102 employés \u2014 12 chantiers',
    kpis: [
      { label: 'Permanents', value: '23', unit: 'CDI', trend: '+1', up: true },
      { label: 'Journaliers', value: '64', unit: 'présents', trend: '+8', up: true },
      { label: 'MOO actifs', value: '15', unit: 'missions', trend: '0', up: true },
      { label: 'Masse salariale', value: '14,8 M', unit: 'FCFA / mois', trend: '+3%', up: false },
    ],
  },
  projets: {
    title: 'Projets',
    subtitle: '14 chantiers \u2014 5 pépinières \u2014 3 locations',
    kpis: [
      { label: 'Chantiers BTP', value: '14', unit: 'en cours', trend: '+2', up: true },
      { label: 'Avancement moy.', value: '67', unit: '%', trend: '+4 pts', up: true },
      { label: 'Retards', value: '2', unit: 'chantiers', trend: '-1', up: true },
      { label: 'Marge moy.', value: '22', unit: '%', trend: '+1.5 pts', up: true },
    ],
  },
  crm: {
    title: 'CRM',
    subtitle: '142 clients \u2014 38 prospects actifs',
    kpis: [
      { label: 'Clients actifs', value: '142', unit: '', trend: '+6', up: true },
      { label: 'Devis en cours', value: '21', unit: '8,4 M FCFA', trend: '+3', up: true },
      { label: 'Taux de conv.', value: '34', unit: '%', trend: '+2 pts', up: true },
      { label: 'Pipeline', value: '54 M', unit: 'FCFA', trend: '+11%', up: true },
    ],
  },
  stocks: {
    title: 'Stocks',
    subtitle: '486 articles \u2014 4 magasins',
    kpis: [
      { label: 'Articles', value: '486', unit: 'références', trend: '+12', up: true },
      { label: 'Valeur stock', value: '24,1 M', unit: 'FCFA', trend: '+4%', up: true },
      { label: 'Alertes rupture', value: '7', unit: 'articles', trend: '+2', up: false },
      { label: 'Rotation', value: '4,8', unit: 'x / an', trend: '+0.3', up: true },
    ],
  },
  compta: {
    title: 'Comptabilité',
    subtitle: 'Avril 2026 \u2014 Exercice en cours',
    kpis: [
      { label: 'Factures émises', value: '54', unit: '38,2 M FCFA', trend: '+8', up: true },
      { label: 'Encaissements', value: '29,8 M', unit: 'FCFA', trend: '+12%', up: true },
      { label: 'Impayés > 30j', value: '8,4 M', unit: 'FCFA', trend: '-18%', up: true },
      { label: 'Charges', value: '17,2 M', unit: 'FCFA', trend: '+5%', up: false },
    ],
  },
  reporting: {
    title: 'Reporting',
    subtitle: 'KPIs \u2014 vue consolidée',
    kpis: [
      { label: 'CA cumulé YTD', value: '142 M', unit: 'FCFA', trend: '+18%', up: true },
      { label: 'Résultat net', value: '21 M', unit: 'FCFA', trend: '+9%', up: true },
      { label: 'Coût moy. chantier', value: '8,2 M', unit: 'FCFA', trend: '-3%', up: true },
      { label: 'Productivité MOO', value: '142', unit: '€ / jour', trend: '+6%', up: true },
    ],
  },
};

/* Sample rows for table-like blocks (used in details) */
const RECENT_ACTIVITY = [
  { id: 'CHA-014', label: 'Réfection villa Cocody', meta: 'BTP \u2022 78%', status: 'En cours', tone: 'info' },
  { id: 'FNE-2026-038', label: 'Facture FNE \u2014 Sopres SARL', meta: '4,2 M FCFA', status: 'Payée', tone: 'good' },
  { id: 'PNT-04-22', label: 'Pointage 22 avr. \u2014 Chantier Riviera', meta: '14 journaliers', status: 'Validé', tone: 'good' },
  { id: 'STK-A-091', label: 'Alerte stock \u2014 Ciment CPJ 35', meta: '8 sacs restants', status: 'Rupture', tone: 'bad' },
  { id: 'CLI-007', label: 'Nouveau prospect \u2014 BTP Sahel', meta: 'Devis 12 M FCFA', status: 'Prospect', tone: 'info' },
  { id: 'EMP-049', label: 'Embauche \u2014 Konaté Issa', meta: 'Maçon CDI', status: 'CDI', tone: 'good' },
];

Object.assign(window, { Icon, MODULES, MODULE_BY_ID, GROUPS, BOTTOM_NAV, PAGES, RECENT_ACTIVITY });
