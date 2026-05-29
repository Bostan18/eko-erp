import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modal latéral type « drawer » — coulisse depuis la droite.
 * Reprend le pattern de la maquette EKO ERP.html (drawer 530 px).
 *
 * Accessibilité : role=dialog + aria-modal, focus-trap (Tab cycle interne),
 * focus initial sur le premier élément focusable, restauration du focus au close.
 *
 * Props :
 *   titre, sous-titre, onClose, footer, children, width (px ou tailwind)
 *
 * Footer : deux APIs —
 *   • prop `footer` (legacy) : actions hors <form> (ex : exports, fermeture seule).
 *     Rendu dans une barre fixe en bas du drawer.
 *   • <ModalFooter> (recommandé pour les forms) : rend les boutons en sticky
 *     bottom à l'intérieur du body scrollable, donc DOM-enfants du <form> —
 *     `type="submit"` déclenche bien le submit HTML natif.
 */
export default function Modal({ titre, sousTitre, onClose, footer, children, width = 530 }) {
  const titleId = useId()
  const asideRef = useRef(null)
  // Animation de sortie : on bascule sur les keyframes inverses, puis on
  // remonte `onClose` au parent (= démontage réel) une fois l'animation finie.
  const [closing, setClosing] = useState(false)
  const requestClose = () => { if (!closing) setClosing(true) }
  const handleAnimationEnd = (e) => {
    if (closing && e.animationName === 'slideOut') onClose?.()
  }

  useEffect(() => {
    // Le scroll réel se passe sur <main> (pas <body>) — on cible le bon container
    const main = document.querySelector('main')
    const prevOverflow = main?.style.overflow
    if (main) main.style.overflow = 'hidden'
    // Signale aux autres composants qu'un drawer est ouvert (ex: masquer searchbar)
    document.body.dataset.drawerOpen = 'true'

    // Mémorise l'élément qui avait le focus (typiquement le bouton "Nouveau …"
    // qui a déclenché l'ouverture) pour le restaurer au close.
    const previouslyFocused = document.activeElement

    // Focus initial : premier élément focusable du drawer (input plutôt que
    // le bouton "Fermer", pour ne pas démarrer sur l'action destructive).
    const aside = asideRef.current
    const focusables = aside ? aside.querySelectorAll(FOCUSABLE_SELECTOR) : []
    const firstInput = aside?.querySelector('input, select, textarea')
    const target = firstInput ?? focusables[0] ?? aside
    target?.focus({ preventScroll: true })

    function onKeyDown(e) {
      if (e.key === 'Escape') { requestClose(); return }
      if (e.key !== 'Tab' || !aside) return

      // Focus-trap : cycle Tab/Shift+Tab à l'intérieur du drawer.
      const items = Array.from(aside.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter((el) => el.offsetParent !== null) // skip éléments cachés
      if (items.length === 0) return
      const first = items[0]
      const last  = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !aside.contains(active))) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && (active === last || !aside.contains(active))) {
        e.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (main) main.style.overflow = prevOverflow ?? ''
      delete document.body.dataset.drawerOpen
      // Restaure le focus sur l'élément déclencheur si toujours présent dans le DOM.
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [onClose])

  // Portal vers <body> : le Modal est monté en frère de #root, ce qui le sort
  // de tout ancêtre qui crée un containing block pour les éléments fixed
  // (notamment `.screen` dans MainLayout qui a `animation: screenIn` →
  // `transform` rémanent). Sans ce portal, `fixed top-0` se calcule par rapport
  // au `.screen` au lieu du viewport, et le drawer + l'overlay laissent
  // visibles la topbar et la sidebar au-dessus.
  return createPortal(
    <>
      {/* Overlay plein écran : grise toute la page (sidebar + topbar incluses)
          pour focaliser l'attention sur le drawer. */}
      <div
        className={`fixed inset-0 bg-ink/30 backdrop-blur-[2px] z-[900]
                   ${closing
                     ? 'animate-[fadeOut_.24s_cubic-bezier(.4,0,.6,1)_forwards]'
                     : 'animate-[fadeIn_.24s_cubic-bezier(.4,0,.2,1)]'}`}
        onClick={requestClose}
      />

      {/* Drawer (entrée avec léger overshoot, sortie douce) */}
      <aside
        ref={asideRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onAnimationEnd={handleAnimationEnd}
        className={`fixed top-0 right-0 h-screen bg-white z-[901] flex flex-col shadow-drawer
                   ${closing
                     ? 'animate-[slideOut_.28s_cubic-bezier(.4,0,.6,1)_forwards]'
                     : 'animate-[slideIn_.32s_cubic-bezier(.22,1.15,.36,1)]'}
                   w-full md:w-auto max-w-full focus:outline-none`}
        style={{ width: `min(${typeof width === 'number' ? width + 'px' : width}, 100vw)` }}
      >
        {/* Head — alignée pile sur la topbar (h-[52px]) */}
        <div className="h-[52px] px-6 border-b border-sand-200 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display font-semibold text-[14px] text-ink leading-tight truncate">{titre}</h2>
            {sousTitre && (
              <p className="font-body text-[11px] text-sand-500 leading-tight truncate">{sousTitre}</p>
            )}
          </div>
          <button
            onClick={requestClose}
            aria-label="Fermer"
            className="w-7 h-7 rounded-md border border-sand-200 text-sand-700 hover:bg-sand-50 flex items-center justify-center transition shrink-0 ml-3"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable, padding direct. Les <ModalFooter> à l'intérieur
            d'un <form> ici se positionnent en sticky bottom (voir plus bas). */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer legacy (prop `footer` uniquement) — actions hors form. */}
        {footer && (
          <div className="px-6 py-3 border-t border-sand-200 flex gap-2 justify-end shrink-0">
            {footer}
          </div>
        )}
      </aside>

      <style>{`
        @keyframes slideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideOut { from { transform: translateX(0); }    to { transform: translateX(100%); } }
        @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut  { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
    </>,
    document.body
  )
}

/* ─── Sous-composants utilitaires pour les formulaires ───── */

/**
 * Footer pour les formulaires dans un Modal — rendu en sticky bottom à
 * l'intérieur du body scrollable du drawer. Les boutons restent donc
 * DOM-enfants du <form> parent, ce qui permet à `type="submit"` de
 * déclencher le submit HTML natif (un portal hors du form l'aurait cassé).
 *
 * Usage typique :
 *   <Modal titre="...">
 *     <form onSubmit={handleSubmit}>
 *       {sections}
 *       <ModalFooter>
 *         <button type="button" onClick={onClose}>Annuler</button>
 *         <button type="submit">Enregistrer</button>
 *       </ModalFooter>
 *     </form>
 *   </Modal>
 *
 * Les marges négatives (-mx-6 / -mb-5) annulent la padding du body parent
 * pour que la barre aille bord à bord et colle pile au fond visible.
 */
export function ModalFooter({ children }) {
  return (
    <div className="sticky bottom-0 -mx-6 -mb-5 mt-6 px-6 py-3 bg-white border-t border-sand-200 flex gap-2 justify-end">
      {children}
    </div>
  )
}

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
