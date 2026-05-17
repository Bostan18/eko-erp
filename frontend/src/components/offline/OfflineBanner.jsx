import { useNetworkStatus } from '../../offline/networkStatus'

export default function OfflineBanner() {
  const { online } = useNetworkStatus()
  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-40 w-full h-10 flex items-center justify-center gap-2 px-4 bg-[#FAEEDA] text-[#854F0B] text-[13px] font-display font-medium border-b border-[#E6D7B9]"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <path d="M1 1l22 22" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      Mode hors-ligne — vos saisies seront synchronisées dès le retour du réseau.
    </div>
  )
}
