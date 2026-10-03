import { describe, it, expect } from 'vitest'
import type { Plan as EnginePlan } from '../engine/types'
import { buildPlanView, type PlanRow } from './plan-view'

function makePlan(overrides: Partial<EnginePlan> & { tiered_opportunities: NonNullable<EnginePlan['tiered_opportunities']> }): EnginePlan {
  return {
    weekly_capacity_hours: overrides.weekly_capacity_hours ?? 8,
    busy_weeks: overrides.busy_weeks ?? [],
    tiered_opportunities: overrides.tiered_opportunities,
    shared_gaps: overrides.shared_gaps ?? [],
    next_action: overrides.next_action ?? null,
    weekly_load_warnings: overrides.weekly_load_warnings ?? [],
  }
}

function makeTieredOpportunity(  tier: 'FOCUS' | 'CONSIDER' | 'SKIP', id: string, title: string, deadline: string, effortHours: number, matchReason?: string, hasCollision = false): EnginePlan['tiered_opportunities'][number] {
  return {
    opportunity: {
      id,
      title,
      organization: '',
      type: '',
      description: '',
      grade_range: { min: 1, max: 12 },
      location: { remote_ok: true, region: null },
      prerequisites: [],
      required_tags: ['web-dev'],
      helpful_tags: [],
      deadline,
      effort_hours: effortHours,
      participation: 'individual' as const,
      submission_format: 'submission-format:demo' as const,
      requirements: [],
      source_url: '',
    },
    tier,
    match: matchReason ? { matched_required: ['web-dev'], helpful_match_count: 0, matched_helpful: [], gap_count: 0, reason: matchReason } : { matched_required: [], helpful_match_count: 0, matched_helpful: [], gap_count: 0, reason: '' },
    reuse_count: tier === 'FOCUS' ? 2 : 0,
    gap_count: tier === 'CONSIDER' ? 1 : 0,
    has_busy_week_collision: hasCollision,
    eligible: true,
  } as EnginePlan['tiered_opportunities'][number]
}

describe('plan-view', () => {
  it('FOCUS rows carry matched-tag reasons', () => {
    const focus = makeTieredOpportunity('FOCUS', 'opp-focus-1', 'Focus Opp', '2027-06-01', 4, 'Matched: web-dev | Eligibility: Eligible')
    const plan = makePlan({ tiered_opportunities: [focus] })
    const rows = buildPlanView(plan)
    expect(rows.length).toBe(1)
    expect(rows[0].tier).toBe('FOCUS')
    expect(rows[0].reasons.some(r => r.includes('Matched'))).toBe(true)
  })

  it('a collision row carries the busy-week label', () => {
    const focus = makeTieredOpportunity('CONSIDER', 'opp-busy', 'Busy Opp', '2026-10-10', 4, '', true)
    const plan = makePlan({ tiered_opportunities: [focus], busy_weeks: [{ start: '2026-10-05', end: '2026-10-20', label: 'exams' }] })
    const rows = buildPlanView(plan)
    expect(rows.length).toBe(1)
    expect(rows[0].busy_week_note).toContain('Collision')
  })

  it('every SKIP row has at least one reason', () => {
    const skip = makeTieredOpportunity('SKIP', 'opp-skip-1', 'Skip Opp', '2027-06-01', 4, 'No sufficient tag match')
    const plan = makePlan({ tiered_opportunities: [skip] })
    const rows = buildPlanView(plan)
    expect(rows.length).toBe(1)
    expect(rows[0].tier).toBe('SKIP')
    expect(rows[0].reasons.length).toBeGreaterThanOrEqual(1)
  })

  it('row order is stable: FOCUS then CONSIDER then SKIP', () => {
    const focus = makeTieredOpportunity('FOCUS', 'opp-f', 'Focus Opp', '2027-06-01', 4, 'Matched')
    const consider = makeTieredOpportunity('CONSIDER', 'opp-c', 'Consider Opp', '2027-07-01', 3, 'Matched')
    const skip = makeTieredOpportunity('SKIP', 'opp-s', 'Skip Opp', '2027-08-01', 5, 'No match')
    const plan = makePlan({ tiered_opportunities: [skip, focus, consider] })
    const rows = buildPlanView(plan)
    expect(rows[0].tier).toBe('FOCUS')
    expect(rows[1].tier).toBe('CONSIDER')
    expect(rows[2].tier).toBe('SKIP')
  })
})
