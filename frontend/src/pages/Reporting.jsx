import { useEffect, useState } from 'react'
import api from '../services/api'
import { fmt, MOIS_FR } from '../utils/format'
import { Icon } from '../components/icons'
import ModuleTabs, { REPORTING_TABS } from '../components/ui/ModuleTabs'
import {
  IconInvoice, IconBank, IconChartBar, IconBox, IconWallet, IconArrowDown,
  IconUsers, IconCheck, IconCoins, IconBriefcase, IconHandshake, IconAlert,
} from '../components/ui/Icons'

const MOIS_COURT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const TYPE_PROJET_LABEL = { btp: 'BTP', agriculture: 'Agriculture', pepiniere: 'Pépinière', location: 'Location', espaces_verts: 'Espaces verts', autre: 'Autre' }
// Rampe verte alignée sur les tokens « forest » de la charte
const TYPE_PROJET_COLOR = { btp: '#1c5435', agriculture: '#2e8253', pepiniere: '#52a075', location: '#86c09e', espaces_verts: '#b6dac4', autre: '#dceee2' }

const TABS = [
  { key: 'finance', label: 'Finance' },
  { key: 'rh',      label: 'RH & Paie' },
  { key: 'projets', label: 'Projets' },
  { key: 'crm',     label: 'CRM' },
  { key: 'stocks',  label: 'Stocks' },
]

export default function Reporting() {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('finance')

  useEffect(() => {
    api.get('/reporting/kpis/')
      .then(({ data }) => setKpis(data))
      .catch(() => setError('Impossible de charger les indicateurs.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-5">
      <div className="card overflow-hidden"><ModuleTabs items={REPORTING_TABS} /></div>
      <p className="text-center text-sand-500 font-body text-sm py-12">Chargement…</p>
    </div>
  )
  if (error) return (
    <div className="space-y-5">
      <div className="card overflow-hidden"><ModuleTabs items={REPORTING_TABS} /></div>
      <p className="text-center text-red-500 font-body text-sm py-12">{error}</p>
    </div>
  )

  const moisLabel = `${MOIS_FR[kpis.finance.mois]} ${kpis.finance.annee}`
  const f = kpis.finance

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden"><ModuleTabs items={REPORTING_TABS} /></div>

      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">BI &amp; Reporting</div>
          <div className="sec-sub">KPIs métier consolidés — {moisLabel}</div>
        </div>
      </div>

      {/* ─── KPI de tête (synthèse multi-domaines) ───────── */}
      <div className="kpi-grid">
        <KpiCard icon={<IconInvoice />} label="CA facturé" value={fmtCompact(f.ca_facture)} unit="FCFA"
          delta={pctDelta(f.ca_facture, f.ca_facture_prev)} accent="forest" />
        <KpiCard icon={<IconBank />} label="CA encaissé" value={fmtCompact(f.ca_encaisse)} unit="FCFA"
          delta={pctDelta(f.ca_encaisse, f.ca_encaisse_prev)} accent="forest" />
        <KpiCard icon={<IconChartBar />} label="Marge du mois" value={fmtCompact(f.marge_mois)} unit="FCFA"
          delta={pctDelta(f.marge_mois, f.marge_prev)} accent={f.marge_mois >= 0 ? 'forest' : 'red'}
          danger={f.marge_mois < 0} />
        <KpiCard icon={<IconBox />} label="Valeur du stock" value={fmtCompact(kpis.stocks.valeur_stock)} unit="unités"
          accent="neutral" />
      </div>

      {/* ─── Carte à onglets (par domaine) ───────────────── */}
      <div className="card overflow-hidden">
        <div className="tabs">
          {TABS.map((t) => (
            <div key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </div>
          ))}
        </div>

        <div className="p-[18px]">
          {tab === 'finance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard icon={<IconInvoice />} label="CA facturé" value={fmtCompact(f.ca_facture)} unit="FCFA"
                  delta={pctDelta(f.ca_facture, f.ca_facture_prev)} accent="forest" />
                <KpiCard icon={<IconWallet />} label="CA encaissé" value={fmtCompact(f.ca_encaisse)} unit="FCFA"
                  delta={pctDelta(f.ca_encaisse, f.ca_encaisse_prev)} accent="forest" />
                <KpiCard icon={<IconArrowDown />} label="Charges du mois" value={fmtCompact(f.charges_mois)} unit="FCFA"
                  delta={pctDelta(f.charges_mois, f.charges_prev)} accent="amber" />
                <KpiCard icon={<IconChartBar />} label="Marge" value={fmtCompact(f.marge_mois)} unit="FCFA"
                  delta={pctDelta(f.marge_mois, f.marge_prev)} accent={f.marge_mois >= 0 ? 'forest' : 'red'}
                  danger={f.marge_mois < 0} />
              </div>
              <DoubleChartCard serie={f.serie_mensuelle} />
            </div>
          )}

          {tab === 'rh' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <KpiCard icon={<IconUsers />} label="Employés actifs" value={kpis.rh.employes_actifs} accent="blue" />
              <KpiCard icon={<IconCheck />} label="Présences aujourd'hui" value={kpis.rh.presences_aujourd_hui}
                unit={`/ ${kpis.rh.employes_actifs}`} accent="blue" />
              <KpiCard icon={<IconCoins />} label="Masse salariale" value={fmtCompact(kpis.rh.masse_salariale_mois)} unit="FCFA"
                delta={pctDelta(kpis.rh.masse_salariale_mois, kpis.rh.masse_salariale_prev)} accent="amber" />
            </div>
          )}

          {tab === 'projets' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <KpiCard icon={<IconBriefcase />} label="Projets en cours" value={kpis.projets.en_cours} accent="amber" />
              <div className="lg:col-span-2 bg-sand-50 rounded-xl border border-sand-200 p-5">
                <h4 className="font-display font-semibold text-ink text-sm mb-3">Répartition par type</h4>
                <ProjetsParType data={kpis.projets.par_type} />
              </div>
            </div>
          )}

          {tab === 'crm' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <KpiCard icon={<IconHandshake />} label="Clients total" value={kpis.crm.clients_total} accent="forest" />
              <KpiCard icon={<IconUsers />} label="Nouveaux clients ce mois" value={kpis.crm.clients_nouveaux_mois}
                delta={pctDelta(kpis.crm.clients_nouveaux_mois, kpis.crm.clients_nouveaux_prev)} accent="forest" />
            </div>
          )}

          {tab === 'stocks' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <KpiCard icon={<IconBox />} label="Valeur du stock" value={fmtCompact(kpis.stocks.valeur_stock)} unit="unités" accent="neutral" />
              <KpiCard icon={<IconAlert />} label="Articles en alerte" value={kpis.stocks.alertes}
                accent={kpis.stocks.alertes > 0 ? 'red' : 'neutral'} danger={kpis.stocks.alertes > 0} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ACCENT_BADGE = {
  forest:  'bg-forest-100 text-forest-700',
  amber:   'bg-gold-100 text-gold-700',
  blue:    'bg-blue-100 text-blue-700',
  red:     'bg-red-100 text-red-600',
  neutral: 'bg-sand-100 text-sand-600',
}

function KpiCard({ icon, label, value, unit, delta, danger, accent = 'neutral' }) {
  return (
    <div className="bg-white rounded-xl border border-sand-200 p-5 min-h-[120px] flex flex-col justify-between transition-all duration-200 hover:-translate-y-px">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="text-[12px] font-body font-medium text-sand-500 uppercase tracking-wider leading-[1.4] flex-1 min-w-0 truncate">
            {label}
          </div>
          {icon && (
            <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${ACCENT_BADGE[accent] ?? ACCENT_BADGE.neutral}`}>
              <span className="block w-[18px] h-[18px] [&>svg]:w-full [&>svg]:h-full">{icon}</span>
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`font-display font-bold text-[26px] leading-[1.2] ${danger ? 'text-red-600' : 'text-ink'}`}>
            {value ?? '—'}
          </span>
          {unit && <span className="text-[11px] font-body text-sand-500">{unit}</span>}
        </div>
      </div>
      {delta ? (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-display font-medium self-start mt-2 ${
          delta.up ? 'bg-forest-50 text-forest-700' : 'bg-gold-50 text-gold-700'
        }`}>
          {delta.up ? <Icon.ArrowUp className="w-3 h-3" /> : <Icon.ArrowDown className="w-3 h-3" />}
          {delta.label}
        </div>
      ) : (
        <div className="h-[18px]" />
      )}
    </div>
  )
}

function DoubleChartCard({ serie }) {
  const maxCa = Math.max(1, ...serie.map((s) => s.ca_facture))
  return (
    <div className="bg-sand-50 rounded-xl border border-sand-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-display font-semibold text-ink text-[14px]">CA facturé vs encaissé — 12 derniers mois</h4>
        <div className="flex items-center gap-3 text-[11px] font-body text-sand-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-forest-700" /> Facturé</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-forest-300" /> Encaissé</span>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {serie.length === 0 ? (
          <div className="flex-1 text-center text-sand-500 font-body text-sm self-center">Pas de données</div>
        ) : (
          serie.map((s) => {
            const [y, m] = s.mois.split('-').map(Number)
            const hFact = (s.ca_facture / maxCa) * 100
            const hEnc = (s.ca_encaisse / maxCa) * 100
            return (
              <div key={s.mois} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex gap-0.5 items-end h-full">
                  <div
                    className="flex-1 rounded-t-md transition-opacity group-hover:opacity-80"
                    style={{ height: `${hFact}%`, minHeight: s.ca_facture > 0 ? '2px' : '0', background: '#1c5435' }}
                    title={`Facturé ${MOIS_COURT[m - 1]} ${y}: ${fmt(s.ca_facture)} F`}
                  />
                  <div
                    className="flex-1 rounded-t-md transition-opacity group-hover:opacity-80"
                    style={{ height: `${hEnc}%`, minHeight: s.ca_encaisse > 0 ? '2px' : '0', background: '#86c09e' }}
                    title={`Encaissé ${MOIS_COURT[m - 1]} ${y}: ${fmt(s.ca_encaisse)} F`}
                  />
                </div>
                <span className="text-[9.5px] font-body text-sand-500">{MOIS_COURT[m - 1]}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ProjetsParType({ data }) {
  const total = data.reduce((a, s) => a + s.nb, 0)
  if (total === 0) {
    return <p className="text-sand-500 font-body text-sm">Aucun projet en cours</p>
  }
  return (
    <div className="space-y-2">
      {data.map((s) => {
        const pct = Math.round((s.nb / total) * 100)
        return (
          <div key={s.type_projet}>
            <div className="flex items-center justify-between mb-1 text-[12px] font-body">
              <span className="text-ink">{TYPE_PROJET_LABEL[s.type_projet] ?? s.type_projet}</span>
              <span className="text-sand-500 tabular-nums">{s.nb} ({pct}%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-sand-200 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: TYPE_PROJET_COLOR[s.type_projet] ?? '#dceee2' }}
              />
            </div>
          </div>
        )
      })}
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
