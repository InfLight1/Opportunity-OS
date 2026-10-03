import type { Asset, BusyPeriod, Tag, TieredOpportunity } from '../engine/types'
import { formatExitReason, heldTagsOf } from './exit-reason'

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

export type StoryPileCard = { id: string; title: string; deadline: string; effortHours: number }

export type StoryData = {
  total: number
  remaining: number
  weeklyCapacityHours: number
  totalEffortHours: number   // sum of every entry's effort estimate (hero hook)
  titles: string[]
  pile: StoryPileCard[]      // every entry, dataset order (hero card pile)
  exits: StoryExit[]
  reuseFan: StoryReuseFan | null
}

export { shortDate, humanTag } from './exit-reason'

/** One short line for a SKIP card (see exit-reason.ts); null when not SKIP. */
export function shortExitReason(t: TieredOpportunity, profile: StoryProfile, today: string): string | null {
  return formatExitReason(t, {
    grade: profile.grade,
    region: profile.region,
    heldTags: heldTagsOf(profile.assets),
    weeklyCapacityHours: profile.weekly_capacity_hours,
    busyWeeks: profile.busy_weeks,
  }, today)
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
    totalEffortHours: tiered.reduce((n, t) => n + (t.opportunity.effort_hours > 0 ? t.opportunity.effort_hours : 0), 0),
    titles: tiered.map(t => t.opportunity.title),
    pile: tiered.map(t => ({ id: t.opportunity.id, title: t.opportunity.title, deadline: t.opportunity.deadline, effortHours: t.opportunity.effort_hours })),
    exits,
    reuseFan: buildReuseFan(tiered, assets),
  }
}
