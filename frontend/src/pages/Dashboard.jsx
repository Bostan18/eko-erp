import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { fmt, MOIS_FR } from '../utils/format'
import { SkeletonPage } from '../components/ui/Skeleton'

/* ─────────── Constantes & helpers ─────────── */

const MOIS_COURT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const TYPE_FR = {
  btp: 'BTP', agriculture: 'Agriculture', pepiniere: 'Pépinière',
  location: 'Location', espaces_verts: 'Espaces verts', autre: 'Autre',
}
const PF_TONES = ['pf-g', 'pf-gold', 'pf-r', 'bg-blue-500', 'bg-forest-400']
const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long',
})

function getSaison(month) {
  if (month >= 3 && month <= 6)  return 'Saison des pluies · cycle 1'
  if (month >= 7 && month <= 8)  return 'Saison sèche · intersaison'
  if (month >= 9 && month <= 10) return 'Saison des pluies · cycle 2'
  return 'Saison sèche · Harmattan'
}

const GRAIN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .12 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E"

/** Anime un nombre de 0 à `target` en ms, ease-out cubic. */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  const ref = useRef(target)
  useEffect(() => {
    if (target == null) return
    ref.current = target
    const start = performance.now()
    let raf
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(ref.current * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function relativeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)    return 'à l\'instant'
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function labelMois(iso) {
  if (!iso) return ''
  const [y, m] = iso.split('-').map(Number)
  return `${MOIS_COURT[m - 1]} ${String(y).slice(2)}`
}

/* ─────────── Page ─────────── */

export default function Dashboard() {
  const [kpis,    setKpis]    = useState(null)
  const [esg,     setEsg]     = useState(null)
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/reporting/kpis/'),
      api.get('/reporting/esg/'),
      api.get('/reporting/activite_recente/'),
    ]).then(([k, e, ev]) => {
      if (k.status  === 'fulfilled') setKpis(k.value.data)
      if (e.status  === 'fulfilled') setEsg(e.value.data)
      if (ev.status === 'fulfilled') setEvents(ev.value.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonPage />

  const now = new Date()
  const dateStr = DATE_FMT.format(now)
  const saison  = getSaison(now.getMonth())
  const mois    = kpis ? `${MOIS_FR[kpis.finance.mois]} ${kpis.finance.annee}` : '…'
  const ca      = kpis?.finance?.ca_facture ?? 0
  const serie   = kpis?.finance?.serie_mensuelle ?? []

  // Évolution CA vs mois précédent
  let evolPct = 0
  if (serie.length >= 2) {
    const cur  = Number(serie[serie.length - 1].ca_facture)
    const prev = Number(serie[serie.length - 2].ca_facture)
    if (prev > 0) evolPct = ((cur - prev) / prev) * 100
  }

  return (
    <div className="space-y-[14px]">
      <HeroBand date={dateStr} saison={saison} ca={ca} evolPct={evolPct} mois={mois} />
      <AlertsStrip kpis={kpis} />

      <div className="grid grid-cols-12 gap-[14px]">
        <PulseFinance kpis={kpis} className="col-span-12 lg:col-span-8" />
        <ActiviteToday kpis={kpis} className="col-span-12 lg:col-span-4" />

        <ProjetsActifs kpis={kpis} className="col-span-12 md:col-span-6 lg:col-span-4" />
        <CentresStrip kpis={kpis} className="col-span-12 md:col-span-6 lg:col-span-4" />
        <TerrainCard className="col-span-12 lg:col-span-4" />
      </div>

      <FeedEquipe events={events} />
      <EsgBand esg={esg} />
    </div>
  )
}

/* ─────────── Hero band ─────────── */

function HeroBand({ date, saison, ca, evolPct, mois }) {
  const animCa = useCountUp(ca, 900)
  return (
    <div
      className="relative rounded-xl overflow-hidden bg-forest-950 text-sand-100 hero-band"
      style={{ backgroundImage: `url("${GRAIN_URI}")` }}
    >
      {/* Topo subtle (statique) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.09] pointer-events-none"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M -50 ${40 + i * 38} Q 220 ${15 + i * 30}, 420 ${55 + i * 40} T 870 ${40 + i * 38}`}
            fill="none"
            stroke="white"
            strokeWidth="1"
          />
        ))}
      </svg>

      <div className="relative grid grid-cols-12 gap-6 p-7">
        {/* Éphéméride */}
        <div className="col-span-12 md:col-span-3 flex flex-col justify-between gap-3">
          <div>
            <p className="font-display font-semibold text-[14px] capitalize text-sand-100">{date}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gold-400">
              <span className="text-gold-500">●</span> {saison}
            </p>
          </div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-sand-100/40 hidden md:block">
            Cockpit · Brigade EKO
          </p>
        </div>

        {/* CA héro */}
        <div className="col-span-12 md:col-span-5 flex flex-col items-start md:items-center justify-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sand-100/60 mb-1.5">
            CA facturé · {mois}
          </p>
          <h1 className="font-display font-extrabold text-white text-[44px] md:text-[52px] lg:text-[60px] leading-[0.95] tracking-[-0.025em]">
            {fmt(animCa)}{' '}
            <span className="text-sand-100/40 text-[24px] md:text-[28px] font-bold">F</span>
          </h1>
          {evolPct !== 0 && (
            <p className={`mt-2 font-mono text-[11px] ${evolPct >= 0 ? 'text-forest-300' : 'text-red-300'}`}>
              {evolPct >= 0 ? '↗' : '↘'} {Math.abs(evolPct).toFixed(1)}% vs mois précédent
            </p>
          )}
        </div>

        {/* Actions rapides */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-2 md:items-end md:justify-center">
          <Link to="/rh/pointage" className="hero-btn hero-btn-gold">
            <IconClock /> Pointer la journée
          </Link>
          <Link to="/comptabilite/factures" className="hero-btn">
            <IconPlus /> Nouvelle facture
          </Link>
          <Link to="/operations/sites" className="hero-btn">
            <IconClipboard /> Saisir log terrain
          </Link>
        </div>
      </div>

      <style>{`
        .hero-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 8px;
          font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 500;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          color: rgb(243,241,235);
          transition: all .15s ease;
          min-width: 200px; justify-content: flex-start;
        }
        .hero-btn:hover { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.18); }
        .hero-btn-gold {
          background: #c89a1d; border-color: #c89a1d; color: #0f2b1c;
        }
        .hero-btn-gold:hover { background: #d4a634; border-color: #d4a634; }
        .hero-btn svg { width: 14px; height: 14px; }
        @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .hero-band { animation: heroIn .5s cubic-bezier(.2,.7,.2,1); }
      `}</style>
    </div>
  )
}

/* ─────────── Alerts strip ─────────── */

function AlertsStrip({ kpis }) {
  const alerts = []
  const retard = kpis?.finance?.factures_en_retard ?? 0
  const stock  = kpis?.stocks?.alertes ?? 0
  const projetsAlertes = kpis?.projets?.alertes ?? 0

  if (retard > 0) alerts.push({
    dot: 'bg-red-500',
    bg: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    label: `${retard} facture${retard > 1 ? 's' : ''} en retard`,
    to: '/comptabilite/factures',
  })
  if (stock > 0) alerts.push({
    dot: 'bg-gold-500',
    bg: 'bg-gold-50 border-gold-200 text-gold-700 hover:bg-gold-100',
    label: `${stock} article${stock > 1 ? 's' : ''} sous seuil`,
    to: '/stocks',
  })
  if (projetsAlertes > 0) alerts.push({
    dot: 'bg-gold-500',
    bg: 'bg-gold-50 border-gold-200 text-gold-700 hover:bg-gold-100',
    label: `${projetsAlertes} projet${projetsAlertes > 1 ? 's' : ''} à surveiller`,
    to: '/projets',
  })

  if (alerts.length === 0) {
    return (
      <div className="card px-4 py-2.5 flex items-center gap-2 text-[12px] text-sand-600">
        <span className="w-1.5 h-1.5 rounded-full bg-forest-500" />
        Aucune alerte opérationnelle — la brigade est sereine.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1">
      {alerts.map((a, i) => (
        <Link
          key={i}
          to={a.to}
          className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-display transition-colors ${a.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
          <span className="font-medium">{a.label}</span>
          <span className="text-[10px] opacity-60">→</span>
        </Link>
      ))}
    </div>
  )
}

/* ─────────── Pulse Finance ─────────── */

function PulseFinance({ kpis, className }) {
  const serie = kpis?.finance?.serie_mensuelle ?? []
  return (
    <div className={`card ${className}`}>
      <div className="th-row">
        <div>
          <p className="th-title">Pulse Finance</p>
          <p className="text-[11px] text-sand-500 mt-0.5">Cycle mensuel · 12 derniers mois</p>
        </div>
        <Link to="/comptabilite/factures" className="text-[12px] font-display font-medium text-forest-700 hover:underline">
          Détail →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-sand-100">
        <FinCell label="Facturé"  value={kpis?.finance?.ca_facture}   />
        <FinCell label="Encaissé" value={kpis?.finance?.ca_encaisse}  tone="green" />
        <FinCell label="Charges"  value={kpis?.finance?.charges_mois} tone="red" />
        <FinCell label="Marge"    value={kpis?.finance?.marge_mois}
                 tone={(kpis?.finance?.marge_mois ?? 0) >= 0 ? 'green' : 'red'} />
      </div>
      <div className="px-[18px] pt-4 pb-3 border-t border-sand-100">
        <Sparkline data={serie} />
      </div>
    </div>
  )
}

function FinCell({ label, value, tone }) {
  const v = Number(value) || 0
  const animVal = useCountUp(v, 900)
  const tones = { green: 'text-forest-700', red: 'text-red-600' }
  return (
    <div className="px-5 py-4">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-sand-500 font-medium">{label}</p>
      <p className={`font-display font-bold text-[18px] mt-1.5 leading-none tracking-tight ${tones[tone] ?? 'text-ink'}`}>
        {fmt(animVal)} <span className="text-[10px] font-normal text-sand-500">F</span>
      </p>
    </div>
  )
}

function Sparkline({ data }) {
  if (data.length === 0) {
    return <div className="h-[80px] flex items-center justify-center text-sand-500 text-[12px]">Pas de données</div>
  }
  const W = 600, H = 70
  const maxCa = Math.max(1, ...data.map((s) => Number(s.ca_facture)))
  const step = data.length > 1 ? W / (data.length - 1) : W
  const points = data.map((s, i) => `${i * step},${H - (Number(s.ca_facture) / maxCa) * (H - 4) - 2}`).join(' ')
  const fillPath = `M 0,${H} L ${points.replace(/,/g, ',').replace(/ /g, ' L ')} L ${W},${H} Z`
  const lastIdx = data.length - 1
  const lastY = H - (Number(data[lastIdx].ca_facture) / maxCa) * (H - 4) - 2

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[80px]">
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1f8f53" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1f8f53" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#spark-grad)" />
        <polyline points={points} fill="none" stroke="#1f8f53" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
        <circle cx={lastIdx * step} cy={lastY} r="3.5" fill="#1f8f53" />
        <circle cx={lastIdx * step} cy={lastY} r="6"   fill="#1f8f53" opacity="0.2" />
      </svg>
      <div className="flex justify-between text-[10px] text-sand-500 mt-1">
        <span>{labelMois(data[0]?.mois)}</span>
        <span>{labelMois(data[lastIdx]?.mois)}</span>
      </div>
    </div>
  )
}

/* ─────────── Activité aujourd'hui ─────────── */

function ActiviteToday({ kpis, className }) {
  const presences = kpis?.rh?.presences_aujourd_hui ?? 0
  const employes  = kpis?.rh?.employes_actifs ?? 0
  const pct = employes > 0 ? Math.round((presences / employes) * 100) : 0
  return (
    <div className={`card flex flex-col ${className}`}>
      <div className="th-row">
        <p className="th-title">Aujourd'hui</p>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-forest-600 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse-dot" />
          Live
        </span>
      </div>
      <div className="px-[18px] py-5 flex-1 flex flex-col gap-5">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-sand-500 font-medium">Présences</p>
          <p className="font-display font-bold text-[28px] leading-none text-ink mt-1.5">
            {presences} <span className="text-[14px] text-sand-500 font-medium">/ {employes}</span>
          </p>
          <div className="progress mt-3">
            <div className="progress-fill pf-g transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10.5px] text-sand-500 mt-1.5">{pct}% de l'effectif présent</p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-sand-100">
          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-sand-500">Projets ouv.</p>
            <p className="font-display font-bold text-[18px] text-ink mt-1">{kpis?.projets?.en_cours ?? 0}</p>
          </div>
          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-sand-500">Clients</p>
            <p className="font-display font-bold text-[18px] text-ink mt-1">{kpis?.crm?.clients_total ?? 0}</p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
        .animate-pulse-dot { animation: pulseDot 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

/* ─────────── Projets actifs ─────────── */

function ProjetsActifs({ kpis, className }) {
  const parType = kpis?.projets?.par_type ?? []
  const total = parType.reduce((s, p) => s + Number(p.nb), 0)
  return (
    <div className={`card ${className}`}>
      <div className="th-row">
        <p className="th-title">Projets actifs</p>
        <Link to="/projets" className="text-[11px] font-display font-medium text-forest-700 hover:underline">→</Link>
      </div>
      <div className="px-[18px] py-4">
        {total === 0 ? (
          <p className="text-sand-500 text-[12px] py-6 text-center">Aucun projet actif</p>
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
                  <div className={`progress-fill ${PF_TONES[i % PF_TONES.length]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ─────────── CA par centre (mini stacked) ─────────── */

function CentresStrip({ kpis, className }) {
  const centres = kpis?.finance?.ca_par_centre ?? []
  const filtered = centres.filter((c) => Number(c.ca) > 0)
  const total = filtered.reduce((s, c) => s + Number(c.ca || 0), 0)
  return (
    <div className={`card ${className}`}>
      <div className="th-row">
        <p className="th-title">CA par centre</p>
        <span className="text-[10.5px] text-sand-500 font-mono uppercase tracking-wider">12 mois</span>
      </div>
      <div className="px-[18px] py-4">
        {total === 0 ? (
          <p className="text-sand-500 text-[12px] py-6 text-center">Aucun CA ventilé</p>
        ) : (
          <>
            <div className="flex h-2 rounded-sm overflow-hidden bg-sand-200 mb-3">
              {filtered.map((c) => {
                const pct = (Number(c.ca) / total) * 100
                return <div key={c.code || c.nom} style={{ width: `${pct}%`, background: c.couleur }} />
              })}
            </div>
            <div className="space-y-1.5">
              {filtered.map((c) => {
                const pct = Math.round((Number(c.ca) / total) * 100)
                return (
                  <div key={c.code || c.nom} className="flex items-center justify-between text-[11.5px]">
                    <span className="flex items-center gap-1.5 text-ink">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.couleur }} />
                      {c.nom}
                    </span>
                    <span className="text-sand-500 font-mono">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─────────── Terrain (météo placeholder) ─────────── */

function TerrainCard({ className }) {
  return (
    <div className={`card ${className}`}>
      <div className="th-row">
        <p className="th-title">Terrain</p>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-500">Abidjan</span>
      </div>
      <div className="px-[18px] py-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-forest-50 flex items-center justify-center text-forest-600 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7">
            <path d="M20 16a4 4 0 0 0-4-4 6 6 0 0 0-12 1 4 4 0 0 0 .3 8h11.7a4 4 0 0 0 4-4z" />
            <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-[24px] leading-none text-ink">
            29°<span className="text-sand-400 text-[16px] font-medium">C</span>
          </p>
          <p className="text-[11px] text-sand-500 mt-1">Pluies éparses · humidité 78%</p>
        </div>
      </div>
      <div className="px-[18px] pb-4">
        <div className="alert-gold text-[11px]">
          <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
          Saison des pluies — prévoir bâches sur sites BTP
        </div>
      </div>
    </div>
  )
}

/* ─────────── Feed équipe ─────────── */

const TONE_DOT = {
  good: 'bg-forest-500',
  bad:  'bg-red-500',
  info: 'bg-gold-500',
}

function FeedEquipe({ events }) {
  return (
    <div className="card overflow-hidden">
      <div className="th-row">
        <div>
          <p className="th-title">Activité récente</p>
          <p className="text-[11px] text-sand-500 mt-0.5">Derniers événements ERP — toutes brigades</p>
        </div>
        <Link to="/comptabilite/factures" className="text-[12px] font-display font-medium text-forest-700 hover:underline">
          Tout l'historique →
        </Link>
      </div>
      <div className="divide-y divide-sand-100">
        {events.length === 0 ? (
          <div className="px-5 py-10 text-center text-sand-500 text-[12px]">
            Aucun événement récent enregistré.
          </div>
        ) : (
          events.map((e) => (
            <Link
              key={e.id}
              to={e.url ?? '#'}
              className="px-5 py-3 flex items-center gap-3 hover:bg-sand-50 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${TONE_DOT[e.tone] ?? 'bg-sand-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-ink truncate">
                  <span className="font-display font-semibold">{e.label}</span>
                  {e.meta && (
                    <>
                      {' · '}
                      <span className="font-mono text-sand-700">{e.meta}</span>
                    </>
                  )}
                </p>
                <p className="text-[10.5px] text-sand-500 mt-0.5 flex items-center gap-2">
                  <span>{e.status}</span>
                  <span className="text-sand-300">·</span>
                  <span>{relativeTime(e.date)}</span>
                </p>
              </div>
              <div className="text-sand-400 text-[12px] shrink-0">→</div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

/* ─────────── ESG band ─────────── */

function EsgBand({ esg }) {
  if (!esg) return null
  const E = esg.environnement?.score ?? 0
  const S = esg.social?.score ?? 0
  const G = esg.gouvernance?.score ?? 0
  const global = esg.score_global ?? 0
  return (
    <Link to="/reporting/esg" className="card block hover:shadow-card transition-shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-sand-100">
        <div className="px-5 py-4 flex flex-col justify-center">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-500">Score ESG global</p>
          <p className="font-display font-extrabold text-[34px] text-ink leading-none mt-1.5 tracking-tight">
            {Math.round(global)}<span className="text-sand-400 text-[16px] font-bold">/100</span>
          </p>
          <p className="text-[10.5px] text-forest-700 mt-1.5 font-display font-medium">Voir le détail →</p>
        </div>
        <EsgCell letter="E" label="Environnement" score={E} tone="forest" />
        <EsgCell letter="S" label="Social"        score={S} tone="gold" />
        <EsgCell letter="G" label="Gouvernance"   score={G} tone="blue" />
      </div>
    </Link>
  )
}

function EsgCell({ letter, label, score, tone }) {
  const colors = {
    forest: { letter: 'text-forest-500', bar: 'bg-forest-500' },
    gold:   { letter: 'text-gold-500',   bar: 'bg-gold-500' },
    blue:   { letter: 'text-blue-500',   bar: 'bg-blue-500' },
  }
  const c = colors[tone]
  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <div className={`font-display font-extrabold text-[32px] leading-none ${c.letter}`}>{letter}</div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-500">{label}</p>
        <p className="font-display font-bold text-[16px] text-ink mt-0.5">
          {Math.round(score)}<span className="text-sand-400 text-[10px] font-medium">/100</span>
        </p>
        <div className="progress mt-2">
          <div className={`progress-fill ${c.bar} transition-all duration-700`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  )
}

/* ─────────── Icons ─────────── */

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  )
}
function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}
function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 11h6M9 15h4" strokeLinecap="round" />
    </svg>
  )
}
