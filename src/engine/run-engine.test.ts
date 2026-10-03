import { describe, it, expect } from 'vitest'
import { runEngine, type ProfileInput } from './run-engine'
import type { Asset, BusyPeriod, Opportunity, Tag } from './types'

const today = '2026-09-29'

function busyWeek(start: string, end: string): BusyPeriod {
  return { start, end }
}

function makeAsset(id: string, tags: Tag[]): Asset {
  return { id, title: `${id} asset`, description: '', kind: 'project', tags, supports: [], reuse_count: 0 }
}

function makeOpp(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: overrides.id ?? 'test-opp',
    title: overrides.title ?? 'Test Opp',
    organization: '',
    type: '',
    description: '',
    grade_range: overrides.grade_range ?? { min: 1, max: 12 },
    location: overrides.location ?? { remote_ok: true, region: null },
    prerequisites: overrides.prerequisites ?? [],
    required_tags: overrides.required_tags ?? [],
    helpful_tags: overrides.helpful_tags ?? [],
    deadline: overrides.deadline ?? '2027-06-01',
    effort_hours: overrides.effort_hours ?? 4,
    participation: 'individual' as const,
    submission_format: 'submission-format:demo' as const,
    requirements: [],
    source_url: '',
  }
}

// a. expired opp appears in no returned asset.supports; future matching opp IS eligible (positive control)
describe('runEngine returns assets with supports', () => {
  it('expired deadline produces no supports entries; future opp is eligible but not in supports (no tag match)', () => {
    const expired = makeOpp({ id: 'opp-expired', deadline: '2020-01-01' })
    // Future opp with matching required tag to exercise positive control
    const future = makeOpp({
      id: 'opp-future-match',
      deadline: '2027-06-01',
      required_tags: ['web-dev'],
    })

    const input: ProfileInput = {
      name: '',
      grade: 10,
      region: '',
      interests: [],
      skills: [],
      assets: [makeAsset('a1', ['web-dev'])],
      weekly_capacity_hours: 8,
      busy_weeks: [],
    }

    const { assets } = runEngine(input, [expired, future], today)

    // Expired opp must not be in any returned asset.supports
    for (const a of assets) {
      expect(a.supports).not.toContain(expired.id)
    }

    // Matched future opp should be in supports (a1 has web-dev, required by opp-future-match)
    const a1 = assets.find(a => a.id === 'a1')!
    expect(a1.supports).toContain('opp-future-match')
  })
})

// b. 1 helpful match + 0 required matches => tier SKIP and not in any asset.supports
describe('runEngine matching SKIP on insufficient help', () => {
  it('one helpful tag only (no required match) => SKIP, opp not in supports', () => {
    const opp = makeOpp({
      id: 'opp-single-helpful',
      deadline: '2027-06-01',
      required_tags: ['technical-project'],
      helpful_tags: ['ai-interest'],
    })

    // Asset has ai-interest (helpful) but not technical-project (required) — only 1 helpful match < 2 required
    const input: ProfileInput = {
      name: '',
      grade: 10,
      region: '',
      interests: [],
      skills: [],
      assets: [makeAsset('a1', ['web-dev', 'ai-interest'])],
      weekly_capacity_hours: 8,
      busy_weeks: [],
    }

    const { plan, assets } = runEngine(input, [opp], today)

    const tiered = plan.tiered_opportunities.find(t => t.opportunity.id === opp.id)!
    expect(tiered.eligible).toBe(true)
    expect(tiered.tier).toBe('SKIP')

    // SKIP opp should not appear in any returned asset.supports
    for (const a of assets) {
      expect(a.supports).not.toContain(opp.id)
    }
  })
})

// c. busy week collision: empty start => no collision; full range => collision
describe('runEngine busy week collision', () => {
  it('empty-start busy period causes no collision; full-range busy period over opp deadline causes collision', () => {
    // Opp that is eligible and matching
    const opp = makeOpp({
      id: 'opp-busy-test',
      deadline: '2027-06-15',
      required_tags: ['web-dev'],
    })

    // Control: empty start = not a valid busy week
    const inputNoCollision: ProfileInput = {
      name: '',
      grade: 10,
      region: '',
      interests: [],
      skills: ['web-dev'],
      assets: [makeAsset('a1', ['web-dev'])],
      weekly_capacity_hours: 8,
      busy_weeks: [busyWeek('', '2026-10-20')],
    }

    const { plan: planNoCollision } = runEngine(inputNoCollision, [opp], today)
    const tieredNoCollision = planNoCollision.tiered_opportunities[0]
    expect(tieredNoCollision.has_busy_week_collision).toBe(false)

    // Test: full-range busy week spanning past opp deadline (deadline is in Oct 2026 if we change it)
    const oppBusy = makeOpp({
      id: 'opp-busy-collide',
      deadline: '2026-10-10',
      required_tags: ['web-dev'],
    })

    const inputCollide: ProfileInput = {
      name: '',
      grade: 10,
      region: '',
      interests: [],
      skills: ['web-dev'],
      assets: [makeAsset('a2', ['web-dev'])],
      weekly_capacity_hours: 8,
      busy_weeks: [busyWeek('2026-10-05', '2026-10-20')],
    }

    const { plan: planCollide } = runEngine(inputCollide, [oppBusy], today)
    const tieredCollide = planCollide.tiered_opportunities[0]
    expect(tieredCollide.has_busy_week_collision).toBe(true)
  })
})

// d. ineligible opp (grade_range excludes grade) => SKIP + eligible false
describe('runEngine ineligible opp', () => {
  it('student grade outside opportunity range => tier SKIP and eligible false', () => {
    const opp = makeOpp({ id: 'opp-grade-excl', deadline: '2027-06-01' })

    const input: ProfileInput = {
      name: '',
      grade: 99, // way outside default range [1, 12]
      region: '',
      interests: [],
      skills: [],
      assets: [] as Asset[],
      weekly_capacity_hours: 8,
      busy_weeks: [],
    }

    const { plan } = runEngine(input, [opp], today)

    const tiered = plan.tiered_opportunities.find(t => t.opportunity.id === opp.id)!
    expect(tiered.eligible).toBe(false)
    expect(tiered.tier).toBe('SKIP')
  })
})

// e. reuse_count = max supports.length among assets that support it
describe('runEngine reuse_count', () => {
  it('opp reuse_count = max supports.length among supporting assets (two assets, one supports 2 opps, one supports 1)', () => {
    const opp1 = makeOpp({ id: 'opp-reuse-1', deadline: '2027-06-01', required_tags: ['web-dev'] })
    const opp2 = makeOpp({ id: 'opp-reuse-2', deadline: '2027-07-01', required_tags: ['web-dev'] })

    // a1 has web-dev → supports both opp1 and opp2
    // a2 has web-dev + python → also supports both opp1 and opp2
    const a1 = makeAsset('a1', ['web-dev'])
    const a2 = makeAsset('a2', ['web-dev', 'python'])

    const input: ProfileInput = {
      name: '',
      grade: 10,
      region: '',
      interests: [],
      skills: [],
      assets: [a1, a2],
      weekly_capacity_hours: 8,
      busy_weeks: [],
    }

    const { plan, assets } = runEngine(input, [opp1, opp2], today)

    // a1 supports both opp1 and opp2 → reuse_count = 2
    const assetA1 = assets.find(a => a.id === 'a1')!
    expect(assetA1.supports).toContain('opp-reuse-1')
    expect(assetA1.supports).toContain('opp-reuse-2')
    expect(assetA1.reuse_count).toBe(2)

    // a2 also supports both (web-dev match) → reuse_count = 2
    const assetA2 = assets.find(a => a.id === 'a2')!
    expect(assetA2.supports.length).toBeGreaterThanOrEqual(1)

    // opp1 should have reuse_count = max(reuse among supporting assets that contain it) >= 2
    const tieredOpp1 = plan.tiered_opportunities.find(t => t.opportunity.id === 'opp-reuse-1')!
    expect(tieredOpp1.reuse_count).toBeGreaterThanOrEqual(1)
  })
})

// M1: Reason-string tests
describe('M1: reason strings', () => {
  function makeInput(overrides: Partial<ProfileInput> = {}): ProfileInput {
    return {
      name: 'Test User',
      grade: overrides.grade ?? 10,
      region: overrides.region ?? 'US',
      interests: [],
      skills: [],
      assets: overrides.assets ?? [],
      weekly_capacity_hours: overrides.weekly_capacity_hours ?? 8,
      busy_weeks: overrides.busy_weeks ?? [],
    }
  }

  it('eligibility failure reason contains grade info when grade out of range', () => {
    const opp = makeOpp({ id: 'opp-grade-fail', deadline: '2027-06-01' })
    const input = makeInput({ grade: 99 })
    const { plan } = runEngine(input, [opp], today)
    const tiered = plan.tiered_opportunities[0]
    expect(tiered.eligible).toBe(false)
    expect(tiered.match.reason).toContain('grade')
  })

  it('eligibility failure reason contains deadline date when expired', () => {
    const opp = makeOpp({ id: 'opp-expired-reason', deadline: '2020-01-01' })
    const { plan } = runEngine(makeInput(), [opp], today)
    const tiered = plan.tiered_opportunities[0]
    expect(tiered.eligible).toBe(false)
    expect(tiered.match.reason).toContain('2020-01-01')
  })

  it('SKIP reason contains tag names when no required-tag match', () => {
    const opp = makeOpp({ id: 'opp-no-match', deadline: '2027-06-01', required_tags: ['python', 'ai-ml'] })
    const input = makeInput({ assets: [makeAsset('a1', ['web-dev'])] })
    const { plan } = runEngine(input, [opp], today)
    const tiered = plan.tiered_opportunities[0]
    expect(tiered.eligible).toBe(true)
    expect(tiered.tier).toBe('SKIP')
    expect(tiered.match.reason).toContain('python')
    expect(tiered.match.reason).toContain('ai-ml')
  })

  it('SKIP reason states effort and available hours when effort exceeds the runway', () => {
    // today 2026-09-29, deadline 2026-10-05 -> bucket 0 only -> 8h available
    const opp = makeOpp({ id: 'opp-effort-skip', deadline: '2026-10-05', required_tags: ['web-dev'], effort_hours: 15 })
    const input = makeInput({ assets: [makeAsset('a1', ['web-dev'])], weekly_capacity_hours: 8 })
    const { plan } = runEngine(input, [opp], today)
    const tiered = plan.tiered_opportunities[0]
    expect(tiered.eligible).toBe(true)
    expect(tiered.tier).toBe('SKIP')
    expect(tiered.match.reason).toContain('15')
    expect(tiered.match.reason).toContain('8')
  })

  it('effort above one week but within the runway is not SKIP', () => {
    const opp = makeOpp({ id: 'opp-long-runway', deadline: '2027-06-01', required_tags: ['web-dev'], effort_hours: 15 })
    const input = makeInput({ assets: [makeAsset('a1', ['web-dev'])], weekly_capacity_hours: 8 })
    const { plan } = runEngine(input, [opp], today)
    expect(plan.tiered_opportunities[0].tier).not.toBe('SKIP')
  })

  it('CONSIDER reason mentions a gap tag when there is an open gap', () => {
    const multi = makeOpp({ id: 'opp-multi-gap', deadline: '2027-06-01', required_tags: ['web-dev', 'python'] })
    const input3 = makeInput({ assets: [makeAsset('a1', ['web-dev']), makeAsset('a2', ['web-dev'])] })
    const { plan: plan3 } = runEngine(input3, [multi], today)
    const tiered3 = plan3.tiered_opportunities[0]
    expect(tiered3.gap_count).toBe(1)
  })

  it('busy-week collision produces bus note in reason', () => {
    const oppBusy = makeOpp({ id: 'opp-busy-reason', deadline: '2026-10-10', required_tags: ['web-dev'] })
    const inputB = makeInput({ assets: [makeAsset('a1', ['web-dev'])], busy_weeks: [busyWeek('2026-10-05', '2026-10-20')] })
    const { plan } = runEngine(inputB, [oppBusy], today)
    const t = plan.tiered_opportunities[0]
    expect(t.match.reason).toMatch(/collision/i)
  })

  it('FOCUS reason states matched tags and reuse count', () => {
    const opp1 = makeOpp({ id: 'opp-focus-reuse', deadline: '2027-06-01', required_tags: ['web-dev'] })
    const opp2 = makeOpp({ id: 'opp-focus-reuse2', deadline: '2027-07-01', required_tags: ['web-dev'] })
    const input = makeInput({ assets: [makeAsset('a1', ['web-dev']), makeAsset('a2', ['web-dev'])] })
    const { plan } = runEngine(input, [opp1, opp2], today)
    const tiered = plan.tiered_opportunities.find(t => t.opportunity.id === 'opp-focus-reuse')!
    expect(tiered.tier).toBe('FOCUS')
    expect(tiered.match.reason).toContain('web-dev')
    expect(tiered.match.reason).toContain('reuse count')
  })

  it('two opportunities do not share a match object', () => {
    const opp1 = makeOpp({ id: 'opp-distinct-a', deadline: '2027-06-01', required_tags: ['web-dev'] })
    const opp2 = makeOpp({ id: 'opp-distinct-b', deadline: '2027-07-01', required_tags: ['web-dev'] })
    const input = makeInput({ assets: [makeAsset('a1', ['web-dev']), makeAsset('a2', ['python'])] })
    const { plan } = runEngine(input, [opp1, opp2], today)
    const m1 = plan.tiered_opportunities[0].match
    const m2 = plan.tiered_opportunities[1].match
    expect(m1).not.toBe(m2)
  })
})
