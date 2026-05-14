import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { fmt, MOIS_FR } from '../utils/format'
import { Icon } from '../components/icons'

const MOIS_COURT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const TYPE_PROJET_LABEL = { btp: 'BTP', agriculture: 'Agriculture', location: 'Location', espaces_verts: 'Espaces verts', autre: 'Autre' }
const TYPE_PROJET_COLOR = { btp: '#1a5c38', agriculture: '#388562', location: '#8dc3a9', espaces_verts: '#5aa382', autre: '#dceee4' }

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [activite, setActivite] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reporting/kpis/').then(({ data }) => setKpis(data)),
      api.get('/reporting/activite-recente/').then(({ data }) => setActivite(data)),
    ]).finally(() => setLoading(false))
  }, [])

  const moisLabel = kpis ? `${MOIS_FR[kpis.finance.mois]} ${kpis.finance.annee}` : '…'

  return (
    <div className="space-y-5">
      <p className="font-body font-medium text-[#A59F9B] text-[12.8px] leading-[1.4] -mt-2">
        {loading ? 'Chargement…' : `Vue d'ensemble — ${moisLabel}`}
      </p>

      <KpiGrid kpis={kpis} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard serie={kpis?.finance.serie_mensuelle ?? []} />
        <DonutCard parType={kpis?.projets.par_type ?? []} />
      </div>

      <ActiviteCard items={activite} loading={loading} />
    </div>
  )
}

function KpiGrid({ kpis, loading }) {
  const items = [
    {
      label: 'CA facturé', icon: 'Compta', accent: 'forest',
      value: loading ? '…' : fmtCompact(kpis?.finance.ca_facture),
      unit: 'FCFA',
      delta: pctDelta(kpis?.finance.ca_facture, kpis?.finance.ca_facture_prev),
      to: '/comptabilite/factures',
    },
    {
      label: 'Projets en cours', icon: 'Projets', accent: 'amber',
      value: loading ? '…' : kpis?.projets.en_cours,
      unit: '',
      delta: null,
      to: '/projets',
    },
    {
      label: "Présences aujourd'hui", icon: 'RH', accent: 'blue',
      value: loading ? '…' : kpis?.rh.presences_aujourd_hui,
      unit: loading ? '' : `/ ${kpis?.rh.employes_actifs}`,
      delta: null,
      to: '/rh/pointage',
    },
    {
      label: 'Factures en retard', icon: 'Bell',
      accent: !loading && kpis?.finance.factures_en_retard > 0 ? 'red' : 'neutral',
      value: loading ? '…' : kpis?.finance.factures_en_retard,
      unit: '',
      delta: null,
      to: '/comptabilite/factures',
      danger: !loading && kpis?.finance.factures_en_retard > 0,
    },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((k) => <KpiCard key={k.label} {...k} />)}
    </div>
  )
}

const ACCENT_STYLES = {
  forest:  { box: 'bg-forest-50',     icon: 'text-forest-600' },
  amber:   { box: 'bg-amber-50',      icon: 'text-amber-600'  },
  blue:    { box: 'bg-blue-50',       icon: 'text-blue-600'   },
  red:     { box: 'bg-red-50',        icon: 'text-red-600'    },
  neutral: { box: 'bg-[#f4ebe0]',     icon: 'text-[#A59F9B]'  },
}

function KpiCard({ label, value, unit, delta, icon, to, danger, accent = 'neutral' }) {
  const I = Icon[icon]
  const a = ACCENT_STYLES[accent]
  return (
    <Link
      to={to}
      className="bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5 min-h-[140px] flex flex-col justify-between hover:ring-forest-200 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-body font-medium text-[#A59F9B] uppercase tracking-wider leading-[1.4] truncate">{label}</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`font-display font-bold text-[28px] leading-[1.2] ${danger ? 'text-red-600' : 'text-[#1C1817]'}`}>
              {value}
            </span>
            {unit && <span className="text-[12px] font-body text-[#A59F9B]">{unit}</span>}
          </div>
        </div>
        {I && (
          <div className={`w-[42px] h-[42px] rounded-md flex items-center justify-center shrink-0 ${a.box}`}>
            <I className={`w-5 h-5 ${a.icon}`} />
          </div>
        )}
      </div>
      {delta ? (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-display font-medium self-start ${
          delta.up ? 'bg-forest-50 text-forest-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {delta.up ? <Icon.ArrowUp className="w-3 h-3" /> : <Icon.ArrowDown className="w-3 h-3" />}
          {delta.label}
        </div>
      ) : (
        <div className="h-[20px]" />
      )}
    </Link>
  )
}

function ChartCard({ serie }) {
  const values = serie.map((s) => s.ca_facture)
  const max = Math.max(1, ...values)
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-[#1C1817] text-[16px] leading-[1.4]">CA facturé — 12 derniers mois</h3>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {serie.length === 0 ? (
          <div className="flex-1 text-center text-[#A59F9B] font-body text-sm self-center">Pas de données</div>
        ) : (
          serie.map((s, i) => {
            const [y, m] = s.mois.split('-').map(Number)
            const isLast = i === serie.length - 1
            return (
              <div key={s.mois} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full rounded-t-md transition-opacity group-hover:opacity-80"
                  style={{
                    height: `${(s.ca_facture / max) * 100}%`,
                    minHeight: s.ca_facture > 0 ? '2px' : '0',
                    background: isLast ? '#1a5c38' : '#bbdccb',
                  }}
                  title={`${MOIS_COURT[m - 1]} ${y}: ${fmt(s.ca_facture)} F`}
                />
                <span className="text-[9.5px] font-body text-[#A59F9B]">{MOIS_COURT[m - 1]}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function DonutCard({ parType }) {
  const total = parType.reduce((a, s) => a + s.nb, 0)
  const segs = parType.map((s) => ({
    nb: s.nb,
    label: TYPE_PROJET_LABEL[s.type_projet] ?? s.type_projet,
    color: TYPE_PROJET_COLOR[s.type_projet] ?? '#dceee4',
    pct: total > 0 ? Math.round((s.nb / total) * 100) : 0,
  }))
  let acc = 0
  return (
    <div className="bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5">
      <h3 className="font-display font-semibold text-[#1C1817] text-[16px] leading-[1.4] mb-4">Projets par type</h3>
      {total === 0 ? (
        <p className="text-[#A59F9B] font-body text-sm">Aucun projet actif</p>
      ) : (
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 42 42" className="w-24 h-24 -rotate-90 shrink-0">
            <circle cx="21" cy="21" r="15.9" fill="#fbf7f0" />
            {segs.map((s, i) => {
              const len = (s.nb / total) * 100
              const dash = `${len} ${100 - len}`
              const off = 100 - acc
              acc += len
              return (
                <circle key={i} cx="21" cy="21" r="15.9" fill="transparent"
                  stroke={s.color} strokeWidth="6"
                  strokeDasharray={dash} strokeDashoffset={off}
                  pathLength="100" />
              )
            })}
          </svg>
          <div className="flex-1 space-y-1.5">
            {segs.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px] font-body">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
                <span className="flex-1 text-[#1C1817] truncate">{s.label}</span>
                <span className="text-[#A59F9B] tabular-nums">{s.nb}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ActiviteCard({ items, loading }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-[#ece2d3] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f4ebe0] flex items-center justify-between bg-[#fbf7f0]">
        <h3 className="font-display font-semibold text-[#1C1817] text-[16px] leading-[1.4]">Activité récente</h3>
      </div>
      {loading ? (
        <p className="p-6 text-[#A59F9B] font-body text-sm">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="p-6 text-[#A59F9B] font-body text-sm">Aucune activité récente</p>
      ) : (
        <ul className="divide-y divide-[#f4ebe0]">
          {items.map((r, idx) => (
            <li key={`${r.id}-${idx}`} className="px-5 py-3 hover:bg-[#fbf7f0] transition-colors">
              <Link to={r.url} className="flex items-center gap-3">
                <span className="font-mono font-medium text-[12px] text-[#A59F9B] w-[110px] shrink-0 hidden sm:block truncate leading-[1.4]">{r.id}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-body text-[14px] text-[#1C1817] truncate leading-[1.5]">{r.label}</div>
                  <div className="text-[12.8px] font-body font-medium text-[#A59F9B] truncate leading-[1.4]">{r.meta}</div>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-display font-medium shrink-0 ${
                  r.tone === 'good' ? 'bg-forest-50 text-forest-700'
                  : r.tone === 'bad' ? 'bg-red-50 text-red-700'
                  : 'bg-[#f4ebe0] text-[#A59F9B]'
                }`}>{r.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function pctDelta(curr, prev) {
  if (curr == null || prev == null || prev === 0) return null
  const diff = curr - prev
  const pct = (diff / prev) * 100
  return {
    up: diff >= 0,
    label: `${diff >= 0 ? '+' : ''}${pct.toFixed(0)}%`,
  }
}

function fmtCompact(n) {
  if (n == null) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} Mds`
  if (abs >= 1_000_000)     return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`
  if (abs >= 1_000)         return `${(n / 1_000).toFixed(0)} k`
  return fmt(n)
}
