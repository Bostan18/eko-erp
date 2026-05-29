/**
 * État « rien à afficher ». Utilisé dans les listes/tableaux vides,
 * les recherches sans résultat, les drawers vierges.
 *
 *   <EmptyState
 *     icon={<IconBox />}
 *     titre="Aucun chantier ouvert"
 *     sub="Crée ton premier projet pour démarrer le suivi terrain."
 *     cta={<button className="btn-primary">Nouveau projet</button>}
 *   />
 */
export default function EmptyState({ icon, titre, sub, cta, dense = false }) {
  const py = dense ? 'py-8' : 'py-14'
  return (
    <div className={`flex flex-col items-center justify-center ${py} px-6 text-center`}>
      {icon && (
        <div className="text-sand-300 mb-3 [&>svg]:w-10 [&>svg]:h-10">
          {icon}
        </div>
      )}
      <p className="font-display font-semibold text-[14px] text-ink">{titre}</p>
      {sub && (
        <p className="font-body text-[12px] text-sand-500 max-w-[26ch] mt-1.5 leading-relaxed">
          {sub}
        </p>
      )}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  )
}

/* ─── Quelques icônes prêtes à servir d'illustration ──── */

export const IconEmptyBox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </svg>
)

export const IconEmptySearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
    <path d="M8 11h6" strokeLinecap="round" />
  </svg>
)

export const IconEmptyClipboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    <path d="M9 11h6M9 15h4" strokeLinecap="round" />
  </svg>
)
