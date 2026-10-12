import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
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

const PLOT_H = 84

// Weeks are stops on a route: five per row (two on narrow screens), never a side scroll.
export function WeeksTimeline({ columns, hasCommits, titles, previewHours, controls }: WeeksTimelineProps) {
  const scale = Math.max(1, ...columns.map((c) => Math.max(c.bucket.capacity_hours, c.bucket.load_hours)))
  const px = (h: number) => (h / scale) * PLOT_H
  const red = columns.filter((c) => c.overloadSentence)

  return (
    <section id="weeks-section" aria-labelledby="weeks" className="psec">
      <div className="wrap">
        <SectionHeader
          id="weeks"
          eyebrow="Backward from each deadline"
          title="Your weeks"
          description="Each column is 7 days from today. Hours fill the deadline week first, then earlier weeks."
          aside={previewHours !== null && (
            <span className="preview-pill mono">Preview at {formatHours(previewHours)} h a week, not saved</span>
          )}
        />
        {controls}
        {!hasCommits ? (
          <p className="empty">Commit an opportunity to see when to work on it.</p>
        ) : (
          <>
            <ol className="weeks" aria-label="Weeks from today">
              {columns.map((c) => {
                const over = c.bucket.overloaded
                const first = c.bucket.index === 0
                const cls = ['wk', first ? 'now' : '', c.deadlineIds.length > 0 ? 'dl' : '', c.busyLabel ? 'busy' : '', over ? 'over' : ''].join(' ')
                return (
                  <li key={c.bucket.index} className={cls}>
                    <div className="head">
                      <span className="lab">{first ? 'This week' : `Week ${c.bucket.index + 1}`}</span>
                      {over && <TriangleAlert className="size-4 text-[var(--nr-orange)]" aria-label="Over capacity" />}
                    </div>
                    <span className="dates">{c.label}</span>
                    <div className="bar" aria-hidden="true">
                      <span className="cap" style={{ height: px(c.bucket.capacity_hours) }} />
                      {c.segments.map((s, i) => (
                        <span key={`${s.id}-${i}`} className={`seg ${s.overflow ? 'overflow' : ''}`} style={{ height: Math.max(2, px(s.hours)) }} />
                      ))}
                    </div>
                    <span className="hrs">{formatHours(c.bucket.load_hours)} <span>of {formatHours(c.bucket.capacity_hours)} h</span></span>
                    {c.busyLabel && <span className="busy-note">{c.busyLabel}</span>}
                    {c.segments.map((s, i) => (
                      <span key={`t-${s.id}-${i}`} className={`item ${s.overflow ? 'overflow' : ''}`}>
                        <b>{formatHours(s.hours)} h</b> {s.title}{s.overflow ? ', over capacity' : ''}
                      </span>
                    ))}
                    {c.deadlineIds.map((id) => <span key={id} className="dlm">Deadline: {titles[id] ?? id}</span>)}
                  </li>
                )
              })}
            </ol>
            <ul className="legend">
              <li><span className="sw plan" aria-hidden="true" />Planned hours</li>
              <li><span className="sw cap" aria-hidden="true" />Hours available that week</li>
              <li><span className="sw over" aria-hidden="true" />Over capacity</li>
              <li><span className="sw dl" aria-hidden="true" />Deadline</li>
              <li><span className="sw busy" aria-hidden="true" />Busy days (fewer hours)</li>
            </ul>
            <div role="status" aria-live="polite" className="overload-list">
              {red.map((c) => (
                <p key={c.bucket.index} className="warn">
                  <b>Week of {c.label}:</b> {c.overloadSentence}
                </p>
              ))}
            </div>
            <p className="foot-note">The week a deadline falls in counts in full.</p>
          </>
        )}
      </div>
    </section>
  )
}
