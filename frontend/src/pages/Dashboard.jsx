import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { StatusBadge } from '../components/ui/Badge'
import { FACTURE_STATUT_LABEL } from '../utils/constants'
import { fmt, MOIS_FR } from '../utils/format'

const MOIS_COURT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const TYPE_FR = { btp: 'BTP', agriculture: 'Agriculture', pepiniere: 'Pépinière', location: 'Location', espaces_verts: 'Espaces verts', autre: 'Autre' }
const PF_TONES = ['pf-g', 'pf-gold', 'pf-r', 'bg-blue-500', 'bg-forest-400']

export default function Dashboard() {
  const [kpis, setKpis]         = useState(null)
  const [factures, setFactures] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reporting/kpis/'),
      api.get('/comptabilite/factures/').catch(() => ({ data: [] })),
    ])
      .then(([{ data: k }, { data: f }]) => {
        setKpis(k)
        setFactures((f.results ?? f).slice(0, 5))
      })
      .finally(() => setLoading(false))
  }, [])

  const moisLabel = kpis ? `${MOIS_FR[kpis.finance.mois]} ${kpis.finance.annee}` : '…'

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Tableau de bord</div>
          <div className="sec-sub">
            {moisLabel} · Vue d'ensemble — Agriculture · BTP · Location · Espaces verts
          </div>
        </div>
        <Link to="/comptabilite/factures" className="btn-primary">
          <IconPlus className="w-3.5 h-3.5" /> Nouvelle facture
        </Link>
      </div>

      {/* ─── Alerte opérationnelle (compteurs réels) ─────── */}
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
      <div className="kpi-grid">
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

      {/* ─── Graphiques (gabarit maquette : two-col) ─────── */}
      <div className="two-col">
        <TendanceCard serie={kpis?.finance.serie_mensuelle ?? []} loading={loading} />
        <RepartitionCard parType={kpis?.projets.par_type ?? []} loading={loading} />
      </div>

      {/* ─── Dernières factures ──────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="th-row">
          <div className="th-title">Dernières factures ventes</div>
          <Link to="/comptabilite/factures" className="btn-secondary btn-sm">Voir tout →</Link>
        </div>
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : factures.length === 0 ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Aucune facture</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>{['Numéro', 'Client', 'TTC', 'Statut', 'Échéance'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {factures.map((f) => (
                <tr key={f.id}>
                  <td>
                    <Link to={`/comptabilite/factures/${f.id}`} className="mono-cell text-forest-700 hover:text-forest-900 font-medium">
                      {f.numero}
                    </Link>
                  </td>
                  <td className="font-display font-medium text-ink">{f.client_nom}</td>
                  <td className="num">{fmt(f.montant_ttc)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td><StatusBadge status={f.statut} label={FACTURE_STATUT_LABEL[f.statut] ?? f.statut} /></td>
                  <td className={f.statut === 'en_retard' ? 'text-red-700 font-semibold' : 'text-sand-600'}>{f.date_echeance || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

/* Tendance CA — barres sur 12 mois (série réelle) */
function TendanceCard({ serie, loading }) {
  const maxCa = Math.max(1, ...serie.map((s) => Number(s.ca_facture)))
  return (
    <div className="card">
      <div className="th-row"><div className="th-title">Tendance CA facturé · 12 mois</div></div>
      <div className="px-[18px] pt-5 pb-3">
        {loading ? (
          <div className="h-[110px] flex items-center justify-center text-sand-500 text-sm">Chargement…</div>
        ) : serie.length === 0 ? (
          <div className="h-[110px] flex items-center justify-center text-sand-500 text-sm">Pas de données</div>
        ) : (
          <>
            <div className="flex items-end gap-[5px] h-[110px]">
              {serie.map((s, i) => {
                const h = (Number(s.ca_facture) / maxCa) * 100
                const m = Number(s.mois.split('-')[1])
                return (
                  <div
                    key={s.mois}
                    title={`${MOIS_COURT[m - 1]} : ${fmt(s.ca_facture)} F`}
                    className={`flex-1 rounded-t-[3px] transition-all ${i === serie.length - 1 ? 'bg-forest-500' : 'bg-forest-100'}`}
                    style={{ height: `${Math.max(2, h)}%` }}
                  />
                )
              })}
            </div>
            <div className="flex justify-between text-[10.5px] text-sand-500 mt-2">
              <span>{labelMois(serie[0]?.mois)}</span>
              <span>{labelMois(serie[serie.length - 1]?.mois)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* Répartition des projets par type (réel) */
function RepartitionCard({ parType, loading }) {
  const total = parType.reduce((s, p) => s + Number(p.nb), 0)
  return (
    <div className="card">
      <div className="th-row"><div className="th-title">Projets actifs par type</div></div>
      <div className="px-[18px] py-4">
        {loading ? (
          <div className="h-[110px] flex items-center justify-center text-sand-500 text-sm">Chargement…</div>
        ) : total === 0 ? (
          <div className="h-[110px] flex items-center justify-center text-sand-500 text-sm">Aucun projet actif</div>
        ) : (
          parType.map((p, i) => {
            const pct = Math.round((Number(p.nb) / total) * 100)
            return (
              <div key={p.type_projet} className="mb-3 last:mb-0">
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-medium text-ink">{TYPE_FR[p.type_projet] ?? p.type_projet}</span>
                  <span className="text-sand-500">{p.nb} · {pct}%</span>
                </div>
                <div className="progress">
                  <div className={`progress-fill ${PF_TONES[i % PF_TONES.length]}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function projetsSubLabel(parType) {
  if (!parType?.length) return 'Aucun projet actif'
  return parType.slice(0, 2).map(({ type_projet, nb }) => `${nb} ${TYPE_FR[type_projet] ?? type_projet}`).join(' · ')
}

function labelMois(iso) {
  if (!iso) return ''
  const [y, m] = iso.split('-').map(Number)
  return `${MOIS_COURT[m - 1]} ${String(y).slice(2)}`
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
