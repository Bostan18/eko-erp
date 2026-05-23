import { useEffect } from 'react'

/**
 * Modal latéral type « drawer » — coulisse depuis la droite.
 * Reprend le pattern de la maquette EKO ERP.html (drawer 530 px).
 *
 * Props :
 *   titre, sous-titre, onClose, footer, children, width (px ou tailwind)
 */
export default function Modal({ titre, sousTitre, onClose, footer, children, width = 530 }) {
  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] z-[900]
                   animate-[fadeIn_.24s_cubic-bezier(.4,0,.2,1)]"
        onClick={onClose}
      />

      {/* Drawer (entrée avec léger overshoot, sortie douce) */}
      <aside
        className="fixed top-0 right-0 h-screen bg-white z-[901] flex flex-col shadow-drawer
                   animate-[slideIn_.32s_cubic-bezier(.22,1.15,.36,1)]"
        style={{ width }}
      >
        {/* Head */}
        <div className="px-6 py-4 border-b border-sand-200 flex items-start justify-between shrink-0">
          <div>
            <h2 className="font-display font-semibold text-[15px] text-ink">{titre}</h2>
            {sousTitre && (
              <p className="font-body text-[11.5px] text-sand-500 mt-0.5">{sousTitre}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-7 h-7 rounded-md border border-sand-200 text-sand-700 hover:bg-sand-50 flex items-center justify-center transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3 border-t border-sand-200 flex gap-2 justify-end shrink-0">
            {footer}
          </div>
        )}
      </aside>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  )
}

/* ─── Sous-composants utilitaires pour les formulaires ───── */

export function FormSection({ titre, children }) {
  return (
    <section className="mb-6">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500 font-semibold mb-3 pb-1.5 border-b border-sand-200">
        {titre}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function FormRow({ cols = 1, children }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  )
}

export function Field({ label, required, hint, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-display font-medium text-ink">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="text-[10.5px] text-sand-500">{hint}</span>}
    </label>
  )
}
