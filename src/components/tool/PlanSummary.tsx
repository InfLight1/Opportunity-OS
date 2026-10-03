import { CalendarClock, CircleCheck, Clock, Moon } from 'lucide-react'
import type { ReactNode } from 'react'
import { shortDate } from '@/lib/exit-reason'
import { formatHours, formatRange, relativeDays, type PlanSummary as PlanSummaryModel } from '@/lib/tool-view'

function Tile({ icon, label, value, detail }: { icon: ReactNode; label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {icon}{label}
      </p>
      <p className="truncate text-[18px] font-semibold leading-tight tabular-nums">{value}</p>
      {detail && <p className="truncate text-[13px] text-muted-foreground tabular-nums">{detail}</p>}
    </div>
  )
}

export function PlanSummary({ summary }: { summary: PlanSummaryModel }) {
  const { committedCount, committableCount, committedHours, nextDeadline, nextBusy } = summary
  const iconCls = 'size-3.5'
  return (
    <div className="grid grid-cols-4 gap-3" aria-label="Plan at a glance">
      <Tile
        icon={<CircleCheck className={iconCls} aria-hidden="true" />}
        label="Committed"
        value={<>{committedCount} <span className="text-[15px] font-normal text-muted-foreground">of {committableCount} you can do</span></>}
        detail={committedCount === 0 ? 'Pick from Focus or Consider below' : committedCount === 1 ? '1 opportunity on your plan' : `${committedCount} opportunities on your plan`}
      />
      <Tile
        icon={<Clock className={iconCls} aria-hidden="true" />}
        label="Work committed"
        value={`${formatHours(committedHours)} h`}
        detail="Estimated, across all deadlines"
      />
      <Tile
        icon={<CalendarClock className={iconCls} aria-hidden="true" />}
        label={committedCount > 0 ? 'Next deadline' : 'Earliest open deadline'}
        value={nextDeadline ? `${shortDate(nextDeadline.date)} · ${relativeDays(nextDeadline.daysLeft)}` : 'None'}
        detail={nextDeadline?.title}
      />
      <Tile
        icon={<Moon className={iconCls} aria-hidden="true" />}
        label="Next busy period"
        value={nextBusy ? nextBusy.label : 'None set'}
        detail={nextBusy ? `${formatRange(nextBusy.start, nextBusy.end)} · ${nextBusy.daysUntil === 0 ? 'now' : relativeDays(nextBusy.daysUntil)}` : 'Add exams or travel in Profile'}
      />
    </div>
  )
}
