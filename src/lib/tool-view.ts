import type { Asset, BusyPeriod, CommitState, OpportunityTier, Plan, Schedule, Tag, TieredOpportunity, WeekBucket } from '../engine/types'
import { addDays, daysBetween } from '../engine/buckets'
import { isCommittable, isCommitted } from './commit-state'
import { formatExitReason, heldTagsOf, humanTag, shortDate, type ExitContext } from './exit-reason'

// --- Tool view models (DESIGN-BRIEF s5/s6) ---
// Components only map these to JSX. No reason here repeats the engine's
// "reuse count" (it includes SKIP entries); reuse is shown in the web instead.

export type ScheduleBucket = Schedule['buckets'][number]

export interface OpportunityCardModel {
  id: string
  title: string
  organization: string
  sourceUrl: string
  tier: OpportunityTier
  deadline: string
  daysLeft: number
  expired: boolean
  effortHours: number
  reasons: string[]
  committable: boolean
  lockReason: string | null
  committed: boolean
  startByBucketStart: string | null
  userAdded: boolean
}

export type ToolProfile = { grade: number; region: string; weeklyCapacityHours: number; busyWeeks: BusyPeriod[] }

export const TIER_WORD: Record<OpportunityTier, string> = { FOCUS: 'Focus', CONSIDER: 'Consider', SKIP: 'Not now' }

/** 6 -> '6', 6.5 -> '6.5', 0.1+0.2 -> '0.3' */
export function formatHours(h: number): string {
  return String(Math.round(h * 10) / 10)
}

/** 'Oct 3-9', 'Oct 31-Nov 6'. */
export function formatRange(start: string, end: string): string {
  const [sm] = shortDate(start).split(' ')
  const [em, ed] = shortDate(end).split(' ')
  return sm === em ? `${shortDate(start)}-${ed}` : `${shortDate(start)}-${em} ${ed}`
}

/** 'today', 'tomorrow', 'in 23 days', 'closed 24 days ago'. */
export function relativeDays(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days > 1) return `in ${days} days`
  return days === -1 ? 'closed yesterday' : `closed ${-days} days ago`
}

function exitContext(profile: ToolProfile, assets: Asset[]): ExitContext {
  return {
    grade: profile.grade,
    region: profile.region,
    heldTags: heldTagsOf(assets),
    weeklyCapacityHours: profile.weeklyCapacityHours,
    busyWeeks: profile.busyWeeks,
  }
}

/** Short reason why a card cannot be committed; null when it can. */
export function cardLockReason(t: TieredOpportunity, profile: ToolProfile, assets: Asset[], today: string): string | null {
  if (isCommittable(t, today)) return null
  return formatExitReason(t, exitContext(profile, assets), today) ?? 'Needs a deadline and an effort estimate'
}

function unique<T>(xs: T[]): T[] {
  return xs.filter((x, i) => xs.indexOf(x) === i)
}

/** Human reason lines from structured engine facts (never the raw reason string). */
export function cardReasons(t: TieredOpportunity, profile: ToolProfile, assets: Asset[], today: string): string[] {
  if (t.tier === 'SKIP') {
    const r = formatExitReason(t, exitContext(profile, assets), today)
    return r ? [r] : []
  }
  const o = t.opportunity
  const held = heldTagsOf(assets)
  const lines: string[] = []
  const shown = unique<Tag>([...t.match.matched_required, ...t.match.matched_helpful])
  if (shown.length > 0) lines.push(`Your projects show ${shown.map(humanTag).join(', ')}`)
  const missing = o.required_tags.filter(tag => !held.has(tag))
  if (missing.length > 0) lines.push(`No project shows ${missing.map(humanTag).join(', ')} yet`)
  if (t.has_busy_week_collision) {
    const bw = profile.busyWeeks.find(b => b.start && b.end && o.deadline >= b.start && o.deadline <= b.end)
    lines.push(`Due during ${bw?.label || 'a busy period'}`)
  }
  return lines
}

const TIER_ORDER: Record<OpportunityTier, number> = { FOCUS: 0, CONSIDER: 1, SKIP: 2 }

export function buildCards(
  plan: Plan,
  assets: Asset[],
  profile: ToolProfile,
  commits: CommitState,
  schedule: Schedule,
  today: string,
): OpportunityCardModel[] {
  const startBy = new Map<string, string>()
  for (const item of schedule.items) {
    if (item.start_by_bucket !== null) startBy.set(item.opportunity_id, schedule.buckets[item.start_by_bucket].start)
  }
  const cards = plan.tiered_opportunities.map((t): OpportunityCardModel => {
    const o = t.opportunity
    const lock = cardLockReason(t, profile, assets, today)
    const committed = lock === null && isCommitted(commits, o.id)
    return {
      id: o.id,
      title: o.title,
      organization: o.organization,
      sourceUrl: o.source_url,
      tier: t.tier,
      deadline: o.deadline,
      daysLeft: daysBetween(today, o.deadline),
      expired: o.deadline < today,
      effortHours: o.effort_hours,
      reasons: cardReasons(t, profile, assets, today),
      committable: lock === null,
      lockReason: lock,
      committed,
      startByBucketStart: committed ? startBy.get(o.id) ?? null : null,
      userAdded: o.type === 'user',
    }
  })
  return cards.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || (a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0))
}

// --- This-week strip ---

export type ThisWeekModel = {
  label: string
  loadHours: number
  capacityHours: number
  overloaded: boolean
}

export function buildThisWeek(schedule: Schedule): ThisWeekModel {
  const b = schedule.buckets[0]
  return { label: formatRange(b.start, b.end), loadHours: b.load_hours, capacityHours: b.capacity_hours, overloaded: b.overloaded }
}

/** Template next-action line (never LLM). */
export function nextActionText(plan: Plan, assets: Asset[], schedule: Schedule): { text: string; opportunityId: string } | null {
  const na = plan.next_action
  if (!na) return null
  const asset = assets.find(a => a.id === na.asset_id)
  const t = plan.tiered_opportunities.find(x => x.opportunity.id === na.opportunity_id)
  if (!asset || !t) return null
  const item = schedule.items.find(i => i.opportunity_id === na.opportunity_id)
  const when = item && item.start_by_bucket !== null
    ? `start by ${shortDate(schedule.buckets[item.start_by_bucket].start)}`
    : `due ${shortDate(t.opportunity.deadline)}`
  return { text: `Work on ${asset.title} for ${t.opportunity.title}, ${when}`, opportunityId: t.opportunity.id }
}

// --- Weeks timeline ---

export type TimelineSegment = { id: string; title: string; hours: number; overflow: boolean }

export type TimelineColumn = {
  bucket: ScheduleBucket
  label: string
  segments: TimelineSegment[]
  deadlineIds: string[]
  busyLabel: string | null
  overloadSentence: string | null
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** "6.5 h planned, 1.5 h available: CAC (6.5 h) lands here." */
export function overloadSentence(bucket: ScheduleBucket, segments: TimelineSegment[]): string {
  const perItem = new Map<string, { title: string; hours: number }>()
  for (const s of segments) {
    const cur = perItem.get(s.id) ?? { title: s.title, hours: 0 }
    cur.hours += s.hours
    perItem.set(s.id, cur)
  }
  const items = [...perItem.values()]
  const names = joinNames(items.map(i => `${i.title} (${formatHours(i.hours)} h)`))
  const verb = items.length === 1 ? 'lands' : 'land'
  const head = bucket.capacity_hours === 0
    ? `${formatHours(bucket.load_hours)} h planned, no hours available`
    : `${formatHours(bucket.load_hours)} h planned, ${formatHours(bucket.capacity_hours)} h available`
  return `${head}: ${names} ${verb} here.`
}

const MIDDLE_DOT = String.fromCharCode(183)

function busyLabel(bucket: WeekBucket, busyWeeks: BusyPeriod[]): string | null {
  if (bucket.busy_days === 0) return null
  const end = addDays(bucket.start, 6)
  const bw = busyWeeks.find(b => b.start && b.end && b.start <= end && b.end >= bucket.start)
  // Short enough for a timeline pill: "Midterms - 4 days" (with a middle dot).
  const days = bucket.busy_days === 1 ? '1 day' : `${bucket.busy_days} days`
  return `${bw?.label || 'Busy'} ${MIDDLE_DOT} ${days}`
}

export function buildTimeline(
  schedule: Schedule,
  titles: Record<string, string>,
  deadlines: Record<string, string>,
  busyWeeks: BusyPeriod[],
): TimelineColumn[] {
  const columns: TimelineColumn[] = schedule.buckets.map(b => ({
    bucket: b,
    label: formatRange(b.start, b.end),
    segments: [],
    deadlineIds: [],
    busyLabel: busyLabel(b, busyWeeks),
    overloadSentence: null,
  }))
  for (const item of schedule.items) {
    const title = titles[item.opportunity_id] ?? item.opportunity_id
    for (const p of item.placements) columns[p.bucket].segments.push({ id: item.opportunity_id, title, hours: p.hours, overflow: false })
    const dl = deadlines[item.opportunity_id]
    const k = dl ? daysBetween(schedule.buckets[0].start, dl) : -1
    const dk = k >= 0 ? Math.floor(k / 7) : -1
    if (dk >= 0 && dk < columns.length) {
      columns[dk].deadlineIds.push(item.opportunity_id)
      if (item.overflow_hours > 0) columns[dk].segments.push({ id: item.opportunity_id, title, hours: item.overflow_hours, overflow: true })
    }
  }
  for (const c of columns) if (c.bucket.overloaded) c.overloadSentence = overloadSentence(c.bucket, c.segments)
  return columns
}

// --- Plan summary row (plain counts and dates; never a score) ---

export type PlanSummary = {
  committedCount: number
  committableCount: number
  committedHours: number
  nextDeadline: { title: string; date: string; daysLeft: number } | null
  nextBusy: { label: string; start: string; end: string; daysUntil: number } | null
}

/**
 * Next deadline = earliest committed deadline on or after today, else the
 * earliest committable one. Next busy = the first complete busy period that
 * has not ended yet (daysUntil 0 when it is under way).
 */
export function buildPlanSummary(cards: OpportunityCardModel[], busyWeeks: BusyPeriod[], today: string): PlanSummary {
  const committed = cards.filter(c => c.committed)
  const committable = cards.filter(c => c.committable)
  const pool = (committed.length > 0 ? committed : committable).filter(c => c.deadline && c.deadline >= today)
  const next = [...pool].sort((a, b) => (a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0))[0]
  const busy = busyWeeks
    .filter(b => b.start && b.end && b.end >= today)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))[0]
  return {
    committedCount: committed.length,
    committableCount: committable.length,
    committedHours: committed.reduce((n, c) => n + c.effortHours, 0),
    nextDeadline: next ? { title: next.title, date: next.deadline, daysLeft: daysBetween(today, next.deadline) } : null,
    nextBusy: busy
      ? { label: busy.label || 'Busy period', start: busy.start, end: busy.end, daysUntil: Math.max(0, daysBetween(today, busy.start)) }
      : null,
  }
}
