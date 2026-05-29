import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Mini-modale centrée pour confirmation d'action destructive.
 *
 *   {deleting && (
 *     <ConfirmDialog
 *       titre="Supprimer la facture ?"
 *       message={`La facture ${deleting.numero_local} sera supprimée. Cette action est irréversible.`}
 *       confirmLabel="Supprimer"
 *       tone="danger"
 *       busy={removing}
 *       onConfirm={confirmerSuppression}
 *       onCancel={() => setDeleting(null)}
 *     />
 *   )}
 *
 * Raccourcis clavier : Échap → onCancel · Entrée → onConfirm.
 * Overlay cliquable = annulation.
 * Le bouton de confirmation reçoit le focus initial (autoFocus).
 */
export default function ConfirmDialog({
  titre = 'Confirmer',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function onKey(e) {
      if (busy) return
      if (e.key === 'Escape') { e.preventDefault(); onCancel?.() }
      if (e.key === 'Enter')  { e.preventDefault(); onConfirm?.() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onConfirm, onCancel, busy])

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-[1000]
                   animate-[fadeIn_.18s_cubic-bezier(.4,0,.2,1)]"
        onClick={busy ? undefined : onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-white rounded-xl shadow-lg max-w-[420px] w-full p-6 pointer-events-auto
                     animate-[popIn_.22s_cubic-bezier(.22,1.15,.36,1)]"
        >
          <h2 className="font-display font-semibold text-[15px] text-ink mb-2">{titre}</h2>
          {message && (
            <p className="font-body text-[13px] text-sand-700 mb-5 whitespace-pre-line">{message}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={busy}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
              onClick={onConfirm}
              disabled={busy}
              autoFocus
            >
              {busy ? 'Patientez…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(.94); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>,
    document.body
  )
}
