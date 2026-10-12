import type { ThisWeekModel } from '@/lib/tool-view'
import { formatHours } from '@/lib/tool-view'

export interface ThisWeekStripProps {
  week: ThisWeekModel
  nextAction: { text: string; opportunityId: string } | null
}

/** The last two cells of the plan summary grid: this week's hours and the next step. */
export function ThisWeekStrip({ week, nextAction }: ThisWeekStripProps) {
  return (
    <>
      <section aria-labelledby="this-week" className="cell">
        <h2 id="this-week" className="k" style={{ fontSize: 15, fontWeight: 400, letterSpacing: 0, lineHeight: 1.6 }}>This week, <span className="mono">{week.label}</span></h2>
        <p className="v">
          <span className="mono" style={week.overloaded ? { color: 'var(--nr-orange-hi)' } : undefined}>{formatHours(week.loadHours)} h</span>
          <span className="sub">of {formatHours(week.capacityHours)} h planned</span>
        </p>
      </section>
      <div className="cell next">
        <p className="k">Next step</p>
        <p className="v">{nextAction ? nextAction.text : 'Add a project to your profile to get a next step.'}</p>
      </div>
    </>
  )
}
