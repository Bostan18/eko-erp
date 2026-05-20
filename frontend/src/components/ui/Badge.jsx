/**
 * Badge — composant centralisé pour statuts et tags.
 *
 *   <Badge tone="green">Actif</Badge>
 *   <Badge tone="gold" dot>En attente</Badge>
 *
 * Tons disponibles : green · gold · red · blue · gray · ink
 */
export default function Badge({ tone = 'gray', dot = false, children, className = '' }) {
  return (
    <span className={`badge-${tone} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}

/* ─── Mappings réutilisables ─────────────────────────────── */

export const STATUS_TONE = {
  // factures / FNE
  certified:          ['green', 'Certifiée FNE'],
  pending:            ['gold',  'En attente FNE'],
  draft:              ['gray',  'Brouillon'],
  brouillon:          ['gray',  'Brouillon'],
  envoyee:            ['blue',  'Envoyée'],
  partiellement_payee:['gold',  'Partiellement payée'],
  payee:              ['green', 'Payée'],
  paid:               ['green', 'Payé'],
  en_retard:          ['red',   'En retard'],
  overdue:            ['red',   'En retard'],
  // RH / employés
  active:             ['green', 'Actif'],
  inactive:           ['gray',  'Inactif'],
  leave:              ['gold',  'Congé'],
  // engins / sites
  available:          ['green', 'Disponible'],
  rented:             ['blue',  'En location'],
  maintenance:        ['red',   'Maintenance'],
  closing:            ['gold',  'Clôture'],
  // pépinière / lots
  healthy:            ['green', 'Sain'],
  alert:              ['red',   '⚠ Repiquage dû'],
  // docs
  valid:              ['green', 'Valide'],
  expiring:           ['gold',  'Expire bientôt'],
  expired:            ['red',   '⚠ Expiré'],
  // paiements
  incoming:           ['green', 'Encaissement'],
  outgoing:           ['red',   'Décaissement'],
  validated:          ['green', 'Validé'],
}

export function StatusBadge({ status, label }) {
  const [tone, def] = STATUS_TONE[status] ?? ['gray', status ?? '—']
  return <Badge tone={tone}>{label ?? def}</Badge>
}

export const CENTER_TONE = {
  BTP: 'blue',
  Pépinière: 'green',
  Location: 'gold',
  Plantation: 'green',
  Démolition: 'gray',
}

export function CenterBadge({ center }) {
  return <Badge tone={CENTER_TONE[center] ?? 'gray'}>{center}</Badge>
}
