import { describe, it, expect } from 'vitest'
import type { Asset, Plan as EnginePlan, Opportunity } from '../engine/types'
import { buildReuseView } from './reuse-view'

// Helper: build minimal engine plan with tiers
function makePlan(tiered: Array<{ oppId: string; tier: 'FOCUS' | 'CONSIDER' | 'SKIP' }>): EnginePlan {
  const opportunities: Opportunity[] = tiered.map(({ oppId }) => ({
    id: oppId,
    title: `Opp ${oppId}`,
    organization: 'Org',
    type: 'competition',
    description: '',
    grade_range: { min: 9, max: 12 },
    location: { remote_ok: true, region: null },
    prerequisites: [],
    required_tags: [],
    helpful_tags: [],
    deadline: '2026-12-01',
    effort_hours: 10,
    participation: 'individual',
    submission_format: 'submission-format:demo',
    requirements: [],
    source_url: '#',
  }))

  return {
    weekly_capacity_hours: 20,
    busy_weeks: [],
    tiered_opportunities: tiered.map(({ oppId, tier }) => ({
      opportunity: opportunities.find(o => o.id === oppId)!,
      tier,
      match: { matched_required: [], helpful_match_count: 0, matched_helpful: [], gap_count: 0, reason: '' },
      reuse_count: 0,
      gap_count: 0,
      has_busy_week_collision: false,
      eligible: true,
    })),
    shared_gaps: [],
    next_action: null,
    weekly_load_warnings: [],
  }
}

function makeAsset(id: string, title: string, supports: string[]): Asset {
  return { id, title, description: '', kind: 'project', tags: [], supports, reuse_count: supports.length }
}

describe('buildReuseView', () => {
  it('classifies FOCUS and CONSIDER opps as pursueable', () => {
    const plan = makePlan([
      { oppId: 'opp-a', tier: 'FOCUS' },
      { oppId: 'opp-b', tier: 'CONSIDER' },
    ])
    const assets = [makeAsset('asset-1', 'My Project', ['opp-a', 'opp-b'])]
    const result = buildReuseView(plan, assets)

    expect(result.length).toBe(1)
    expect(result[0].asset_id).toBe('asset-1')
    expect(result[0].pursueable).toContain('opp-a')
    expect(result[0].pursueable).toContain('opp-b')
    expect(result[0].skipped).toHaveLength(0)
  })

  it('classifies SKIP opps as skipped', () => {
    const plan = makePlan([
      { oppId: 'opp-c', tier: 'SKIP' },
    ])
    const assets = [makeAsset('asset-2', 'Old Project', ['opp-c'])]
    const result = buildReuseView(plan, assets)

    expect(result[0].skipped).toContain('opp-c')
    expect(result[0].pursueable).toHaveLength(0)
  })

  it('empty supports produces no reuse categories for that asset', () => {
    const plan = makePlan([
      { oppId: 'opp-x', tier: 'FOCUS' },
    ])
    // Asset with empty supports should not appear in result
    const assets = [makeAsset('no-supports', 'Empty Asset', []), makeAsset('has-supports', 'Has Ones', ['opp-x'])]

    const result = buildReuseView(plan, assets)

    expect(result.length).toBe(1)
    expect(result[0].asset_id).toBe('has-supports')
  })

  it('maintains stable order by asset definition', () => {
    const plan = makePlan([
      { oppId: 'opp-1', tier: 'FOCUS' },
      { oppId: 'opp-2', tier: 'CONSIDER' },
      { oppId: 'opp-3', tier: 'SKIP' },
    ])
    const assets = [
      makeAsset('asset-c', 'Third Asset', ['opp-3']),
      makeAsset('asset-a', 'First Asset', ['opp-1']),
      makeAsset('asset-b', 'Second Asset', ['opp-2']),
    ]

    const result = buildReuseView(plan, assets)

    expect(result.map(r => r.asset_id)).toEqual(['asset-c', 'asset-a', 'asset-b'])
  })
})
