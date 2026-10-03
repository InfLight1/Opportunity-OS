import { describe, it, expect } from 'vitest'
import opps from '../data/opportunities.json'
import { fixtureProfile } from '../engine/fixtures'
import type { Opportunity } from '../engine/types'
import { buildDraft, draftChecklist, missingFields, toOpportunity } from './draft-card'
import { askWhyTemplate } from './ask-why-template'
import { planForForm, profileToFormData } from './profile-model'

const TODAY = '2026-10-03'
const OPPS = opps as Opportunity[]
const FORM = profileToFormData(fixtureProfile)

const FULL: Partial<Opportunity> = {
  title: 'Bay Area Youth Hack',
  organization: 'Example Org',
  deadline: '2026-11-20',
  effort_hours: 8,
  grade_range: { min: 9, max: 12 },
  location: { remote_ok: true, region: null },
  required_tags: ['technical-project'],
}

const status = (p: Partial<Opportunity>, label: string) => draftChecklist(p, FORM, TODAY).find(i => i.label === label)

describe('missingFields', () => {
  it('complete draft -> none', () => expect(missingFields(FULL)).toEqual([]))
  it('empty draft -> every field', () => {
    expect(missingFields({})).toEqual(['title', 'deadline', 'effort', 'grades', 'location', 'what it asks for'])
  })
  it('bad date and zero effort count as missing', () => {
    expect(missingFields({ ...FULL, deadline: '2026-13-45x', effort_hours: 0 })).toEqual(['deadline', 'effort'])
  })
})

describe('draftChecklist', () => {
  it('ok on every line for a fitting entry', () => {
    const items = draftChecklist(FULL, FORM, TODAY)
    expect(items.map(i => [i.label, i.status])).toEqual([['Grades', 'ok'], ['Location', 'ok'], ['Deadline', 'ok'], ['Time', 'ok'], ['Fields', 'ok']])
    expect(status(FULL, 'Deadline')!.detail).toBe('Due Nov 20, in 48 days')
  })
  it('grade fail names the range and the student grade', () => {
    expect(status({ ...FULL, grade_range: { min: 11, max: 12 } }, 'Grades')).toEqual({ label: 'Grades', status: 'fail', detail: 'Grade 11-12 only; you are in grade 10' })
  })
  it('location fail for another region; ok for the same region', () => {
    expect(status({ ...FULL, location: { remote_ok: false, region: 'Boston, MA, US' } }, 'Location')!.status).toBe('fail')
    expect(status({ ...FULL, location: { remote_ok: false, region: 'Dublin, CA, US' } }, 'Location')!.status).toBe('ok')
  })
  it('deadline past -> fail "Closed"; deadline today -> ok', () => {
    expect(status({ ...FULL, deadline: '2026-09-09' }, 'Deadline')!.detail).toBe('Closed Sep 9')
    expect(status({ ...FULL, deadline: TODAY }, 'Deadline')!.status).toBe('ok')
  })
  it('time fail when effort exceeds the runway', () => {
    expect(status({ ...FULL, deadline: '2026-10-05', effort_hours: 20 }, 'Time')).toEqual({ label: 'Time', status: 'fail', detail: 'Needs 20 h; only 10 h available by Oct 5' })
  })
  it('missing fields are listed', () => {
    expect(status({ title: 'X' }, 'Fields')!.status).toBe('missing')
    expect(status({ title: 'X' }, 'Deadline')!.status).toBe('missing')
  })
})

describe('buildDraft', () => {
  it('complete draft: engine tier, committable, no JSON-ish text', () => {
    const d = buildDraft(FULL, FORM, OPPS, TODAY)
    expect(d.complete).toBe(true)
    expect(d.card.id).toBe('user-bay-area-youth-hack')
    expect(['FOCUS', 'CONSIDER']).toContain(d.card.tier)
    expect(d.card.committable).toBe(true)
    for (const r of d.card.reasons) expect(r).not.toMatch(/[{}[\]]/)
  })
  it('incomplete draft: locked with a plain reason', () => {
    const d = buildDraft({ title: 'Half filled' }, FORM, OPPS, TODAY)
    expect(d.complete).toBe(false)
    expect(d.card.committable).toBe(false)
    expect(d.card.lockReason).toBe('Fill in the missing fields first')
    expect(d.card.deadline).toBe('')
  })
  it('ineligible draft (grade) is SKIP with the short reason', () => {
    const d = buildDraft({ ...FULL, grade_range: { min: 12, max: 12 } }, FORM, OPPS, TODAY)
    expect(d.card.tier).toBe('SKIP')
    expect(d.card.lockReason).toBe('Grade 12 only')
  })
  it('toOpportunity fills safe defaults', () => {
    const o = toOpportunity({})
    expect(o.title).toBe('Untitled opportunity')
    expect(o.deadline).toBe('')
    expect(o.effort_hours).toBe(0)
  })
})

describe('askWhyTemplate', () => {
  const { plan, assets } = planForForm(FORM, OPPS, TODAY)
  const ctx = { grade: FORM.grade, region: FORM.region, weeklyCapacityHours: 10, busyWeeks: FORM.busy_weeks, assets, tiered: plan.tiered_opportunities }
  const why = (id: string) => askWhyTemplate(plan.tiered_opportunities.find(t => t.opportunity.id === id)!, ctx, TODAY)

  it('never says score or percent, for any entry', () => {
    for (const t of plan.tiered_opportunities) expect(askWhyTemplate(t, ctx, TODAY)).not.toMatch(/score|percent|%/i)
  })
  it('Focus: names the project, matched tags and the runway hours', () => {
    const text = why('opp-imlc')
    expect(text).toContain('Tennis Analytics App shows')
    expect(text).toContain('data analysis')
    expect(text).toContain('It needs about 6 h, and you have 99 h before Dec 13 at 10 h a week.')
    expect(text).toMatch(/Focus:/)
  })
  it('Consider: CAC is due during Midterms', () => {
    expect(why('opp-cac')).toContain('Consider, not Focus: it is due during Midterms')
  })
  it('Not now: OpenCV runway reason', () => {
    expect(why('opp-opencv-ai')).toMatch(/^Not now: Needs 30 h, 29 h available by Oct 26\./)
  })
  it('every number in the text comes from the inputs', () => {
    const t = plan.tiered_opportunities.find(x => x.opportunity.id === 'opp-nasa-space-apps')!
    const nums = why('opp-nasa-space-apps').match(/\d+(\.\d+)?/g) ?? []
    const allowed = new Set(['12', '59', '14', '10'])
    for (const n of nums) expect(allowed.has(n) || t.opportunity.title.includes(n)).toBe(true)
  })
})
