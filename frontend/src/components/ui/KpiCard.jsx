import { Link } from 'react-router-dom'

/**
 * Carte KPI — badge icône coloré (haut-droite) + valeur sobre + glow tonal au hover.
 * Le `tone` régit le badge (fond pâle + icône saturée) et l'anneau de hover.
 *
 *   <KpiCard
 *     icon={<IconBox />}
 *     label="Articles"
 *     value="1 234"
 *     sub="Total inventaire"
 *     tone="forest"
 *     to="/stocks"
 *   />
 *
 * Tones :
 *   - forest : positif, global, actif
 *   - gold   : en attente, à surveiller
 *   - red    : alerte, retard, critique
 *   - blue   : info administrative
 *   - sand   : neutre, secondaire (défaut)
 */

const BADGE = {
  forest: 'bg-forest-100 text-forest-700',
  gold:   'bg-gold-100 text-gold-700',
  red:    'bg-red-100 text-red-600',
  blue:   'bg-blue-100 text-blue-700',
  sand:   'bg-sand-100 text-sand-600',
}

export default function KpiCard({
  icon, label, value, sub,
  tone = 'sand',
  to,
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="kpi-label !mb-0 mt-1">{label}</p>
        {icon && (
          <span className={`kpi-badge ${BADGE[tone] ?? BADGE.sand}`}>
            <span className="block w-[18px] h-[18px] [&>svg]:w-full [&>svg]:h-full">{icon}</span>
          </span>
        )}
      </div>
      <p className="kpi-value">{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </>
  )

  if (to) {
    return (
      <Link to={to} data-tone={tone} className="kpi block">
        {inner}
      </Link>
    )
  }
  return <div data-tone={tone} className="kpi">{inner}</div>
}
