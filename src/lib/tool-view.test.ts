import { describe, it, expect } from 'vitest'
import opps from '../data/opportunities.json'
import { fixtureProfile } from '../engine/fixtures'
import { buildSchedule } from '../engine/schedule'
import type { CommitState, Opportunity } from '../engine/types'
import { committedOpportunities } from './commit-state'
import { planForForm, profileToFormData } from './profile-model'
import {
  buildCards, buildThisWeek, buildTimeline, formatHours, formatRange, nextActionText, relativeDays, TIER_WORD, type ToolProfile,
} from './tool-view'

const TODAY = '2026-10-03'
const OPPS = opps as Opportunity[]
const ALL_FIVE = ['opp-imlc', 'opp-cac', 'opp-nasa-space-apps', 'opp-cosmo-hacks', 'opp-global-appathon']

function setup(capacity: number, committed: string[]) {
  const form = profileToFormData(fixtureProfile)
  const { plan, assets } = planForForm(form, OPPS, TODAY, capacity)
  const commits: CommitState = { committed_ids: committed }
  const schedule = buildSchedule(committedOpportunities(commits, plan.tiered_opportunities, TODAY), TODAY, capacity, form.busy_weeks)
  const profile: ToolProfile = { grade: form.grade, region: form.region, weeklyCapacityHours: capacity, busyWeeks: form.busy_weeks }
  const titles = Object.fromEntries(OPPS.map(o => [o.id, o.title]))
  const deadlines = Object.fromEntries(OPPS.map(o => [o.id, o.deadline]))
  return { plan, assets, commits, schedule, profile, titles, deadlines }
}

describe('formatters', () => {
  it('formatHours', () => {
    expect(formatHours(6)).toBe('6')
    expect(formatHours(6.5)).toBe('6.5')
    expect(formatHours(0.1 + 0.2)).toBe('0.3')
  })
  it('formatRange within and across months', () => {
    expect(formatRange('2026-10-03', '2026-10-09')).toBe('Oct 3-9')
    expect(formatRange('2026-10-31', '2026-11-06')).toBe('Oct 31-Nov 6')
  })
  it('relativeDays', () => {
    expect(relativeDays(0)).toBe('today')
    expect(relativeDays(1)).toBe('tomorrow')
    expect(relativeDays(23)).toBe('in 23 days')
    expect(relativeDays(-24)).toBe('closed 24 days ago')
  })
  it('tier words', () => {
    expect(TIER_WORD).toEqual({ FOCUS: 'Focus', CONSIDER: 'Consider', SKIP: 'Not now' })
  })
})

describe('buildCards (demo, 10 h)', () => {
  const s = setup(10, ['opp-cac', 'opp-opencv-ai'])
  const cards = buildCards(s.plan, s.assets, s.profile, s.commits, s.schedule, TODAY)
  const card = (id: string) => cards.find(c => c.id === id)!

  it('one card per entry, ordered Focus, Consider, Not now', () => {
    expect(cards).toHaveLength(OPPS.length)
    const order = cards.map(c => c.tier)
    expect(order).toEqual([...order].sort((a, b) => ['FOCUS', 'CONSIDER', 'SKIP'].indexOf(a) - ['FOCUS', 'CONSIDER', 'SKIP'].indexOf(b)))
  })

  it('no reason shows a score, percent or the engine reuse count', () => {
    for (const c of cards) {
      for (const r of c.reasons) expect(r).not.toMatch(/reuse count|score|percent|%|Eligibility|\|/i)
      if (c.lockReason) expect(c.lockReason).not.toMatch(/Ineligible|\|/)
    }
  })

  it('SKIP is locked with a short reason; FOCUS/CONSIDER are committable', () => {
    expect(card('opp-opencv-ai').committable).toBe(false)
    expect(card('opp-opencv-ai').lockReason).toBe('Needs 30 h, 29 h available by Oct 26')
    expect(card('opp-regeneron-sts').lockReason).toBe('Grade 12 only')
    expect(card('opp-au-stem-vgc').expired).toBe(true)
    expect(card('opp-imlc').committable).toBe(true)
    expect(card('opp-imlc').lockReason).toBeNull()
  })

  it('a stored commit on a locked entry is not shown as committed', () => {
    expect(card('opp-opencv-ai').committed).toBe(false)
  })

  it('committed card gets start-by from the schedule; others null', () => {
    expect(card('opp-cac').committed).toBe(true)
    expect(card('opp-cac').startByBucketStart).toBe('2026-10-17')
    expect(card('opp-imlc').startByBucketStart).toBeNull()
  })

  it('CAC reasons: matched tags and the busy-period collision', () => {
    expect(card('opp-cac').reasons).toContain('Due during Midterms')
    expect(card('opp-cac').reasons[0]).toMatch(/^Your projects show technical project/)
  })
})

describe('this week and next action', () => {
  it('bucket 0 label and hours', () => {
    const s = setup(10, [])
    expect(buildThisWeek(s.schedule)).toEqual({ label: 'Oct 3-9', loadHours: 0, capacityHours: 10, overloaded: false })
  })
  it('next action is a template line naming the asset and an opportunity', () => {
    const s = setup(10, [])
    const na = nextActionText(s.plan, s.assets, s.schedule)
    expect(na).not.toBeNull()
    expect(na!.text).toMatch(/^Work on Tennis Analytics App for .+, due [A-Z][a-z]{2} \d+$/)
  })
})

describe('buildTimeline', () => {
  it('10 h, all five committed: no overload, horizon = latest deadline bucket', () => {
    const s = setup(10, ALL_FIVE)
    const cols = buildTimeline(s.schedule, s.titles, s.deadlines, s.profile.busyWeeks)
    expect(cols).toHaveLength(26)
    expect(cols.some(c => c.overloadSentence !== null)).toBe(false)
    expect(cols[2].busyLabel).toBe('Midterms, 4 busy days')
    expect(cols[3].deadlineIds).toContain('opp-cac')
  })

  it('4 h preview, all five committed: b3 red with a sentence naming CAC', () => {
    const s = setup(4, ALL_FIVE)
    const cols = buildTimeline(s.schedule, s.titles, s.deadlines, s.profile.busyWeeks)
    const red = cols.filter(c => c.overloadSentence !== null)
    expect(red.map(c => c.bucket.index)).toEqual([3])
    expect(red[0].overloadSentence).toMatch(/^6\.5 h planned, 1\.5 h available: /)
    expect(red[0].overloadSentence).toContain('Congressional App Challenge')
    expect(red[0].segments.some(seg => seg.overflow && seg.id === 'opp-cac')).toBe(true)
  })

  it('segment hours per item add up to its effort', () => {
    const s = setup(4, ALL_FIVE)
    const cols = buildTimeline(s.schedule, s.titles, s.deadlines, s.profile.busyWeeks)
    for (const id of ALL_FIVE) {
      const total = cols.flatMap(c => c.segments).filter(seg => seg.id === id).reduce((n, seg) => n + seg.hours, 0)
      expect(total).toBe(OPPS.find(o => o.id === id)!.effort_hours)
    }
  })
})
