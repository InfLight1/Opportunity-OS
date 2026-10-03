import { describe, it, expect } from 'vitest'
import opps from '../data/opportunities.json'
import { fixtureProfile } from '../engine/fixtures'
import { runEngine } from '../engine/run-engine'
import type { Opportunity, TieredOpportunity } from '../engine/types'
import { buildReuseFan, buildStoryData, humanTag, shortDate, shortExitReason, type StoryProfile } from './story-data'

const TODAY = '2026-10-03'
const OPPS = opps as Opportunity[]

function demo(capacity: number) {
  const input = {
    name: fixtureProfile.name, grade: fixtureProfile.grade, region: fixtureProfile.region,
    interests: [...fixtureProfile.interests], skills: [...fixtureProfile.skills],
    assets: fixtureProfile.assets.map(a => ({ ...a, tags: [...a.tags], supports: [], reuse_count: 0 })),
    weekly_capacity_hours: capacity, busy_weeks: fixtureProfile.busy_weeks,
  }
  const { plan, assets } = runEngine(input, OPPS, TODAY)
  const profile: StoryProfile = {
    grade: input.grade, region: input.region, weekly_capacity_hours: capacity,
    busy_weeks: input.busy_weeks, assets,
  }
  return { tiered: plan.tiered_opportunities, assets, profile }
}

describe('formatters', () => {
  it('shortDate', () => {
    expect(shortDate('2026-09-09')).toBe('Sep 9')
    expect(shortDate('2026-12-21')).toBe('Dec 21')
  })
  it('humanTag', () => {
    expect(humanTag('research-writing')).toBe('research writing')
    expect(humanTag('submission-format:essay')).toBe('essay')
  })
})

describe('buildStoryData on the demo profile (capacity 10, 2026-10-03)', () => {
  const { tiered, assets, profile } = demo(10)
  const story = buildStoryData(tiered, assets, profile, TODAY)

  it('counts: total = dataset size, remaining = total - exits', () => {
    expect(story.total).toBe(OPPS.length)
    expect(story.remaining).toBe(story.total - story.exits.length)
    expect(story.weeklyCapacityHours).toBe(10)
    expect(story.titles).toHaveLength(OPPS.length)
  })

  it('hero numbers: total effort = sum of every estimate; pile has every entry', () => {
    expect(story.totalEffortHours).toBe(OPPS.reduce((n, o) => n + o.effort_hours, 0))
    expect(story.totalEffortHours).toBe(160)
    expect(story.pile).toHaveLength(OPPS.length)
    expect(story.pile[0]).toEqual({ id: OPPS[0].id, title: OPPS[0].title, deadline: OPPS[0].deadline, effortHours: OPPS[0].effort_hours })
  })

  it('every SKIP entry exits, each with a short reason (no engine prefixes)', () => {
    const skipIds = tiered.filter(t => t.tier === 'SKIP').map(t => t.opportunity.id)
    expect(story.exits.map(e => e.id)).toEqual(skipIds)
    for (const e of story.exits) {
      expect(e.reason).not.toMatch(/Ineligible|Eligibility|\|/)
    }
  })

  it('exit reasons per check (grade, closed, region, runway)', () => {
    const reason = (id: string) => story.exits.find(e => e.id === id)?.reason
    expect(reason('opp-regeneron-sts')).toBe('Grade 12 only')
    expect(reason('opp-3m-ysc')).toBe('Grade 5-8 only')
    expect(reason('opp-au-stem-vgc')).toBe('Closed Sep 9')
    expect(reason('opp-ksu-hspc')).toBe('Manhattan, KS, US only')
    expect(reason('opp-opencv-ai')).toBe('Needs 30 h, 29 h available by Oct 26')
  })

  it('reuse fan: tennis project with pursuable targets only, labelled with matched tags', () => {
    expect(story.reuseFan).not.toBeNull()
    const fan = story.reuseFan!
    expect(fan.project.id).toBe('asset-tennis')
    const tierOf = (id: string) => tiered.find(t => t.opportunity.id === id)!.tier
    for (const target of fan.targets) {
      expect(tierOf(target.id)).not.toBe('SKIP')
      expect(target.matchedTags.length).toBeGreaterThan(0)
      for (const tag of target.matchedTags) expect(fixtureProfile.assets[0].tags).toContain(tag)
    }
    expect(fan.targets.map(t => t.id)).not.toContain('opp-opencv-ai')
    expect(fan.targets.map(t => t.id)).toEqual(expect.arrayContaining(['opp-imlc', 'opp-cac']))
  })
})

describe('shortExitReason edge cases', () => {
  const { tiered, profile } = demo(10)
  const imlc = tiered.find(t => t.opportunity.id === 'opp-imlc')!

  const skipWith = (patch: Partial<Opportunity>, matched: TieredOpportunity['match']['matched_required'] = []): TieredOpportunity => ({
    ...imlc,
    tier: 'SKIP',
    opportunity: { ...imlc.opportunity, ...patch },
    match: { ...imlc.match, matched_required: matched },
  })

  it('non-SKIP -> null', () => {
    expect(shortExitReason(imlc, profile, TODAY)).toBeNull()
  })

  it('missing prerequisite -> names it', () => {
    expect(shortExitReason(skipWith({ prerequisites: ['writing-sample'] }), profile, TODAY)).toBe('Needs writing sample')
  })

  it('no required-tag match -> names the required tags', () => {
    expect(shortExitReason(skipWith({ required_tags: ['research-writing'] }), profile, TODAY)).toBe('Needs research writing')
  })

  it('order: grade is reported before an expired deadline', () => {
    expect(shortExitReason(skipWith({ grade_range: { min: 11, max: 12 }, deadline: '2026-09-01' }), profile, TODAY)).toBe('Grade 11-12 only')
  })
})

describe('buildReuseFan', () => {
  it('null when no asset supports a pursuable entry', () => {
    const { tiered, assets } = demo(10)
    const allSkip = tiered.map(t => ({ ...t, tier: 'SKIP' as const }))
    expect(buildReuseFan(allSkip, assets)).toBeNull()
    expect(buildReuseFan(tiered, [])).toBeNull()
  })
})
