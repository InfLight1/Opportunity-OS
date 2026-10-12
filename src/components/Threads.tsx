import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRevealOnEnter } from '@/hooks/use-reveal-on-enter'

export type ThreadState = 'open' | 'committed' | 'locked'

export interface ThreadsProps {
  sources: { id: string; title: string; missing?: boolean }[]
  dests: { id: string; title: string; state: ThreadState; via: string; note?: string }[]
  links: { from: string; to: string; state: ThreadState }[]
  /** Planner variant: open threads stay quieter. */
  planner?: boolean
}

type Path = { key: string; d: string; state: ThreadState; x: number; y: number }

// Curves from each project box to each opportunity box, measured from the real
// layout so they stay attached at every width. Text lives in HTML, not the SVG.
export function Threads({ sources, dests, links, planner = false }: ThreadsProps) {
  const [wrapRef, revealed] = useRevealOnEnter<HTMLDivElement>()
  const srcRefs = useRef(new Map<string, HTMLElement>())
  const destRefs = useRef(new Map<string, HTMLElement>())
  const [paths, setPaths] = useState<Path[]>([])
  const [late, setLate] = useState(false)

  // Threads draw in on scroll; if the observer never fires, show them anyway.
  useEffect(() => {
    const t = window.setTimeout(() => setLate(true), 4000)
    return () => window.clearTimeout(t)
  }, [])

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => {
      const box = wrap.getBoundingClientRect()
      const stacked = window.matchMedia('(max-width: 960px)').matches
      const next: Path[] = []
      for (const l of links) {
        const s = srcRefs.current.get(l.from)?.getBoundingClientRect()
        const t = destRefs.current.get(l.to)?.getBoundingClientRect()
        if (!s || !t) continue
        const x1 = stacked ? s.left - box.left + 20 : s.right - box.left
        const y1 = stacked ? s.bottom - box.top : s.top - box.top + s.height / 2
        const x2 = t.left - box.left
        const y2 = t.top - box.top + t.height / 2
        const d = stacked
          ? `M${x1},${y1} C${x1},${y2} ${x1},${y2} ${x2},${y2}`
          : `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`
        next.push({ key: `${l.from}-${l.to}`, d, state: l.state, x: x2, y: y2 })
      }
      setPaths(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [links, sources, dests, wrapRef])

  const order: Record<ThreadState, number> = { locked: 0, open: 1, committed: 2 }
  const drawn = [...paths].sort((a, b) => order[a.state] - order[b.state])

  return (
    <div ref={wrapRef} className={`threads ${planner ? 'planner-threads' : ''} ${revealed || late ? 'in' : ''}`}>
      <svg className="lines" aria-hidden="true" focusable="false">
        {drawn.filter((p) => p.state !== 'locked' && !(planner && p.state === 'open')).map((p) => (
          <path key={`g-${p.key}`} className="thread glow" d={p.d} />
        ))}
        {drawn.map((p) => (
          // pathLength only on drawn-in threads: it would rescale the locked thread's dashes.
          <path key={p.key} className={`thread ${p.state} ${p.state === 'locked' ? '' : 'drawable'}`} d={p.d} pathLength={p.state === 'locked' ? undefined : 1} />
        ))}
        {drawn.map((p) => <circle key={`n-${p.key}`} className={`tnode ${p.state}`} cx={p.x} cy={p.y} r={4.5} />)}
      </svg>
      <div className="t-srcs">
        {sources.map((s) => (
          <div key={s.id} ref={(el) => { if (el) srcRefs.current.set(s.id, el); else srcRefs.current.delete(s.id) }} className={`t-src ${s.missing ? 'missing' : ''}`}>
            <small>{s.missing ? 'Project to build' : 'Your project'}</small>
            <strong>{s.title}</strong>
          </div>
        ))}
      </div>
      <ul className="t-dests">
        {dests.map((d) => (
          <li key={d.id} ref={(el) => { if (el) destRefs.current.set(d.id, el); else destRefs.current.delete(d.id) }} className="t-dest" data-state={d.state}>
            <strong>
              {d.title}
              {d.state === 'committed' && <span className="tag-word">Committed</span>}
            </strong>
            <span className="via">via <b>{d.via}</b></span>
            {d.note && <span className="lock">{d.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
