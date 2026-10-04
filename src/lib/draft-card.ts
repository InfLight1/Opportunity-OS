import type { Opportunity } from '../engine/types'
import { availableHours, daysBetween } from '../engine/buckets'
import type { ProfileFormData } from '../form-data'
import { shortDate } from './exit-reason'
import { planForForm } from './profile-model'
import { buildCards, relativeDays, type OpportunityCardModel } from './tool-view'
import { buildSchedule } from '../engine/schedule'

// --- Add your own (manual form) -> draft card + registration checklist ---
// Input is Partial<Opportunity> so the later LLM intake can feed the same path.
// The tier comes from the engine run over the dataset plus the draft.

export interface ChecklistItem { label: string; status: 'ok' | 'fail' | 'missing'; detail: string }

export type Draft = { card: OpportunityCardModel; checklist: ChecklistItem[]; opportunity: Opportunity; complete: boolean }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function validDate(d: unknown): d is string {
  return typeof d === 'string' && ISO_DATE.test(d) && !Number.isNaN(Date.parse(d))
}

/** Field names a draft still needs before it can be added. */
export function missingFields(p: Partial<Opportunity>): string[] {
  const missing: string[] = []
  if (!p.title?.trim()) missing.push('title')
  if (!validDate(p.deadline)) missing.push('deadline')
  if (typeof p.effort_hours !== 'number' || !(p.effort_hours > 0)) missing.push('effort')
  if (!p.grade_range || !(p.grade_range.min > 0) || !(p.grade_range.max >= p.grade_range.min)) missing.push('grades')
  if (!p.location || (!p.location.remote_ok && !p.location.region?.trim())) missing.push('location')
  if (!p.required_tags || p.required_tags.length === 0) missing.push('what it asks for')
  return missing
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'untitled'
}

/** Only http(s) links are kept; anything else (javascript:, data:, junk) becomes ''. */
export function safeUrl(raw: string | undefined): string {
  const url = raw?.trim() ?? ''
  return /^https?:\/\//i.test(url) ? url : ''
}

export function toOpportunity(p: Partial<Opportunity>): Opportunity {
  const title = p.title?.trim() || 'Untitled opportunity'
  return {
    id: `user-${slug(title)}`,
    title,
    organization: p.organization?.trim() ?? '',
    type: 'user',
    description: p.description ?? '',
    grade_range: p.grade_range ?? { min: 0, max: 0 },
    location: p.location ? { remote_ok: p.location.remote_ok, region: p.location.region?.trim() || null } : { remote_ok: false, region: null },
    prerequisites: p.prerequisites ?? [],
    required_tags: p.required_tags ?? [],
    helpful_tags: p.helpful_tags ?? [],
    deadline: validDate(p.deadline) ? p.deadline : '',
    effort_hours: typeof p.effort_hours === 'number' && p.effort_hours > 0 ? p.effort_hours : 0,
    participation: p.participation ?? 'individual',
    submission_format: p.submission_format ?? 'submission-format:demo',
    requirements: p.requirements ?? [],
    source_url: safeUrl(p.source_url),
  }
}

export function draftChecklist(p: Partial<Opportunity>, form: ProfileFormData, today: string): ChecklistItem[] {
  const items: ChecklistItem[] = []
  const g = p.grade_range
  if (!g || !(g.min > 0) || !(g.max >= g.min)) items.push({ label: 'Grades', status: 'missing', detail: 'Add the grades it is open to' })
  else if (form.grade < g.min || form.grade > g.max) items.push({ label: 'Grades', status: 'fail', detail: `Grade ${g.min === g.max ? g.min : `${g.min}-${g.max}`} only; you are in grade ${form.grade}` })
  else items.push({ label: 'Grades', status: 'ok', detail: `Open to grade ${form.grade}` })

  const loc = p.location
  if (!loc || (!loc.remote_ok && !loc.region?.trim())) items.push({ label: 'Location', status: 'missing', detail: 'Say if it is online or where it is held' })
  else if (loc.remote_ok) items.push({ label: 'Location', status: 'ok', detail: 'Online' })
  else if (loc.region!.trim() === form.region) items.push({ label: 'Location', status: 'ok', detail: `Held in ${form.region}` })
  else items.push({ label: 'Location', status: 'fail', detail: `${loc.region!.trim()} only; you are in ${form.region || 'no region set'}` })

  if (!validDate(p.deadline)) items.push({ label: 'Deadline', status: 'missing', detail: 'Add the deadline' })
  else if (p.deadline < today) items.push({ label: 'Deadline', status: 'fail', detail: `Closed ${shortDate(p.deadline)}` })
  else items.push({ label: 'Deadline', status: 'ok', detail: `Due ${shortDate(p.deadline)}, ${relativeDays(daysBetween(today, p.deadline))}` })

  if (validDate(p.deadline) && p.deadline >= today && typeof p.effort_hours === 'number' && p.effort_hours > 0) {
    const avail = availableHours(p.deadline, today, form.weekly_capacity_hours, form.busy_weeks)
    items.push(p.effort_hours <= avail
      ? { label: 'Time', status: 'ok', detail: `Needs ${p.effort_hours} h; ${avail} h available by ${shortDate(p.deadline)}` }
      : { label: 'Time', status: 'fail', detail: `Needs ${p.effort_hours} h; only ${avail} h available by ${shortDate(p.deadline)}` })
  }

  const missing = missingFields(p)
  items.push(missing.length === 0
    ? { label: 'Fields', status: 'ok', detail: 'Everything needed is filled in' }
    : { label: 'Fields', status: 'missing', detail: `Still needed: ${missing.join(', ')}` })
  return items
}

/** Draft card (tier from the engine over dataset + draft) and its checklist. */
export function buildDraft(p: Partial<Opportunity>, form: ProfileFormData, opportunities: Opportunity[], today: string): Draft {
  const opportunity = toOpportunity(p)
  const complete = missingFields(p).length === 0
  const checklist = draftChecklist(p, form, today)
  const { plan, assets } = planForForm(form, [...opportunities.filter(o => o.id !== opportunity.id), opportunity], today)
  const profile = { grade: form.grade, region: form.region, weeklyCapacityHours: form.weekly_capacity_hours, busyWeeks: form.busy_weeks }
  const schedule = buildSchedule([], today, form.weekly_capacity_hours, form.busy_weeks)
  const engineCard = buildCards(plan, assets, profile, { committed_ids: [] }, schedule, today).find(c => c.id === opportunity.id)!
  const card: OpportunityCardModel = complete
    ? engineCard
    : { ...engineCard, reasons: [], committable: false, lockReason: 'Fill in the missing fields first', expired: false, daysLeft: validDate(p.deadline) ? engineCard.daysLeft : 0 }
  return { card, checklist, opportunity, complete }
}
