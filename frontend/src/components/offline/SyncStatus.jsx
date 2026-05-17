import { useEffect, useState } from 'react'
import {
  countPending, listPending, syncAll,
  SYNC_OK_EVENT, SYNC_ERROR_EVENT, SYNC_PROGRESS_EVENT,
} from '../../offline/syncManager'
import { useNetworkStatus } from '../../offline/networkStatus'

export default function SyncStatus({ compact = false }) {
  const { online } = useNetworkStatus()
  const [pending, setPending] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function refresh() {
    const n = await countPending()
    setPending(n)
  }

  useEffect(() => {
    refresh()
    const ok = () => { setError(false); refresh() }
    const err = () => { setError(true); refresh() }
    const prog = () => refresh()
    window.addEventListener(SYNC_OK_EVENT, ok)
    window.addEventListener(SYNC_ERROR_EVENT, err)
    window.addEventListener(SYNC_PROGRESS_EVENT, prog)
    return () => {
      window.removeEventListener(SYNC_OK_EVENT, ok)
      window.removeEventListener(SYNC_ERROR_EVENT, err)
      window.removeEventListener(SYNC_PROGRESS_EVENT, prog)
    }
  }, [])

  useEffect(() => {
    if (showDetail) listPending().then(setItems)
  }, [showDetail])

  async function retry() {
    setBusy(true)
    setError(false)
    try { await syncAll() } finally { setBusy(false); refresh() }
  }

  const label = !online
    ? `${pending} en attente`
    : error
      ? '✗ Erreur sync'
      : pending > 0
        ? `⟳ ${pending} en attente`
        : '✓ Synchronisé'

  const bgClass = !online
    ? 'bg-[#FAEEDA] text-[#854F0B]'
    : error
      ? 'bg-[#FCEBEB] text-[#A32D2D]'
      : pending > 0
        ? 'bg-[#FFF6E5] text-[#854F0B]'
        : 'bg-[#EAF3DE] text-[#3B6D11]'

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDetail(true)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-display font-medium ${bgClass} ${compact ? '' : 'min-h-[28px]'}`}
        title={`État synchronisation${online ? ' (en ligne)' : ' (hors-ligne)'}`}
      >
        {label}
      </button>

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#212121]/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white rounded-2xl ring-1 ring-[#ece2d3] p-6 max-w-md w-full shadow-2xl max-h-[80vh] flex flex-col">
            <h2 className="font-display font-bold text-[#1C1817] text-[18px] mb-2">Synchronisation</h2>
            <p className="font-body text-[13px] text-[#A59F9B] mb-4">
              {online ? 'Connecté au réseau' : 'Hors-ligne'} ·{' '}
              {pending === 0 ? 'aucune saisie en attente' : `${pending} saisie(s) en attente`}
            </p>
            <div className="overflow-y-auto flex-1 -mx-2 px-2">
              {items.length === 0 ? (
                <p className="text-sm text-[#A59F9B] font-body py-2">Tout est à jour.</p>
              ) : items.map((op) => (
                <div key={op.id} className="border-b border-[#f4ebe0] py-2 text-[12px] font-body">
                  <p className="font-mono text-[#1C1817]">{op.method} {op.endpoint}</p>
                  <p className="text-[#A59F9B]">
                    {new Date(op.createdAt).toLocaleString('fr-FR')} · tentatives : {op.tentatives ?? 0}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowDetail(false)}
                className="flex-1 bg-[#f4ebe0] text-[#5d4f3a] rounded-lg px-4 py-2 font-display font-medium text-sm hover:bg-[#ece2d3]"
              >
                Fermer
              </button>
              <button
                onClick={retry}
                disabled={!online || busy || pending === 0}
                className="flex-1 bg-forest-700 text-white rounded-lg px-4 py-2 font-display font-medium text-sm hover:bg-forest-800 disabled:opacity-60"
              >
                {busy ? 'Synchronisation…' : 'Réessayer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
