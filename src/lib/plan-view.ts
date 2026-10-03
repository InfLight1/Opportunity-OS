import type { Plan as EnginePlan } from '../engine/types'

export interface PlanRow {
  id: string
  title: string
  tier: 'FOCUS' | 'CONSIDER' | 'SKIP'
  deadline: string
  effort_hours: number
  reasons: string[]
  busy_week_note?: string
}

/**
 * Builds ordered rows from the engine Plan for the Plan tab display.
 * Order: FOCUS first, then CONSIDER, then SKIP (expanded section).
 */
export function buildPlanView(plan: EnginePlan): PlanRow[] {
  const rows: PlanRow[] = []

  for (const t of plan.tiered_opportunities) {
    const reasons: string[] = []
    if (t.match && t.match.reason) {
      reasons.push(t.match.reason)
    }

    let busyNote: string | undefined
    if (t.has_busy_week_collision && t.opportunity.deadline) {
      for (const bw of plan.busy_weeks) {
        if (bw.start && bw.end && t.opportunity.deadline >= bw.start && t.opportunity.deadline <= bw.end) {
          busyNote = `Collision: ${bw.label || 'busy period'}`
          break
        }
      }
    }

    rows.push({
      id: t.opportunity.id,
      title: t.opportunity.title,
      tier: t.tier,
      deadline: t.opportunity.deadline,
      effort_hours: t.opportunity.effort_hours,
      reasons,
      busy_week_note: busyNote,
    })
  }

  // Stable order: FOCUS first, then CONSIDER, then SKIP
  const tierOrder = { FOCUS: 0, CONSIDER: 1, SKIP: 2 } as Record<string, number>
  rows.sort((a, b) => (tierOrder[a.tier] ?? 3) - (tierOrder[b.tier] ?? 3))

  return rows
}
