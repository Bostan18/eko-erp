import { useEffect, useRef, useState } from 'react'

/**
 * Anime un nombre de 0 à `target` en ms (ease-out cubic).
 * Respecte `prefers-reduced-motion: reduce` : retourne la valeur finale
 * immédiatement, sans rAF, pour l'accessibilité OS.
 */
export default function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  const ref = useRef(target)

  useEffect(() => {
    if (target == null) return
    ref.current = target

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setValue(target)
      return
    }

    const start = performance.now()
    let raf
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(ref.current * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
