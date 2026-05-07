import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { fmt, MOIS_FR } from '../utils/format'

export default function Dashboard() {
  const [kpis, setKpis]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reporting/kpis/')
      .then(({ data }) => setKpis(data))
      .finally(() => setLoading(false))
  }, [])

  const moisLabel = kpis ? `${MOIS_FR[kpis.finance.mois]} ${kpis.finance.annee}` : '…'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-gray-900 text-2xl">Tableau de bord</h1>
        <p className="font-body text-gray-500 text-sm mt-1">
          {loading ? 'Chargement…' : `Vue d'ensemble — ${moisLabel}`}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Employés actifs"
          value={loading ? '…' : kpis?.rh.employes_actifs}
          sub={loading ? '' : `${kpis?.rh.presences_aujourd_hui} présents aujourd'hui`}
          color="bg-forest-50 text-forest-700 border-forest-100"
          to="/rh"
          icon={<IconEmployes />}
        />
        <KpiCard
          label="Projets en cours"
          value={loading ? '…' : kpis?.projets.en_cours}
          sub={loading ? '' : projetsSubLabel(kpis?.projets.par_type)}
          color="bg-blue-50 text-blue-700 border-blue-100"
          to="/projets"
          icon={<IconProjets />}
        />
        <KpiCard
          label="Clients"
          value={loading ? '…' : kpis?.crm.clients_total}
          sub="Actifs & prospects"
          color="bg-amber-50 text-amber-700 border-amber-100"
          to="/crm"
          icon={<IconClients />}
        />
        <KpiCard
          label="Alertes stock"
          value={loading ? '…' : kpis?.stocks.alertes}
          sub="Articles sous seuil"
          color={(!loading && kpis?.stocks.alertes > 0) ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'}
          to="/stocks"
          icon={<IconAlertes />}
        />
      </div>

      <div>
        <h2 className="font-display font-semibold text-gray-800 text-base mb-4">Finance — {moisLabel}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FinCard label="CA facturé"   value={loading ? '…' : `${fmt(kpis?.finance.ca_facture)} F`}   color="text-gray-800" />
          <FinCard label="Encaissé"     value={loading ? '…' : `${fmt(kpis?.finance.ca_encaisse)} F`}  color="text-forest-700" />
          <FinCard label="Charges"      value={loading ? '…' : `${fmt(kpis?.finance.charges_mois)} F`} color="text-red-600" />
          <FinCard
            label="Marge nette"
            value={loading ? '…' : `${fmt(kpis?.finance.marge_mois)} F`}
            color={(!loading && kpis?.finance.marge_mois >= 0) ? 'text-forest-700' : 'text-red-600'}
          />
        </div>
        {!loading && kpis?.finance.factures_en_retard > 0 && (
          <Link to="/comptabilite/factures" className="mt-3 flex items-center gap-2 text-sm font-body text-red-600 hover:underline">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            {kpis.finance.factures_en_retard} facture{kpis.finance.factures_en_retard > 1 ? 's' : ''} en retard
          </Link>
        )}
      </div>

      <div>
        <h2 className="font-display font-semibold text-gray-800 text-base mb-4">RH — {moisLabel}</h2>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <FinCard label="Masse salariale" value={loading ? '…' : `${fmt(kpis?.rh.masse_salariale_mois)} F`} color="text-gray-800" />
          <FinCard label="Valeur du stock" value={loading ? '…' : `${fmt(kpis?.stocks.valeur_stock)} unités`} color="text-gray-800" />
        </div>
      </div>

      <div>
        <h2 className="font-display font-semibold text-gray-800 text-base mb-4">Accès rapide</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'RH & Paie',    desc: 'Employés, pointage, salaires', path: '/rh' },
            { label: 'Projets',      desc: 'Chantiers BTP, plantations',   path: '/projets' },
            { label: 'CRM',          desc: 'Clients, prospects, devis',    path: '/crm' },
            { label: 'Stocks',       desc: 'Inventaire, alertes',          path: '/stocks' },
          ].map(({ label, desc, path }) => (
            <Link key={path} to={path} className="card p-5 hover:shadow-md transition-shadow duration-150 group block">
              <p className="font-display font-semibold text-gray-800 text-sm group-hover:text-forest-700 transition-colors">{label}</p>
              <p className="font-body text-xs text-gray-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color, to, icon }) {
  return (
    <Link to={to} className={`card p-5 border ${color} hover:shadow-md transition-shadow block`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
          <p className="font-display font-bold text-3xl mt-1">{value}</p>
          <p className="font-body text-xs mt-1 opacity-60">{sub}</p>
        </div>
        <div className="opacity-40 mt-0.5">{icon}</div>
      </div>
    </Link>
  )
}

function FinCard({ label, value, color }) {
  return (
    <div className="card p-4">
      <p className="font-display text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-display font-bold text-xl ${color}`}>{value}</p>
    </div>
  )
}

function projetsSubLabel(parType) {
  if (!parType?.length) return 'Aucun projet actif'
  const TYPE_FR = { btp: 'BTP', agriculture: 'Agriculture', location: 'Location', espaces_verts: 'Espaces verts', autre: 'Autre' }
  return parType.slice(0, 2).map(({ type_projet, nb }) => `${nb} ${TYPE_FR[type_projet] ?? type_projet}`).join(' · ')
}

function IconEmployes() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconProjets() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
      <path d="M2 20h20M5 20V8l7-5 7 5v12" /><path d="M9 20v-5h6v5" />
    </svg>
  )
}

function IconClients() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconAlertes() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
