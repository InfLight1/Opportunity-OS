import type { Asset, BusyPeriod, TieredOpportunity } from '../engine/types'
import { availableHours } from '../engine/buckets'
import { formatExitReason, heldTagsOf, humanTag, shortDate } from './exit-reason'
import { formatHours } from './tool-view'

// --- Ask why: template text from structured engine facts (shown instantly) ---
// The optional LLM rewrite swaps in later; this text is the fallback and the
// only source of facts. No scores, no percentages.

export type AskWhyContext = {
  grade: number
  region: string
  weeklyCapacityHours: number
  busyWeeks: BusyPeriod[]
  assets: Asset[]
  tiered: TieredOpportunity[]
}

function list(xs: string[]): string {
  if (xs.length <= 1) return xs.join('')
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
}

export function askWhyTemplate(t: TieredOpportunity, ctx: AskWhyContext, today: string): string {
  const o = t.opportunity
  if (t.tier === 'SKIP') {
    const reason = formatExitReason(t, {
      grade: ctx.grade, region: ctx.region, heldTags: heldTagsOf(ctx.assets),
      weeklyCapacityHours: ctx.weeklyCapacityHours, busyWeeks: ctx.busyWeeks,
    }, today)
    return `Not now: ${reason ?? 'it does not pass the rules'}. The rules check grade, deadline, location, what your projects show, and whether the hours fit before the deadline.`
  }

  const parts: string[] = []
  const tags = [...t.match.matched_required, ...t.match.matched_helpful].filter((x, i, all) => all.indexOf(x) === i)
  const projects = ctx.assets.filter(a => a.supports.includes(o.id)).map(a => a.title)
  if (projects.length > 0) parts.push(`${list(projects)} shows ${list(tags.map(humanTag))}, which ${o.title} asks for.`)
  const available = availableHours(o.deadline, today, ctx.weeklyCapacityHours, ctx.busyWeeks)
  parts.push(`It needs about ${formatHours(o.effort_hours)} h, and you have ${formatHours(available)} h before ${shortDate(o.deadline)} at ${formatHours(ctx.weeklyCapacityHours)} h a week.`)

  const held = heldTagsOf(ctx.assets)
  const missing = o.required_tags.filter(tag => !held.has(tag))
  if (t.tier === 'FOCUS') {
    const others = ctx.tiered
      .filter(x => x.opportunity.id !== o.id && x.tier !== 'SKIP' && ctx.assets.some(a => a.supports.includes(o.id) && a.supports.includes(x.opportunity.id)))
      .map(x => x.opportunity.title)
    parts.push(missing.length === 0
      ? 'Focus: nothing it asks for is missing, and the deadline is outside your busy periods.'
      : 'Focus: the same project also counts for other opportunities, and the deadline is outside your busy periods.')
    if (others.length > 0) parts.push(`The same work also counts for ${list(others)}.`)
  } else {
    const why: string[] = []
    if (t.has_busy_week_collision) {
      const bw = ctx.busyWeeks.find(b => b.start && b.end && o.deadline >= b.start && o.deadline <= b.end)
      why.push(`it is due during ${bw?.label || 'a busy period'}`)
    }
    if (missing.length > 0) why.push(`no project shows ${list(missing.map(humanTag))} yet`)
    parts.push(`Consider, not Focus: ${why.length > 0 ? list(why) : 'it matches, but not strongly enough for Focus'}.`)
  }
  return parts.join(' ')
}
