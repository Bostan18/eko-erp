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
    <div className="space-y-6">
      {/* ─── Page head ───────────────────────────────────── */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="page-eyebrow mb-1.5">{moisLabel} · Période en cours</p>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-sub mt-1.5">
            Vue d'ensemble — EKO SARL · Agriculture · BTP · Location · Espaces verts
          </p>
        </div>
        <Link to="/comptabilite/factures" className="btn-primary">
          <IconPlus className="w-3.5 h-3.5" /> Nouvelle facture
        </Link>
      </div>

      {/* ─── Alerte FNE / docs (visible si compteurs > 0) ─── */}
      {!loading && (kpis?.finance.factures_en_retard > 0 || kpis?.stocks.alertes > 0) && (
        <div className="alert-gold">
          <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
          <strong className="font-display font-semibold">Alertes opérationnelles</strong>
          <span className="text-gold-600">
            ·{' '}
            {kpis?.finance.factures_en_retard > 0 &&
              `${kpis.finance.factures_en_retard} facture${kpis.finance.factures_en_retard > 1 ? 's' : ''} en retard · `}
            {kpis?.stocks.alertes > 0 &&
              `${kpis.stocks.alertes} article${kpis.stocks.alertes > 1 ? 's' : ''} sous seuil`}
          </span>
          <Link to="/comptabilite/factures" className="ml-auto text-gold-700 font-display font-medium hover:underline">
            Voir tout →
          </Link>
        </div>
      )}

      {/* ─── KPI grid ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          to="/rh"
          label="Employés actifs"
          value={loading ? '…' : kpis?.rh.employes_actifs}
          sub={loading ? '' : `${kpis?.rh.presences_aujourd_hui} présents aujourd'hui`}
          icon={<IconEmployes className="w-7 h-7" />}
        />
        <KpiCard
          to="/projets"
          label="Projets en cours"
          value={loading ? '…' : kpis?.projets.en_cours}
          sub={loading ? '' : projetsSubLabel(kpis?.projets.par_type)}
          icon={<IconProjets className="w-7 h-7" />}
        />
        <KpiCard
          to="/crm"
          label="Clients"
          value={loading ? '…' : kpis?.crm.clients_total}
          sub="Actifs & prospects"
          icon={<IconClients className="w-7 h-7" />}
        />
        <KpiCard
          to="/stocks"
          label="Alertes stock"
          value={loading ? '…' : kpis?.stocks.alertes}
          sub="Articles sous seuil"
          subTone={!loading && kpis?.stocks.alertes > 0 ? 'down' : 'muted'}
          icon={<IconAlertes className="w-7 h-7" />}
        />
      </div>

      {/* ─── Finance — bloc dédié ────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <div>
            <p className="card-title">Finance — {moisLabel}</p>
            <p className="text-[11px] text-sand-500 mt-0.5">CA · Encaissements · Charges · Marge</p>
          </div>
          <Link to="/comptabilite/factures" className="text-[12px] font-display font-medium text-forest-700 hover:underline">
            Détail →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-sand-100">
          <FinCell label="CA facturé"   value={loading ? '…' : `${fmt(kpis?.finance.ca_facture)} F`}  />
          <FinCell label="Encaissé"     value={loading ? '…' : `${fmt(kpis?.finance.ca_encaisse)} F`} tone="green" />
          <FinCell label="Charges"      value={loading ? '…' : `${fmt(kpis?.finance.charges_mois)} F`} tone="red" />
          <FinCell label="Marge nette"  value={loading ? '…' : `${fmt(kpis?.finance.marge_mois)} F`}
                   tone={!loading && kpis?.finance.marge_mois >= 0 ? 'green' : 'red'} />
        </div>
      </div>

      {/* ─── Accès rapide ────────────────────────────────── */}
      <div>
        <p className="page-eyebrow mb-3">Accès rapide</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'RH & Paie',    desc: 'Employés, pointage, salaires', path: '/rh' },
            { label: 'Projets',      desc: 'Chantiers BTP, plantations',   path: '/projets' },
            { label: 'CRM',          desc: 'Clients, prospects, devis',    path: '/crm' },
            { label: 'Stocks',       desc: 'Inventaire, alertes',          path: '/stocks' },
          ].map(({ label, desc, path }) => (
            <Link
              key={path}
              to={path}
              className="card p-5 hover:border-forest-300 hover:shadow-md transition-all group block"
            >
              <p className="font-display font-semibold text-ink text-sm group-hover:text-forest-700 transition-colors">
                {label}
              </p>
              <p className="font-body text-[12px] text-sand-500 mt-1">{desc}</p>
              <p className="font-mono text-[10px] text-sand-400 mt-3 group-hover:text-forest-500 transition-colors">
                {path} →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Cartes ─────────────────────────────────────────────── */

function KpiCard({ label, value, sub, subTone = 'muted', icon, to }) {
  const tones = { up: 'text-forest-600', down: 'text-red-600', muted: 'text-sand-500' }
  const Inner = (
    <>
      <div className="kpi-icon">{icon}</div>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      <p className={`kpi-sub ${tones[subTone]}`}>{sub}</p>
    </>
  )
  return to ? (
    <Link to={to} className="kpi hover:border-forest-300 hover:shadow-md transition-all block">
      {Inner}
    </Link>
  ) : (
    <div className="kpi">{Inner}</div>
  )
}

function FinCell({ label, value, tone }) {
  const tones = { green: 'text-forest-700', red: 'text-red-600' }
  return (
    <div className="p-5">
      <p className="kpi-label">{label}</p>
      <p className={`font-display font-bold text-xl mt-2 leading-none tracking-tight ${tones[tone] ?? 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}

function projetsSubLabel(parType) {
  if (!parType?.length) return 'Aucun projet actif'
  const TYPE_FR = { btp: 'BTP', agriculture: 'Agriculture', location: 'Location', espaces_verts: 'Espaces verts', autre: 'Autre' }
  return parType.slice(0, 2).map(({ type_projet, nb }) => `${nb} ${TYPE_FR[type_projet] ?? type_projet}`).join(' · ')
}

/* ─── Icons ──────────────────────────────────────────────── */

function IconPlus({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function IconEmployes({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconProjets({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M2 20h20M5 20V8l7-5 7 5v12" /><path d="M9 20v-5h6v5" />
    </svg>
  )
}
function IconClients({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconAlertes({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
