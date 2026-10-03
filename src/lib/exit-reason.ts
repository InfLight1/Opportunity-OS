import type { BusyPeriod, Tag, TieredOpportunity } from '../engine/types'
import { availableHours } from '../engine/buckets'

// --- Short human reasons for SKIP entries (Story exits, locked cards) ---
// Checks run in the engine's order: grade, deadline, location, prerequisites,
// no required-tag match, runway. Pure; numbers come from the engine helpers.

export type ExitContext = {
  grade: number
  region: string
  heldTags: Set<Tag>
  weeklyCapacityHours: number
  busyWeeks: BusyPeriod[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** '2026-09-09' -> 'Sep 9' (no Intl, deterministic). */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}

/** 'research-writing' -> 'research writing'. */
export function humanTag(tag: Tag): string {
  return tag.replace('submission-format:', '').replace(/-/g, ' ')
}

export function heldTagsOf(assets: { tags: Tag[] }[]): Set<Tag> {
  const held = new Set<Tag>()
  for (const a of assets) for (const t of a.tags) held.add(t)
  return held
}

/** One short line ("Grade 11-12 only", "Closed Sep 9"); null when not SKIP. */
export function formatExitReason(t: TieredOpportunity, ctx: ExitContext, today: string): string | null {
  if (t.tier !== 'SKIP') return null
  const o = t.opportunity
  const { min, max } = o.grade_range
  if (ctx.grade < min || ctx.grade > max) return min === max ? `Grade ${min} only` : `Grade ${min}-${max} only`
  if (o.deadline < today) return `Closed ${shortDate(o.deadline)}`
  if (!o.location.remote_ok && o.location.region && o.location.region !== ctx.region) return `${o.location.region} only`
  const missingPrereqs = o.prerequisites.filter(p => !ctx.heldTags.has(p))
  if (missingPrereqs.length > 0) return `Needs ${missingPrereqs.map(humanTag).join(', ')}`
  if (t.match.matched_required.length === 0) {
    return o.required_tags.length > 0 ? `Needs ${o.required_tags.map(humanTag).join(', ')}` : 'No matching project'
  }
  const available = availableHours(o.deadline, today, ctx.weeklyCapacityHours, ctx.busyWeeks)
  return `Needs ${o.effort_hours} h, ${available} h available by ${shortDate(o.deadline)}`
}
