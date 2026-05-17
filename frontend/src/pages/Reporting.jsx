import { useEffect, useState } from 'react'
import api from '../services/api'
import { fmt, MOIS_FR } from '../utils/format'
import { Icon } from '../components/icons'

const MOIS_COURT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const TYPE_PROJET_LABEL = { btp: 'BTP', agriculture: 'Agriculture', pepiniere: 'Pépinière', location: 'Location', espaces_verts: 'Espaces verts', autre: 'Autre' }
const TYPE_PROJET_COLOR = { btp: '#1a5c38', agriculture: '#388562', pepiniere: '#5aa382', location: '#8dc3a9', espaces_verts: '#bbdccb', autre: '#dceee4' }

export default function Reporting() {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/reporting/kpis/')
      .then(({ data }) => setKpis(data))
      .catch(() => setError('Impossible de charger les indicateurs.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-center text-[#A59F9B] font-body text-sm py-12">Chargement…</p>
  if (error) return <p className="text-center text-red-500 font-body text-sm py-12">{error}</p>

  const moisLabel = `${MOIS_FR[kpis.finance.mois]} ${kpis.finance.annee}`

  return (
    <div className="space-y-8">
      <p className="font-body font-medium text-[#A59F9B] text-[12.8px] leading-[1.4] -mt-2">
        Vue analytique — {moisLabel}
      </p>

      <Section titre="Finance" icon="Compta">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="CA facturé"
            value={fmtCompact(kpis.finance.ca_facture)}
            unit="FCFA"
            delta={pctDelta(kpis.finance.ca_facture, kpis.finance.ca_facture_prev)}
            accent="forest"
          />
          <KpiCard
            label="CA encaissé"
            value={fmtCompact(kpis.finance.ca_encaisse)}
            unit="FCFA"
            delta={pctDelta(kpis.finance.ca_encaisse, kpis.finance.ca_encaisse_prev)}
            accent="forest"
          />
          <KpiCard
            label="Charges du mois"
            value={fmtCompact(kpis.finance.charges_mois)}
            unit="FCFA"
            delta={pctDelta(kpis.finance.charges_mois, kpis.finance.charges_prev)}
            accent="amber"
          />
          <KpiCard
            label="Marge"
            value={fmtCompact(kpis.finance.marge_mois)}
            unit="FCFA"
            delta={pctDelta(kpis.finance.marge_mois, kpis.finance.marge_prev)}
            accent={kpis.finance.marge_mois >= 0 ? 'forest' : 'red'}
            danger={kpis.finance.marge_mois < 0}
          />
        </div>
        <DoubleChartCard serie={kpis.finance.serie_mensuelle} />
      </Section>

      <Section titre="RH & Paie" icon="RH">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiCard
            label="Employés actifs"
            value={kpis.rh.employes_actifs}
            accent="blue"
          />
          <KpiCard
            label="Présences aujourd'hui"
            value={kpis.rh.presences_aujourd_hui}
            unit={`/ ${kpis.rh.employes_actifs}`}
            accent="blue"
          />
          <KpiCard
            label="Masse salariale"
            value={fmtCompact(kpis.rh.masse_salariale_mois)}
            unit="FCFA"
            delta={pctDelta(kpis.rh.masse_salariale_mois, kpis.rh.masse_salariale_prev)}
            accent="amber"
          />
        </div>
      </Section>

      <Section titre="Projets" icon="Projets">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <KpiCard label="Projets en cours" value={kpis.projets.en_cours} accent="amber" />
          <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5">
            <h4 className="font-display font-semibold text-[#1C1817] text-sm mb-3">Répartition par type</h4>
            <ProjetsParType data={kpis.projets.par_type} />
          </div>
        </div>
      </Section>

      <Section titre="CRM" icon="CRM">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiCard label="Clients total" value={kpis.crm.clients_total} accent="forest" />
          <KpiCard
            label="Nouveaux clients ce mois"
            value={kpis.crm.clients_nouveaux_mois}
            delta={pctDelta(kpis.crm.clients_nouveaux_mois, kpis.crm.clients_nouveaux_prev)}
            accent="forest"
          />
        </div>
      </Section>

      <Section titre="Stocks" icon="Stocks">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiCard
            label="Valeur du stock"
            value={fmtCompact(kpis.stocks.valeur_stock)}
            unit="unités"
            accent="neutral"
          />
          <KpiCard
            label="Articles en alerte"
            value={kpis.stocks.alertes}
            accent={kpis.stocks.alertes > 0 ? 'red' : 'neutral'}
            danger={kpis.stocks.alertes > 0}
          />
        </div>
      </Section>
    </div>
  )
}

function Section({ titre, icon, children }) {
  const I = Icon[icon]
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {I && <I className="w-4 h-4 text-[#A59F9B]" />}
        <h3 className="font-display font-semibold text-[#1C1817] text-[15px] leading-[1.4]">{titre}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

const ACCENT_STYLES = {
  forest:  { box: 'bg-forest-50',     icon: 'text-forest-600' },
  amber:   { box: 'bg-amber-50',      icon: 'text-amber-600'  },
  blue:    { box: 'bg-blue-50',       icon: 'text-blue-600'   },
  red:     { box: 'bg-red-50',        icon: 'text-red-600'    },
  neutral: { box: 'bg-[#f4ebe0]',     icon: 'text-[#A59F9B]'  },
}

function KpiCard({ label, value, unit, delta, danger, accent = 'neutral' }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5 min-h-[120px] flex flex-col justify-between">
      <div>
        <div className="text-[12px] font-body font-medium text-[#A59F9B] uppercase tracking-wider leading-[1.4] truncate">{label}</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className={`font-display font-bold text-[26px] leading-[1.2] ${danger ? 'text-red-600' : 'text-[#1C1817]'}`}>
            {value ?? '—'}
          </span>
          {unit && <span className="text-[11px] font-body text-[#A59F9B]">{unit}</span>}
        </div>
      </div>
      {delta ? (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-display font-medium self-start mt-2 ${
          delta.up ? 'bg-forest-50 text-forest-700' : 'bg-amber-50 text-amber-700'
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
    <div className="bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-display font-semibold text-[#1C1817] text-[14px]">CA facturé vs encaissé — 12 derniers mois</h4>
        <div className="flex items-center gap-3 text-[11px] font-body text-[#A59F9B]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-forest-700" /> Facturé</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-forest-300" /> Encaissé</span>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {serie.length === 0 ? (
          <div className="flex-1 text-center text-[#A59F9B] font-body text-sm self-center">Pas de données</div>
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
                    style={{ height: `${hFact}%`, minHeight: s.ca_facture > 0 ? '2px' : '0', background: '#1a5c38' }}
                    title={`Facturé ${MOIS_COURT[m - 1]} ${y}: ${fmt(s.ca_facture)} F`}
                  />
                  <div
                    className="flex-1 rounded-t-md transition-opacity group-hover:opacity-80"
                    style={{ height: `${hEnc}%`, minHeight: s.ca_encaisse > 0 ? '2px' : '0', background: '#bbdccb' }}
                    title={`Encaissé ${MOIS_COURT[m - 1]} ${y}: ${fmt(s.ca_encaisse)} F`}
                  />
                </div>
                <span className="text-[9.5px] font-body text-[#A59F9B]">{MOIS_COURT[m - 1]}</span>
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
    return <p className="text-[#A59F9B] font-body text-sm">Aucun projet en cours</p>
  }
  return (
    <div className="space-y-2">
      {data.map((s) => {
        const pct = Math.round((s.nb / total) * 100)
        return (
          <div key={s.type_projet}>
            <div className="flex items-center justify-between mb-1 text-[12px] font-body">
              <span className="text-[#1C1817]">{TYPE_PROJET_LABEL[s.type_projet] ?? s.type_projet}</span>
              <span className="text-[#A59F9B] tabular-nums">{s.nb} ({pct}%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#f4ebe0] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: TYPE_PROJET_COLOR[s.type_projet] ?? '#dceee4' }}
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
