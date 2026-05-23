import { useEffect, useRef, useState } from 'react'
import api from '../../services/api'
import ModuleTabs, { REPORTING_TABS } from '../../components/ui/ModuleTabs'
import { SkeletonPage } from '../../components/ui/Skeleton'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })

const GRAIN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .12 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E"

/** Grade lettre + verdict qualitatif depuis un score 0-100 */
function getVerdict(score) {
  if (score >= 90) return { lettre: 'A+', label: 'Excellence',       tone: 'forest' }
  if (score >= 80) return { lettre: 'A',  label: 'Engagement solide', tone: 'forest' }
  if (score >= 70) return { lettre: 'B+', label: 'Solide',            tone: 'forest' }
  if (score >= 60) return { lettre: 'B',  label: 'Engagé',            tone: 'gold' }
  if (score >= 50) return { lettre: 'C+', label: 'Sur la voie',       tone: 'gold' }
  if (score >= 40) return { lettre: 'C',  label: 'À renforcer',       tone: 'gold' }
  return                  { lettre: 'D',  label: 'Action urgente',    tone: 'red' }
}

const TONE_TXT = { forest: 'text-forest-500', gold: 'text-gold-500', red: 'text-red-500' }

function useCountUp(target, duration = 1100) {
  const [v, setV] = useState(0)
  const ref = useRef(target)
  useEffect(() => {
    ref.current = target
    const start = performance.now()
    let raf
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setV(Math.round(ref.current * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return v
}

/* ─────────────────────────────────────────────────────────── */

export default function BilanCarboneEsg() {
  const [co2, setCo2] = useState(null)
  const [esg, setEsg] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reporting/bilan-carbone/'),
      api.get('/reporting/esg/'),
    ])
      .then(([{ data: c }, { data: e }]) => { setCo2(c); setEsg(e) })
      .catch(() => setError('Impossible de charger les données ESG.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-[14px]">
        <div className="card overflow-hidden"><ModuleTabs items={REPORTING_TABS} /></div>
        <SkeletonPage />
      </div>
    )
  }

  if (error || !co2 || !esg) {
    return (
      <div className="space-y-[14px]">
        <div className="card overflow-hidden"><ModuleTabs items={REPORTING_TABS} /></div>
        <p className="alert-red">{error || 'Données indisponibles.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-[14px]">
      <div className="card overflow-hidden"><ModuleTabs items={REPORTING_TABS} /></div>

      <HeroVerdict esg={esg} />
      <CarbonBalance co2={co2} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px]">
        <AxeCard axe="E" titre="Environnement" tone="forest"
                 score={esg.environnement.score}
                 metriques={[
                   { label: 'Valorisation déchets',   value: esg.environnement.taux_valorisation_dechets, suffix: '%' },
                   { label: 'CO₂ équilibre',          value: esg.environnement.ratio_co2_sequestre_pct, suffix: '%' },
                 ]}
                 footer={`${fmt(esg.environnement.co2_sequestre_kg)} kg séquestrés / ${fmt(esg.environnement.co2_emis_kg)} kg émis`} />
        <AxeCard axe="S" titre="Social" tone="gold"
                 score={esg.social.score}
                 metriques={[
                   { label: 'CDI permanents',   value: esg.social.pct_cdi, suffix: '%' },
                   { label: 'Certifs valides',  value: esg.social.pct_certifs_valides, suffix: '%' },
                 ]}
                 footer={`${esg.social.nb_employes} employé${esg.social.nb_employes > 1 ? 's' : ''} actif${esg.social.nb_employes > 1 ? 's' : ''}`} />
        <AxeCard axe="G" titre="Gouvernance" tone="blue"
                 score={esg.gouvernance.score}
                 metriques={[
                   { label: 'Factures FNE',     value: esg.gouvernance.pct_factures_fne, suffix: '%' },
                   { label: 'Paiement à temps', value: esg.gouvernance.pct_factures_a_temps, suffix: '%' },
                 ]}
                 footer={`${esg.gouvernance.nb_factures_retard} retard / ${esg.gouvernance.nb_factures_total} factures`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
        <BreakdownCard
          titre="Séquestration par espèce"
          subtitle="Capture CO₂ annuelle estimée — ADEME 20 kg/plant/an"
          items={co2.par_espece}
          keyField="espece"
          rows={[
            { label: 'Plants', accessor: (r) => fmt(r.plants), className: 'num text-sand-700' },
            { label: 'CO₂/an', accessor: (r) => fmt(r.co2_kg), suffix: 'kg', className: 'num text-forest-700 font-semibold' },
          ]}
          barField="co2_kg"
          barColor="#1f8f53"
          empty="Aucun lot biologique"
        />
        <BreakdownCard
          titre="Émissions par type d'engin"
          subtitle="Diesel 2,64 kg CO₂/L · consommation moyenne par type"
          items={co2.par_type_engin}
          keyField="type"
          rows={[
            { label: 'Nb',     accessor: (r) => r.nb,           className: 'num text-sand-700' },
            { label: 'Heures', accessor: (r) => fmt(r.heures),  className: 'num text-sand-700' },
            { label: 'CO₂',   accessor: (r) => fmt(r.co2_kg),  suffix: 'kg', className: 'num text-red-600 font-semibold' },
          ]}
          barField="co2_kg"
          barColor="#c4452f"
          empty="Aucun engin enregistré"
        />
      </div>

      <Engagements />
    </div>
  )
}

/* ─────────── Hero verdict ─────────── */

function HeroVerdict({ esg }) {
  const score = Math.round(esg.score_global ?? 0)
  const animScore = useCountUp(score, 1100)
  const verdict = getVerdict(score)
  const year = new Date().getFullYear()

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-forest-950 text-sand-100 hero-verdict"
      style={{ backgroundImage: `url("${GRAIN_URI}")` }}
    >
      {/* Topo subtle */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.09] pointer-events-none"
           viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i}
            d={`M -50 ${50 + i * 42} Q 220 ${20 + i * 32}, 420 ${65 + i * 44} T 870 ${50 + i * 42}`}
            fill="none" stroke="white" strokeWidth="1" />
        ))}
      </svg>

      <div className="relative grid grid-cols-12 gap-6 p-7 lg:p-9 items-center">
        {/* Étiquette + verdict */}
        <div className="col-span-12 lg:col-span-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-400">
            <span className="text-gold-500">●</span> Bilan ESG · Cycle {year}
          </p>
          <h1 className="font-display font-bold text-white text-[24px] mt-3 leading-tight">
            Mesure consolidée
          </h1>
          <p className="font-body text-[12.5px] text-sand-100/65 mt-2 max-w-xs leading-relaxed">
            Performance annuelle agrégée sur les axes
            environnement, social et gouvernance.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 bg-white/8 border border-white/10 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${verdict.tone === 'forest' ? 'bg-forest-400' : verdict.tone === 'gold' ? 'bg-gold-400' : 'bg-red-400'}`} />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sand-100">
              {verdict.label}
            </span>
          </div>
        </div>

        {/* Score géant */}
        <div className="col-span-12 lg:col-span-5 flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-3">
            <span className={`font-display font-extrabold text-[96px] lg:text-[120px] leading-none tracking-[-0.04em] ${TONE_TXT[verdict.tone]}`}>
              {animScore}
            </span>
            <span className="font-display font-bold text-sand-100/35 text-[28px] lg:text-[34px]">
              /100
            </span>
          </div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-sand-100/55 mt-2">
            Score global
          </p>
        </div>

        {/* Sticker certifié */}
        <div className="col-span-12 lg:col-span-3 flex justify-center lg:justify-end">
          <CertificateStamp lettre={verdict.lettre} tone={verdict.tone} />
        </div>
      </div>

      <style>{`
        @keyframes heroIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .hero-verdict { animation: heroIn .55s cubic-bezier(.2,.7,.2,1); }
      `}</style>
    </div>
  )
}

function CertificateStamp({ lettre, tone }) {
  const color = tone === 'forest' ? '#3ba973' : tone === 'gold' ? '#c89a1d' : '#c4452f'
  return (
    <div className="relative w-[150px] h-[150px] stamp-anim">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <path id="stamp-arc-esg" d="M 100,100 m -76,0 a 76,76 0 1,1 152,0 a 76,76 0 1,1 -152,0" />
        </defs>
        <circle cx="100" cy="100" r="92" fill="none" stroke={color} strokeWidth="1"   opacity="0.4" />
        <circle cx="100" cy="100" r="78" fill="none" stroke={color} strokeWidth="1.5" opacity="0.55" />
        <text fill={color} fontFamily="ui-monospace, monospace" fontSize="9.5" fontWeight="600" opacity="0.7" letterSpacing="3">
          <textPath href="#stamp-arc-esg" startOffset="0">
            CERTIFIÉ EKO · ESG · CÔTE D IVOIRE ·
          </textPath>
        </text>
        <g transform="translate(100 100)" opacity="0.92">
          <text fill={color} fontFamily="Sora, sans-serif" fontSize="56" fontWeight="800"
                textAnchor="middle" dominantBaseline="middle" dy="4">
            {lettre}
          </text>
        </g>
      </svg>
      <style>{`
        @keyframes stampIn {
          from { opacity: 0; transform: rotate(-22deg) scale(.55); }
          to   { opacity: 1; transform: rotate(-7deg)  scale(1); }
        }
        .stamp-anim { opacity: 0; transform: rotate(-7deg); animation: stampIn .6s cubic-bezier(.34,1.56,.64,1) .7s forwards; }
      `}</style>
    </div>
  )
}

/* ─────────── Balance carbone (divergent bar) ─────────── */

function CarbonBalance({ co2 }) {
  const seq = Number(co2.co2_sequestre_kg ?? 0)
  const emis = Number(co2.co2_emis_kg ?? 0)
  const max = Math.max(seq, emis, 1)
  const seqPct = (seq / max) * 100
  const emisPct = (emis / max) * 100
  const solde = seq - emis
  const animSolde = useCountUp(Math.abs(solde), 900)
  const tone = solde >= 0 ? 'forest' : 'red'

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="th-title">Balance carbone</p>
          <p className="text-[11px] text-sand-500 mt-0.5">Cycle annualisé — pépinière vs parc d'engins</p>
        </div>
        <div className="text-right">
          <p className={`font-display font-extrabold text-[26px] leading-none tracking-tight ${solde >= 0 ? 'text-forest-700' : 'text-red-600'}`}>
            {solde >= 0 ? '+' : '−'}{fmt(animSolde)}
            <span className="text-[11px] font-medium text-sand-500 ml-1.5">kg CO₂</span>
          </p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-500 mt-0.5">
            {solde >= 0 ? 'Solde positif' : 'À compenser'}
          </p>
        </div>
      </div>

      {/* Barre divergente */}
      <div className="relative h-12 mt-2">
        {/* axe central */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-sand-300 -translate-x-1/2 z-10" />
        <div className="grid grid-cols-2 h-full gap-0">
          {/* Gauche : séquestré (croît vers la gauche) */}
          <div className="relative flex items-center justify-end pr-1">
            <div
              className="h-8 rounded-l-md transition-all duration-[900ms] ease-out"
              style={{ width: `${seqPct}%`, background: 'linear-gradient(90deg, transparent, #1f8f53)' }}
            />
          </div>
          {/* Droite : émis (croît vers la droite) */}
          <div className="relative flex items-center justify-start pl-1">
            <div
              className="h-8 rounded-r-md transition-all duration-[900ms] ease-out"
              style={{ width: `${emisPct}%`, background: 'linear-gradient(90deg, #c4452f, transparent)' }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 mt-3 text-[11px]">
        <div>
          <p className="font-mono uppercase tracking-[0.1em] text-sand-500 mb-1">← Séquestré</p>
          <p className="font-display font-semibold text-forest-700 text-[15px]">
            {fmt(seq)} <span className="text-[10px] text-sand-500">kg</span>
          </p>
          <p className="text-sand-500 text-[10.5px] mt-0.5">
            {co2.nb_lots} lot{co2.nb_lots > 1 ? 's' : ''} biologique{co2.nb_lots > 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono uppercase tracking-[0.1em] text-sand-500 mb-1">Émis →</p>
          <p className="font-display font-semibold text-red-600 text-[15px]">
            {fmt(emis)} <span className="text-[10px] text-sand-500">kg</span>
          </p>
          <p className="text-sand-500 text-[10.5px] mt-0.5">
            {co2.nb_engins} engin{co2.nb_engins > 1 ? 's' : ''} parc
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─────────── Cartes axes ESG (avec cercle progress) ─────────── */

function AxeCard({ axe, titre, tone, score, metriques, footer }) {
  const animScore = useCountUp(Math.round(score), 900)
  const colors = {
    forest: { letter: 'text-forest-500', ring: '#1f8f53', bg: 'bg-forest-50/40', border: 'border-forest-200' },
    gold:   { letter: 'text-gold-500',   ring: '#c89a1d', bg: 'bg-gold-50/40',   border: 'border-gold-200' },
    blue:   { letter: 'text-blue-500',   ring: '#2563eb', bg: 'bg-blue-50/40',   border: 'border-blue-200' },
  }
  const c = colors[tone]
  const R = 56
  const C = 2 * Math.PI * R
  const offset = C * (1 - animScore / 100)

  return (
    <div className={`card p-5 ${c.bg}`}>
      <div className="flex items-start gap-5">
        {/* Cercle progress */}
        <div className="relative w-[130px] h-[130px] shrink-0">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#e5e1d6" strokeWidth="8" />
            <circle
              cx="70" cy="70" r={R} fill="none" stroke={c.ring} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.4,.1,.2,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display font-extrabold text-[36px] leading-none ${c.letter}`}>
              {axe}
            </span>
            <span className="font-display font-bold text-[18px] text-ink mt-1">
              {animScore}
            </span>
          </div>
        </div>

        {/* Titre + métriques */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-ink text-[15px]">{titre}</p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-500 mt-0.5">
            Sur 100 points
          </p>

          <div className="mt-4 space-y-3">
            {metriques.map((m, i) => (
              <MetricBar key={i} {...m} color={c.ring} />
            ))}
          </div>
        </div>
      </div>

      {footer && (
        <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-sand-500 mt-5 pt-3 border-t border-sand-200/60">
          {footer}
        </p>
      )}
    </div>
  )
}

function MetricBar({ label, value, suffix, color }) {
  const animVal = useCountUp(Math.round(value), 900)
  return (
    <div>
      <div className="flex justify-between items-baseline text-[11.5px] mb-1">
        <span className="text-sand-600">{label}</span>
        <span className="font-display font-semibold text-ink">
          {animVal}<span className="text-sand-500 text-[10px] ml-0.5">{suffix}</span>
        </span>
      </div>
      <div className="h-1 bg-sand-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-[900ms] ease-out"
          style={{ width: `${Math.min(100, value)}%`, background: color }}
        />
      </div>
    </div>
  )
}

/* ─────────── Tables avec barres horizontales ─────────── */

function BreakdownCard({ titre, subtitle, items, keyField, rows, barField, barColor, empty }) {
  const max = Math.max(1, ...items.map((it) => Number(it[barField])))
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-sand-100">
        <p className="font-display font-semibold text-ink text-[14px]">{titre}</p>
        <p className="font-body text-[11px] text-sand-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="px-5 py-4">
        {items.length === 0 ? (
          <p className="text-sand-500 text-[12px] text-center py-6">{empty}</p>
        ) : (
          <div className="space-y-4">
            {items.map((it) => {
              const w = (Number(it[barField]) / max) * 100
              return (
                <div key={it[keyField]}>
                  <div className="flex items-baseline justify-between text-[12px] mb-1">
                    <span className="font-display font-medium text-ink capitalize">
                      {it[keyField]}
                    </span>
                    <div className="flex gap-3">
                      {rows.map((r, i) => (
                        <span key={i} className={r.className}>
                          {r.accessor(it)}
                          {r.suffix && <span className="text-[9.5px] text-sand-500 ml-0.5 font-normal">{r.suffix}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="h-1.5 bg-sand-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-[900ms] ease-out"
                      style={{ width: `${w}%`, background: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────── Engagements (footer band) ─────────── */

function Engagements() {
  const items = [
    { titre: 'Réduire les émissions',  cible: '-15% d\'ici 2027',     icon: '◆' },
    { titre: 'Valoriser les déchets',  cible: '80% du flux BTP',      icon: '◆' },
    { titre: 'Stabiliser les contrats', cible: '70% de CDI en 2026',   icon: '◆' },
    { titre: 'Conformité FNE',          cible: '100% factures cert.',  icon: '◆' },
  ]
  return (
    <div className="card overflow-hidden border-gold-200 bg-gold-50/30">
      <div className="px-5 py-3 border-b border-gold-200/60 bg-gold-100/40">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold-700 font-semibold">
          Engagements · Cycle en cours
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gold-200/40">
        {items.map((it) => (
          <div key={it.titre} className="px-5 py-4">
            <p className="font-display font-semibold text-ink text-[12.5px] flex items-center gap-1.5">
              <span className="text-gold-500">{it.icon}</span>
              {it.titre}
            </p>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-gold-700 mt-1.5">
              {it.cible}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
