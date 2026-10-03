import type { Asset, BusyPeriod, InterestTag, MatchResult, Opportunity, Plan, Profile, SkillTag, Tag, TieredOpportunity } from './types'
import { isEligible, filterEligibility, matchTags } from './eligibility'
import { buildAssetsWithSupports } from './reuse'
import { detectCollisions } from './collision'
import { tierAll } from './tier'
import { availableHours, completeBusyPeriods } from './buckets'
import { buildPlan as runBuildPlan } from './plan'

export interface ProfileInput {
  name: string
  grade: number
  region: string
  interests: InterestTag[]
  skills: SkillTag[]
  assets: Asset[]
  weekly_capacity_hours: number
  busy_weeks: BusyPeriod[]
}

export interface RunEngineResult {
  plan: Plan
  assets: Asset[]
}

function buildReasonForTiered(tiered: TieredOpportunity, eligReasonMap: Map<string, string>, busyWeeksArg: BusyPeriod[], capacity: number, today: string): string {
  const opp = tiered.opportunity

  if (!tiered.eligible) {
    return `Eligibility: ${eligReasonMap.get(opp.id) || 'failed check'}`
  }

  const addElig = (core: string): string => `${core} | Eligibility: ${eligReasonMap.get(opp.id) || ''}`

  // Same order as computeTier: zero required match, then runway.
  if (tiered.match.matched_required.length === 0) {
    return addElig(`No required-tag match (${opp.required_tags.join(', ')})`)
  }

  const available = availableHours(opp.deadline, today, capacity, busyWeeksArg)
  if (opp.effort_hours > available) {
    return addElig(`Needs ${opp.effort_hours}h; only ${available}h available before ${opp.deadline} at ${capacity}h/week`)
  }

  // Check busy-week collision: deadline within any busy period bounds
  if (tiered.has_busy_week_collision && tiered.tier !== 'FOCUS') {
    for (const bw of busyWeeksArg) {
      if (opp.deadline >= bw.start && opp.deadline <= bw.end) {
        return addElig(`Busy week collision: ${bw.label || 'busy period'}`)
      }
    }
  }

  // FOCUS reason with matched tags and reuse count
  if (tiered.tier === 'FOCUS') {
    const tags = tiered.match.matched_required.join(', ')
    return addElig(`Matched: ${tags}, reuse count: ${tiered.reuse_count}`)
  }

  // CONSIDER with matched info
  return addElig(`Matched: ${tiered.match.matched_required.join(', ')}`)
}

export function runEngine(
  input: ProfileInput,
  opportunities: Opportunity[],
  today: string,
): RunEngineResult {
  const busyWeeks = completeBusyPeriods(input.busy_weeks)

  // Build real Profile object for isEligible / matchTags
  const profile: Profile = {
    name: input.name,
    grade: input.grade,
    region: input.region,
    interests: input.interests,
    skills: input.skills,
    assets: input.assets as Asset[],
    weekly_capacity_hours: input.weekly_capacity_hours,
    busy_weeks: input.busy_weeks,
  }

  // Step 2 eligibility check for every opportunity
  const eligibleOpps: Opportunity[] = []
  const eligibilityMap = new Map<string, boolean>()
  const eligibilityReason = new Map<string, string>()

  for (const opp of opportunities) {
    const yes = isEligible(profile, opp, today)
    eligibilityMap.set(opp.id, yes)
    const eligResult = filterEligibility(profile, opp, today)
    eligibilityReason.set(opp.id, eligResult.reason)
    if (yes) {
      eligibleOpps.push(opp)
    }
  }

  // Step 3 tag matching over eligible opportunities only
  const matchMap = new Map<string, MatchResult>()

  for (const opp of eligibleOpps) {
    const result = matchTags(profile, opp)
    if (result.matched_required.length >= 1 || result.helpful_match_count >= 2) {
      matchMap.set(opp.id, result)
    }
  }

  // Step 4 build asset supports over eligible AND matching opps only
  const supportingAssets = buildAssetsWithSupports(input.assets, [...eligibleOpps].filter(e => matchMap.has(e.id)))

  // compute per-asset reuse_count = supports.length
  supportingAssets.forEach(a => { a.reuse_count = a.supports.length })

  // Step 5 gather all asset tags once for gap counting
  const allAssetTagSet = new Set<Tag>()
  for (const a of supportingAssets) {
    for (const t of a.tags) {
      allAssetTagSet.add(t)
    }
  }

  // per-opportunity max-reuse
  function computeOppReuse(opp: Opportunity): number {
    let maxReuse = 0
    for (const a of supportingAssets) {
      if (a.supports.indexOf(opp.id) !== -1) {
        if (a.reuse_count > maxReuse) maxReuse = a.reuse_count
      }
    }
    return maxReuse
  }

  // gap_count = required_tags absent from all assets
  function computeGapCount(opp: Opportunity): number {
    let count = 0
    for (const tag of opp.required_tags) {
      if (!allAssetTagSet.has(tag)) count++
    }
    return count
  }

  // Build TieredOpportunity array with fresh match objects per opportunity
  const tieredOpps: TieredOpportunity[] = opportunities.map(opp => {
    const eligible = eligibilityMap.get(opp.id) === true
    let match: MatchResult
    if (eligible && matchMap.has(opp.id)) {
      const src = matchMap.get(opp.id)!
      match = { matched_required: [...src.matched_required], helpful_match_count: src.helpful_match_count, matched_helpful: [...src.matched_helpful], gap_count: src.gap_count, reason: '' }
    } else {
      match = { matched_required: [], helpful_match_count: 0, matched_helpful: [], gap_count: 0, reason: '' }
    }

    return {
      opportunity: opp,
      tier: 'CONSIDER' as const,
      match,
      reuse_count: 0,
      gap_count: computeGapCount(opp),
      has_busy_week_collision: false,
      eligible,
    }
  })

  // Set reuse_count per tiered opp (max supports.length among supporting assets)
  for (const t of tieredOpps) {
    if (!t.eligible) continue
    t.reuse_count = computeOppReuse(t.opportunity)
  }

  // Step 6 detect collisions, tier
  detectCollisions(tieredOpps, busyWeeks)
  tierAll(tieredOpps, input.weekly_capacity_hours, today, busyWeeks)

  // Build reason strings AFTER tiering so they reflect final tier state
  const capacity = input.weekly_capacity_hours
  for (const t of tieredOpps) {
    t.match.reason = buildReasonForTiered(t, eligibilityReason, busyWeeks, capacity, today)
  }

  const plan = runBuildPlan(tieredOpps, supportingAssets, input.weekly_capacity_hours, busyWeeks)

  return { plan, assets: supportingAssets }
}
