import type { ReactNode } from 'react'
import { shortDate } from '@/lib/exit-reason'
import { formatHours, formatRange, relativeDays, type PlanSummary as PlanSummaryModel } from '@/lib/tool-view'

function Cell({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="cell">
      <p className="k">{label}</p>
      <p className="v">{value}</p>
      {detail && <p className="s">{detail}</p>}
    </div>
  )
}

/** The first four cells of the plan summary grid (the this-week cells follow). */
export function PlanSummary({ summary }: { summary: PlanSummaryModel }) {
  const { committedCount, committableCount, committedHours, nextDeadline, nextBusy } = summary
  return (
    <>
      <Cell
        label="Committed"
        value={<>{committedCount} <span className="sub">of {committableCount} you can do</span></>}
        detail={committedCount === 0 ? 'Pick from Focus or Consider below' : committedCount === 1 ? '1 opportunity on your plan' : `${committedCount} opportunities on your plan`}
      />
      <Cell label="Work committed" value={<span className="mono">{formatHours(committedHours)} h</span>} detail="Estimated, across all deadlines" />
      <Cell
        label={committedCount > 0 ? 'Next deadline' : 'Earliest open deadline'}
        value={nextDeadline ? <>{shortDate(nextDeadline.date)} <span className="sub">{relativeDays(nextDeadline.daysLeft)}</span></> : 'None'}
        detail={nextDeadline?.title}
      />
      <Cell
        label="Next busy period"
        value={nextBusy ? nextBusy.label : 'None set'}
        detail={nextBusy ? `${formatRange(nextBusy.start, nextBusy.end)} · ${nextBusy.daysUntil === 0 ? 'now' : relativeDays(nextBusy.daysUntil)}` : 'Add exams or travel in Profile'}
      />
    </>
  )
}
