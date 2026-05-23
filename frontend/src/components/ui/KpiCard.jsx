import { Link } from 'react-router-dom'

/**
 * Carte KPI unifiée — icon SVG tonal + valeur + sub.
 * La prop `tone` colore l'icône (faded) ; `valueTone` colore la valeur
 * (par défaut : ink). Si `to` est fourni, la carte devient un Link.
 *
 *   <KpiCard
 *     icon={<IconBox />}
 *     label="Articles"
 *     value="1 234"
 *     sub="Total inventaire"
 *     tone="forest"
 *     valueTone="ink"
 *     to="/stocks"
 *   />
 *
 * Tones disponibles :
 *   - forest : info global, positif (icon vert)
 *   - gold   : en attente, à surveiller
 *   - red    : alerte, retard, critique
 *   - blue   : info administrative
 *   - sand   : neutre, secondaire
 */

const ICON_TONE = {
  forest: 'text-forest-500',
  gold:   'text-gold-500',
  red:    'text-red-500',
  blue:   'text-blue-500',
  sand:   'text-sand-400',
}

const VALUE_TONE = {
  ink:    'text-ink',
  forest: 'text-forest-700',
  gold:   'text-gold-700',
  red:    'text-red-600',
  blue:   'text-blue-700',
  sand:   'text-sand-600',
}

export default function KpiCard({
  icon, label, value, sub,
  tone = 'sand',
  valueTone = 'ink',
  to,
}) {
  const inner = (
    <>
      {icon && (
        <div className={`kpi-icon ${ICON_TONE[tone] ?? ICON_TONE.sand}`}>
          {/* On force la taille au niveau du wrapper pour ne pas dépendre de la prop className passée à l'icône */}
          <span className="block w-7 h-7 [&>svg]:w-full [&>svg]:h-full">{icon}</span>
        </div>
      )}
      <p className="kpi-label">{label}</p>
      <p className={`kpi-value ${VALUE_TONE[valueTone] ?? VALUE_TONE.ink}`}>{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </>
  )

  if (to) {
    return (
      <Link to={to} className="kpi block hover:border-forest-300">
        {inner}
      </Link>
    )
  }
  return <div className="kpi">{inner}</div>
}
