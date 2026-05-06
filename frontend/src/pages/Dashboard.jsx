const stats = [
  {
    label: 'Employés actifs',
    value: '—',
    sub: 'CDI + Journaliers',
    color: 'bg-forest-50 text-forest-700 border-forest-100',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Projets en cours',
    value: '—',
    sub: 'BTP · Agriculture · Location',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M2 20h20M5 20V8l7-5 7 5v12" /><path d="M9 20v-5h6v5" />
      </svg>
    ),
  },
  {
    label: 'Clients',
    value: '—',
    sub: 'Actifs & prospects',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Alertes stock',
    value: '—',
    sub: 'Articles sous seuil',
    color: 'bg-red-50 text-red-700 border-red-100',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
]

const modules = [
  { label: 'RH & Paie', desc: 'Employés, pointage, salaires', path: '/rh', color: 'forest' },
  { label: 'Projets', desc: 'Chantiers BTP, plantations', path: '/projets', color: 'blue' },
  { label: 'CRM', desc: 'Clients, prospects, devis', path: '/crm', color: 'amber' },
  { label: 'Stocks', desc: 'Inventaire, alertes', path: '/stocks', color: 'purple' },
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-gray-900 text-2xl">Tableau de bord</h1>
        <p className="font-body text-gray-500 text-sm mt-1">Bienvenue sur EKO SARL ERP — vue d'ensemble</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, color, icon }) => (
          <div key={label} className={`card p-5 border ${color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
                <p className="font-display font-bold text-3xl mt-1">{value}</p>
                <p className="font-body text-xs mt-1 opacity-60">{sub}</p>
              </div>
              <div className="opacity-40 mt-0.5">{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modules rapides */}
      <div>
        <h2 className="font-display font-semibold text-gray-800 text-base mb-4">Accès rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map(({ label, desc, path }) => (
            <a key={path} href={path} className="card p-5 hover:shadow-md transition-shadow duration-150 group cursor-pointer block">
              <p className="font-display font-semibold text-gray-800 text-sm group-hover:text-forest-700 transition-colors">{label}</p>
              <p className="font-body text-xs text-gray-500 mt-1">{desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
