import { useEffect, useState } from 'react'

export const NETWORK_EVENT = 'eko:network:change'

let listeners = 0
function attachListeners(onChange) {
  const handler = () => {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true
    onChange(online)
    window.dispatchEvent(new CustomEvent(NETWORK_EVENT, { detail: { online } }))
  }
  window.addEventListener('online',  handler)
  window.addEventListener('offline', handler)
  listeners += 1
  return () => {
    window.removeEventListener('online',  handler)
    window.removeEventListener('offline', handler)
    listeners -= 1
  }
}

export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline())
  const [lastChange, setLastChange] = useState(null)

  useEffect(() => {
    return attachListeners((next) => {
      setOnline(next)
      setLastChange(new Date())
    })
  }, [])

  return { online, lastChange }
}
