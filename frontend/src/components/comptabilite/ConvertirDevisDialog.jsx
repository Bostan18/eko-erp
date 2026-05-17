import { useEffect } from 'react'
import { fmt } from '../../utils/format'

function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  )
}

function IconInvoice(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h7M9 16h5" />
    </svg>
  )
}

export { IconCheck, IconInvoice }

export function ConvertirDevisModal({ devis, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#212121]/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl ring-1 ring-[#ece2d3] p-6 max-w-md w-full shadow-2xl">
        <h2 className="font-display font-bold text-[#1C1817] text-[18px]">
          Convertir ce devis en facture ?
        </h2>
        <p className="font-body text-[14px] text-[#A59F9B] mt-2">
          Le devis <span className="font-mono text-[#1C1817]">{devis.numero}</span>{' '}
          ({fmt(devis.total_ttc)} FCFA) sera converti en facture brouillon.
          Les lignes, le client et le projet seront copiés automatiquement.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#f4ebe0] text-[#5d4f3a] rounded-lg px-4 py-2 font-display font-medium text-[14px] hover:bg-[#ece2d3] transition-colors flex-1"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-forest-700 hover:bg-forest-800 text-white rounded-lg px-4 py-2 font-display font-medium text-[14px] transition-colors flex-1"
          >
            Oui, convertir
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConvertirDevisToast({ numeroLocal, visible }) {
  return (
    <div
      className={`fixed top-5 right-5 z-50 bg-forest-700 text-white rounded-xl px-5 py-3.5 shadow-xl flex items-center gap-2.5 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <IconCheck className="w-[18px] h-[18px] shrink-0" />
      <span className="font-display text-[14px] font-medium">
        Facture {numeroLocal} créée avec succès
      </span>
    </div>
  )
}
