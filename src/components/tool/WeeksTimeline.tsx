import { Flag, TriangleAlert } from 'lucide-react'
import { formatHours, type TimelineColumn } from '@/lib/tool-view'

export interface WeeksTimelineProps {
  columns: TimelineColumn[]
  hasCommits: boolean
  titles: Record<string, string>
  previewHours: number | null
}

const PLOT_H = 168

export function WeeksTimeline({ columns, hasCommits, titles, previewHours }: WeeksTimelineProps) {
  const scale = Math.max(1, ...columns.map((c) => Math.max(c.bucket.capacity_hours, c.bucket.load_hours)))
  const px = (h: number) => (h / scale) * PLOT_H
  const red = columns.filter((c) => c.overloadSentence)

  return (
    <section aria-labelledby="weeks" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="weeks" className="text-[28px] font-semibold leading-[1.2] tracking-[-0.01em]">Your weeks</h2>
        {previewHours !== null && (
          <p className="text-[13px] text-muted-foreground tabular-nums">Preview at {formatHours(previewHours)} h a week, not saved</p>
        )}
      </div>
      {!hasCommits ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-muted-foreground">Commit an opportunity to see when to work on it.</p>
      ) : (
        <>
          <div className="overflow-x-auto pb-2">
            <ol className="flex gap-2" aria-label="Weeks from today">
              {columns.map((c) => {
                const over = c.bucket.overloaded
                return (
                  <li
                    key={c.bucket.index}
                    className={[
                      'flex w-[128px] shrink-0 flex-col rounded-lg border p-2 transition-colors duration-200',
                      over ? 'border-overload bg-overload/14' : 'border-border bg-card',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between text-[12px] tabular-nums">
                      <span className="font-medium">{c.label}</span>
                      {over && <TriangleAlert className="size-3.5 text-overload" aria-label="Over capacity" />}
                    </div>
                    <div className="text-[12px] text-muted-foreground tabular-nums">
                      {formatHours(c.bucket.load_hours)} of {formatHours(c.bucket.capacity_hours)} h
                    </div>
                    <div className={`relative mt-2 flex flex-col-reverse gap-px ${c.busyLabel ? 'busy-stripes' : ''}`} style={{ height: PLOT_H }}>
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
                    <div className="mt-2 min-h-[32px] space-y-0.5 text-[11px] text-muted-foreground">
                      {c.busyLabel && <div>{c.busyLabel}</div>}
                      {c.deadlineIds.map((id) => (
                        <div key={id} className="flex items-center gap-1 truncate" title={`${titles[id] ?? id} due`}>
                          <Flag className="size-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{titles[id] ?? id} due</span>
                        </div>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
          <div role="status" aria-live="polite" className="space-y-2">
            {red.map((c) => (
              <p key={c.bucket.index} className="flex max-w-[68ch] items-start gap-2 text-[15px]">
                <TriangleAlert className="mt-1 size-4 shrink-0 text-overload" aria-hidden="true" />
                <span><span className="font-medium tabular-nums">Week of {c.label}:</span> {c.overloadSentence}</span>
              </p>
            ))}
          </div>
          <p className="text-[13px] text-muted-foreground">
            Each column is 7 days from today, filled back from each deadline. The week a deadline falls in counts in full.
          </p>
        </>
      )}
    </section>
  )
}
