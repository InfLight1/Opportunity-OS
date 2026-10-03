import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronsRight, Flag, TriangleAlert } from 'lucide-react'
import { formatHours, type TimelineColumn } from '@/lib/tool-view'
import { SectionHeader } from './SectionHeader'

export interface WeeksTimelineProps {
  columns: TimelineColumn[]
  hasCommits: boolean
  titles: Record<string, string>
  previewHours: number | null
  /** Rendered between the header and the columns (the what-if box). */
  controls?: ReactNode
}

const PLOT_H = 168

export function WeeksTimeline({ columns, hasCommits, titles, previewHours, controls }: WeeksTimelineProps) {
  const scale = Math.max(1, ...columns.map((c) => Math.max(c.bucket.capacity_hours, c.bucket.load_hours)))
  const px = (h: number) => (h / scale) * PLOT_H
  const red = columns.filter((c) => c.overloadSentence)

  // Fade + hint on the right while later weeks are hidden.
  const scroller = useRef<HTMLDivElement>(null)
  const [moreRight, setMoreRight] = useState(false)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const update = () => setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    const raf = requestAnimationFrame(update)
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { cancelAnimationFrame(raf); el.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [columns.length, hasCommits])

  return (
    <section id="weeks-section" aria-labelledby="weeks" className="space-y-6">
      <SectionHeader
        id="weeks"
        eyebrow="Backward from each deadline"
        title="Your weeks"
        description="Each column is 7 days from today. Hours fill the deadline week first, then earlier weeks."
        aside={previewHours !== null && (
          <span className="rounded-full border border-dashed border-fog-2 px-3 py-1 text-[13px] text-fog-2 tabular-nums">
            Preview at {formatHours(previewHours)} h a week, not saved
          </span>
        )}
      />
      {controls}
      {!hasCommits ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-muted-foreground">Commit an opportunity to see when to work on it.</p>
      ) : (
        <>
          <div className="relative">
            <div ref={scroller} className="overflow-x-auto pb-2">
              <ol className="flex gap-2" aria-label="Weeks from today">
                {columns.map((c) => {
                  const over = c.bucket.overloaded
                  const first = c.bucket.index === 0
                  return (
                    <li
                      key={c.bucket.index}
                      className={[
                        'flex w-[128px] shrink-0 flex-col rounded-lg border p-2 transition-colors duration-200',
                        over ? 'border-overload bg-overload/14' : first ? 'border-fog-3 bg-card' : 'border-border bg-card',
                      ].join(' ')}
                    >
                      <div className="flex h-4 items-center justify-between text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                        <span>{first ? 'This week' : `Week ${c.bucket.index + 1}`}</span>
                        {over && <TriangleAlert className="size-3.5 text-overload" aria-label="Over capacity" />}
                      </div>
                      <div className="mt-0.5 text-[13px] font-medium tabular-nums">{c.label}</div>
                      <div className="text-[12px] text-muted-foreground tabular-nums">
                        {formatHours(c.bucket.load_hours)} of {formatHours(c.bucket.capacity_hours)} h
                      </div>
                      <div className="mt-1.5 h-5">
                        {c.busyLabel && (
                          <span className="inline-block max-w-full truncate whitespace-nowrap rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground" title={c.busyLabel}>
                            {c.busyLabel}
                          </span>
                        )}
                      </div>
                      <div className="relative mt-1.5 flex flex-col-reverse gap-px" style={{ height: PLOT_H }}>
                        {c.segments.map((s, i) => (
                          <div
                            key={`${s.id}-${i}`}
                            title={`${s.title}: ${formatHours(s.hours)} h${s.overflow ? ' over capacity' : ''}`}
                            className={[
                              'overflow-hidden rounded-[3px] px-1 text-[11px] leading-tight transition-[height] duration-[240ms] ease-out',
                              s.overflow ? 'overflow-hatch border border-overload text-foreground' : 'bg-fog-2 text-ink',
                            ].join(' ')}
                            style={{ height: Math.max(2, px(s.hours) - 1) }}
                          >
                            {px(s.hours) >= 16 && <span className="block truncate font-medium">{formatHours(s.hours)} h · {s.title}</span>}
                          </div>
                        ))}
                        <div
                          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-fog-3"
                          style={{ bottom: px(c.bucket.capacity_hours) }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-2 min-h-[18px] space-y-0.5 text-[11px] text-muted-foreground">
                        {c.deadlineIds.map((id) => (
                          <div key={id} className="flex items-center gap-1 truncate text-foreground" title={`${titles[id] ?? id} due`}>
                            <Flag className="size-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{titles[id] ?? id}</span>
                          </div>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
            {moreRight && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-end bg-gradient-to-l from-background to-transparent pr-1" aria-hidden="true">
                <ChevronsRight className="size-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[2px] bg-fog-2" aria-hidden="true" />Planned hours</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0 w-4 border-t border-dashed border-fog-3" aria-hidden="true" />Hours available that week</span>
            <span className="inline-flex items-center gap-1.5"><span className="overflow-hatch h-2.5 w-4 rounded-[2px] border border-overload" aria-hidden="true" />Over capacity</span>
            <span className="inline-flex items-center gap-1.5"><Flag className="size-3" aria-hidden="true" />Deadline</span>
            <span className="inline-flex items-center gap-1.5"><span className="rounded-full border border-border bg-secondary px-1.5 text-[10px]" aria-hidden="true">Exams</span>Busy days (fewer hours)</span>
            {moreRight && <span className="ml-auto">Scroll for later weeks</span>}
          </div>
          <div role="status" aria-live="polite" className="space-y-2">
            {red.map((c) => (
              <p key={c.bucket.index} className="flex max-w-[68ch] items-start gap-2 text-[15px]">
                <TriangleAlert className="mt-1 size-4 shrink-0 text-overload" aria-hidden="true" />
                <span><span className="font-medium tabular-nums">Week of {c.label}:</span> {c.overloadSentence}</span>
              </p>
            ))}
          </div>
          <p className="text-[13px] text-muted-foreground">The week a deadline falls in counts in full.</p>
        </>
      )}
    </section>
  )
}
