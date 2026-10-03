import { ArrowRight } from 'lucide-react'
import type { ThisWeekModel } from '@/lib/tool-view'
import { formatHours } from '@/lib/tool-view'

export interface ThisWeekStripProps {
  week: ThisWeekModel
  nextAction: { text: string; opportunityId: string } | null
}

const MAX_BLOCKS = 40

export function ThisWeekStrip({ week, nextAction }: ThisWeekStripProps) {
  // One block per hour (counts, never a percent bar). Over-capacity hours get a red outline.
  const total = Math.min(MAX_BLOCKS, Math.ceil(Math.max(week.capacityHours, week.loadHours)))
  const filled = Math.ceil(week.loadHours)
  const cap = Math.ceil(week.capacityHours)
  return (
    <section aria-labelledby="this-week" className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="this-week" className="text-[18px] font-semibold">This week <span className="font-normal text-muted-foreground tabular-nums">({week.label})</span></h2>
        <p className="text-[15px] tabular-nums">
          <span className="font-semibold">{formatHours(week.loadHours)} h</span>
          <span className="text-muted-foreground"> of {formatHours(week.capacityHours)} h planned</span>
        </p>
      </div>
      {total > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={[
                'h-4 w-6 rounded-[3px] border',
                i < filled ? 'border-fog-2 bg-fog-2' : 'border-border bg-transparent',
                i >= cap ? 'border-overload' : '',
              ].join(' ')}
            />
          ))}
        </div>
      )}
      <div className="mt-4 flex items-start gap-3 rounded-lg border-l-2 border-fog-1 bg-secondary px-4 py-3">
        <ArrowRight className="mt-1 size-4 shrink-0 text-fog-1" aria-hidden="true" />
        <p className="max-w-[68ch] text-[15px]">
          <span className="mr-2 text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Next step</span>
          {nextAction ? nextAction.text : 'Add a project to your profile to get a next step.'}
        </p>
      </div>
    </section>
  )
}
