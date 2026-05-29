import { useEffect } from 'react'

/* Ferme un panneau au clic extérieur ou sur Échap. */
export function useClickOutside(ref, onClose, actif = true) {
  useEffect(() => {
    if (!actif) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [ref, onClose, actif])
}
