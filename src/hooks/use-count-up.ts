import { useEffect, useState } from 'react'

/**
 * Counts from 0 to `target` over `durationMs` (ease-out) after `delayMs`.
 * Returns `target` at once when `reducedMotion` is true.
 */
export function useCountUp(target: number, durationMs: number, delayMs: number, reducedMotion: boolean): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / durationMs)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    const timer = window.setTimeout(() => { raf = requestAnimationFrame(tick) }, delayMs)
    return () => { window.clearTimeout(timer); cancelAnimationFrame(raf) }
  }, [target, durationMs, delayMs, reducedMotion])

  return reducedMotion ? target : value
}
