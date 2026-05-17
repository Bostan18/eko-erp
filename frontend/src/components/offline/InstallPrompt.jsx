import { useEffect, useState } from 'react'

const DISMISS_KEY = 'eko.pwa.install.dismissed'
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000  // 30 jours

function recentlyDismissed() {
  const ts = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10)
  return ts > 0 && (Date.now() - ts) < DISMISS_TTL_MS
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault()
      setDeferred(e)
      if (!recentlyDismissed()) setOpen(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!open || !deferred) return null

  async function install() {
    try {
      deferred.prompt()
      await deferred.userChoice
    } finally {
      setDeferred(null)
      setOpen(false)
    }
  }

  function plusTard() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#212121]/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={plusTard} />
      <div className="relative bg-white rounded-2xl ring-1 ring-[#ece2d3] p-6 max-w-md w-full shadow-2xl">
        <h2 className="font-display font-bold text-[#1C1817] text-[18px]">Installer EKO sur votre téléphone</h2>
        <p className="font-body text-[14px] text-[#A59F9B] mt-2">
          Installez EKO sur votre écran d'accueil pour un accès rapide et le mode hors-ligne sur le terrain.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={plusTard}
            className="flex-1 bg-[#f4ebe0] text-[#5d4f3a] rounded-lg px-4 py-2 font-display font-medium text-sm hover:bg-[#ece2d3]"
          >
            Plus tard
          </button>
          <button
            onClick={install}
            className="flex-1 bg-forest-700 text-white rounded-lg px-4 py-2 font-display font-medium text-sm hover:bg-forest-800"
          >
            Installer
          </button>
        </div>
      </div>
    </div>
  )
}
