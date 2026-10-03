import type { Asset, BusyPeriod, Tag, TieredOpportunity } from '../engine/types'
import { availableHours } from '../engine/buckets'

// --- Story data (Plan s6 beats 0, 1, 3) ---
// Live numbers for the Story; copy stays hand-written in the components.

export type StoryProfile = {
  grade: number
  region: string
  weekly_capacity_hours: number
  busy_weeks: BusyPeriod[]
  assets: Asset[]
}

export type StoryExit = { id: string; title: string; reason: string }

export type StoryReuseFan = {
  project: { id: string; title: string }
  targets: { id: string; title: string; matchedTags: Tag[] }[]
}

export type StoryData = {
  total: number
  remaining: number
  weeklyCapacityHours: number
  titles: string[]
  exits: StoryExit[]
  reuseFan: StoryReuseFan | null
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

function heldTags(assets: Asset[]): Set<Tag> {
  const held = new Set<Tag>()
  for (const a of assets) for (const t of a.tags) held.add(t)
  return held
}

/**
 * One short line for a SKIP card, checked in the engine's order: grade,
 * deadline, location, prerequisites, no required-tag match, runway.
 * Returns null for items that are not SKIP.
 */
export function shortExitReason(t: TieredOpportunity, profile: StoryProfile, today: string): string | null {
  if (t.tier !== 'SKIP') return null
  const o = t.opportunity
  const { min, max } = o.grade_range
  if (profile.grade < min || profile.grade > max) {
    return min === max ? `Grade ${min} only` : `Grades ${min}-${max} only`
  }
  if (o.deadline < today) return `Closed ${shortDate(o.deadline)}`
  if (!o.location.remote_ok && o.location.region && o.location.region !== profile.region) {
    return `${o.location.region} only`
  }
  const held = heldTags(profile.assets)
  const missingPrereqs = o.prerequisites.filter(p => !held.has(p))
  if (missingPrereqs.length > 0) return `Needs ${missingPrereqs.map(humanTag).join(', ')}`
  if (t.match.matched_required.length === 0) {
    return o.required_tags.length > 0 ? `Needs ${o.required_tags.map(humanTag).join(', ')}` : 'No matching project'
  }
  const available = availableHours(o.deadline, today, profile.weekly_capacity_hours, profile.busy_weeks)
  return `Needs ${o.effort_hours} h, ${available} h left`
}

/** The asset with the most pursuable (FOCUS/CONSIDER) supports; ties keep asset order. */
export function buildReuseFan(tiered: TieredOpportunity[], assets: Asset[]): StoryReuseFan | null {
  const byId = new Map(tiered.map(t => [t.opportunity.id, t]))
  let best: StoryReuseFan | null = null
  for (const a of assets) {
    const tags = new Set(a.tags)
    const targets: StoryReuseFan['targets'] = []
    for (const id of a.supports) {
      const t = byId.get(id)
      if (!t || t.tier === 'SKIP') continue
      const o = t.opportunity
      const matchedTags = [...o.required_tags, ...o.helpful_tags].filter((tag, i, all) => tags.has(tag) && all.indexOf(tag) === i)
      targets.push({ id, title: o.title, matchedTags })
    }
    if (targets.length > 0 && (best === null || targets.length > best.targets.length)) {
      best = { project: { id: a.id, title: a.title }, targets }
    }
  }
  return best
}

export function buildStoryData(
  tiered: TieredOpportunity[],
  assets: Asset[],
  profile: StoryProfile,
  today: string,
): StoryData {
  const exits: StoryExit[] = []
  for (const t of tiered) {
    const reason = shortExitReason(t, profile, today)
    if (reason !== null) exits.push({ id: t.opportunity.id, title: t.opportunity.title, reason })
  }
  return {
    total: tiered.length,
    remaining: tiered.length - exits.length,
    weeklyCapacityHours: profile.weekly_capacity_hours,
    titles: tiered.map(t => t.opportunity.title),
    exits,
    reuseFan: buildReuseFan(tiered, assets),
  }
}
