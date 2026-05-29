import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      console.warn('[PWA] échec enregistrement service worker', err)
    },
  })

  if (!needRefresh && !offlineReady) return null

  const close = () => {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-50 right-4 bottom-20 md:bottom-4 max-w-sm rounded-xl bg-ink text-sand-50 shadow-drawer border border-black/40 px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-8 w-8 rounded-lg bg-forest-500/15 text-forest-300 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {needRefresh ? (
              <>
                <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
                <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M3 21v-5h5" />
              </>
            ) : (
              <>
                <path d="M5 13l4 4L19 7" />
              </>
            )}
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-semibold leading-tight">
            {needRefresh ? 'Nouvelle version disponible' : 'Application prête hors-ligne'}
          </p>
          <p className="mt-0.5 text-xs text-sand-300 leading-snug">
            {needRefresh
              ? 'Rechargez pour appliquer la mise à jour.'
              : 'EKO ERP fonctionne désormais sans connexion.'}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            {needRefresh && (
              <button
                type="button"
                onClick={() => updateServiceWorker(true)}
                className="px-3 py-1.5 rounded-lg bg-forest-500 hover:bg-forest-600 text-sand-50 text-xs font-display font-semibold transition-colors"
              >
                Mettre à jour
              </button>
            )}
            <button
              type="button"
              onClick={close}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sand-200 text-xs font-display font-medium transition-colors"
            >
              {needRefresh ? 'Plus tard' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
