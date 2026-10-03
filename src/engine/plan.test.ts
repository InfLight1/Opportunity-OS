import { describe, it, expect } from 'vitest';
import type { Asset, TieredOpportunity, Plan, Tag } from './types';
import { buildPlan, detectWeeklyLoadWarnings } from '../engine/plan';

const makeFocus = (id: string, deadline: string, effort: number): TieredOpportunity => ({
  opportunity: { id, title: 'Test', organization: 'Org', type: 'competition', description: '', grade_range: { min: 9, max: 12 }, location: { remote_ok: true, region: null }, prerequisites: [], required_tags: ['python'] as Tag[], helpful_tags: [] as Tag[], deadline, effort_hours: effort, participation: 'individual', submission_format: 'submission-format:demo', requirements: [], source_url: '' },
  tier: 'FOCUS' as const, match: { matched_required: ['python'] as Tag[], helpful_match_count: 0, matched_helpful: [] as Tag[], gap_count: 0, reason: ''}, reuse_count: 2, gap_count: 0, has_busy_week_collision: false, eligible: true,
});

const makeFocusTag = (id: string, deadline: string, effort: number, tag: Tag): TieredOpportunity => ({
  opportunity: { id, title: 'Test', organization: 'Org', type: 'competition', description: '', grade_range: { min: 9, max: 12 }, location: { remote_ok: true, region: null }, prerequisites: [], required_tags: [tag] as Tag[], helpful_tags: [] as Tag[], deadline, effort_hours: effort, participation: 'individual', submission_format: 'submission-format:demo', requirements: [], source_url: '' },
  tier: 'FOCUS' as const, match: { matched_required: [tag] as Tag[], helpful_match_count: 0, matched_helpful: [] as Tag[], gap_count: 0, reason: ''}, reuse_count: 2, gap_count: 0, has_busy_week_collision: false, eligible: true,
});

const makeBase = (id: string, tier: 'FOCUS'|'CONSIDER'|'SKIP'): TieredOpportunity => ({
  opportunity: { id, title: 'Test', organization: 'Org', type: 'competition', description: '', grade_range: { min: 9, max: 12 }, location: { remote_ok: true, region: null }, prerequisites: [], required_tags: ['python'] as Tag[], helpful_tags: [] as Tag[], deadline: '2026-11-30', effort_hours: 4, participation: 'individual', submission_format: 'submission-format:demo', requirements: [], source_url: '' },
  tier, match: { matched_required: [] as Tag[], helpful_match_count: 0, matched_helpful: [] as Tag[], gap_count: 0, reason: ''}, reuse_count: 0, gap_count: 0, has_busy_week_collision: false, eligible: true,
});

describe('detectWeeklyLoadWarnings — normal cases', () => {
  it('returns warnings when effort exceeds weekly capacity in a single week', () => {
    const f1 = makeFocusTag('o1', '2026-09-30', 5, 'python');
    const f2 = makeFocusTag('o2', '2026-09-30', 4, 'web-dev'); // same week deadline
    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([f1, f2], busyPeriods, 8);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].required_hours).toBeGreaterThanOrEqual(9);
  });

  it('no warnings when weekly effort within capacity', () => {
    const f1 = makeFocusTag('o1', '2026-09-30', 4, 'python');
    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([f1], busyPeriods, 8);
    expect(warnings).toEqual([]);
  });

  it('handles multiple weeks with different load levels', () => {
    const f1 = makeFocusTag('o1', '2026-09-30', 5, 'python');
    const f2 = makeFocusTag('o2', '2026-10-14', 5, 'web-dev'); // different week
    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([f1, f2], busyPeriods, 8);
    expect(warnings).toEqual([]); // each week only has 5h, under 8h capacity
  });
});

describe('detectWeeklyLoadWarnings — boundary cases', () => {
  it('effort exactly equals capacity returns no warning', () => {
    const f1 = makeFocusTag('o1', '2026-09-30', 8, 'python');
    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([f1], busyPeriods, 8);
    expect(warnings).toEqual([]);
  });

  it('effort just over capacity triggers warning', () => {
    const f1 = makeFocusTag('o1', '2026-09-30', 9, 'python');
    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([f1], busyPeriods, 8);
    expect(warnings.length).toBe(1);
    expect(warnings[0].required_hours).toBe(9);
  });

  it('empty opps list returns no warnings', () => {
    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([], busyPeriods, 8);
    expect(warnings).toEqual([]);
  });
});

describe('detectWeeklyLoadWarnings — edge cases', () => {
  it('handles empty assets list', () => {
    const f = makeFocus('o1', '2026-11-30', 4);
    f.match.matched_required = ['python'] as Tag[];
    f.reuse_count = 0;
    f.gap_count = 0;

    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([f], busyPeriods, 8);
    expect(warnings).toEqual([]);
  });

  it('includes busy period warnings', () => {
    const f1 = makeFocusTag('o1', '2026-10-25', 4, 'python'); // deadline in midterms week
    const busyPeriods: Plan['busy_weeks'] = [{ start: '2026-10-20', end: '2026-10-27', label: 'Midterms' }];
    const warnings = detectWeeklyLoadWarnings([f1], busyPeriods, 8);
    expect(warnings.some(w => w.label === 'Midterms')).toBe(true);
  });

  it('handles opp with empty required_tags', () => {
    const opp: TieredOpportunity = makeFocusTag('o1', '2026-09-30', 4, 'python');
    opp.opportunity.required_tags = [];
    opp.reuse_count = 0;
    opp.match.helpful_match_count = 0;
    opp.gap_count = 0;
    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([opp], busyPeriods, 8);
    expect(warnings).toEqual([]); // single opp 4h <= 8h capacity
  });
});

describe('buildPlan — normal case', () => {
  it('assembles plan with all fields from engine inputs', () => {
    const f = makeFocus('o1', '2026-11-30', 4);
    f.match.matched_required = ['python'] as Tag[];
    f.reuse_count = 2;
    f.gap_count = 0;

    const a1: Asset = { id: 'a1', title: 'TestAsset', description: '', kind: 'project', tags: ['python'] as Tag[], supports: [], reuse_count: 0 };
    const busyPeriods = [{ start: '2026-10-20', end: '2026-10-27', label: 'Midterms' }];

    const result = buildPlan([f], [a1], 8, busyPeriods);
    expect(result.weekly_capacity_hours).toBe(8);
    expect(result.tiered_opportunities).toHaveLength(1);
    expect(result.shared_gaps).toBeDefined();
    expect(result.next_action).not.toBeNull();
  });

  it('returns null next_action when no focus opps', () => {
    const opp = makeBase('o1', 'SKIP');
    const a1: Asset = { id: 'a1', title: 'TestAsset', description: '', kind: 'project', tags: ['python'] as Tag[], supports: [], reuse_count: 0 };
    const busyPeriods: Plan['busy_weeks'] = [];
    const result = buildPlan([opp], [a1], 8, busyPeriods);
    expect(result.next_action).toBeNull();
  });

  it('returns tiered opps sorted by tier (FOCUS first)', () => {
    const f = makeFocus('o1', '2026-11-30', 4);
    f.match.matched_required = ['python'] as Tag[];
    f.reuse_count = 2;
    f.gap_count = 0;
    const skip = makeBase('o2', 'SKIP');

    const a1: Asset = { id: 'a1', title: 'TestAsset', description: '', kind: 'project', tags: ['python'] as Tag[], supports: [], reuse_count: 0 };
    const busyPeriods: Plan['busy_weeks'] = [];
    const result = buildPlan([f, skip], [a1], 8, busyPeriods);
    expect(result.tiered_opportunities).toHaveLength(2);
  });
});

describe('buildPlan — edge case', () => {
  it('handles empty tiered list gracefully', () => {
    const a1: Asset = { id: 'a1', title: 'TestAsset', description: '', kind: 'project', tags: ['python'] as Tag[], supports: [], reuse_count: 0 };
    const busyPeriods: Plan['busy_weeks'] = [];
    const result = buildPlan([], [a1], 8, busyPeriods);
    expect(result.tiered_opportunities).toEqual([]);
    expect(result.shared_gaps).toEqual([]);
  });

  it('handles empty assets list', () => {
    const f = makeFocus('o1', '2026-11-30', 4);
    f.match.matched_required = ['python'] as Tag[];
    f.reuse_count = 0;
    f.gap_count = 0;

    const busyPeriods: Plan['busy_weeks'] = [];
    const result = buildPlan([f], [], 8, busyPeriods);
    expect(result.tiered_opportunities).toHaveLength(1);
  });

  it('never demotes FOCUS, even when FOCUS effort exceeds capacity (no deprioritize step)', () => {
    const f1 = makeFocus('o1', '2026-10-05', 8);
    const f2 = makeFocus('o2', '2026-10-06', 8);

    const a1: Asset = { id: 'a1', title: 'TestAsset', description: '', kind: 'project', tags: ['python'] as Tag[], supports: [], reuse_count: 0 };
    const busyPeriods: Plan['busy_weeks'] = [];
    const result = buildPlan([f1, f2], [a1], 1, busyPeriods); // 16h FOCUS vs 1h/week
    expect(result.tiered_opportunities).toHaveLength(2);
    expect(result.tiered_opportunities.map(t => t.tier)).toEqual(['FOCUS', 'FOCUS']);
  });

  it('builds plan with weekly_load_warnings field populated', () => {
    const f = makeFocus('o1', '2026-09-30', 5); // short deadline week with effort
    const busyPeriods: Plan['busy_weeks'] = [];
    const result = buildPlan([f], [], 4, busyPeriods); // 5h > 4h capacity
    expect(Array.isArray(result.weekly_load_warnings)).toBe(true);
  });

  it('adds weekly_load_warnings when effort exceeds per-week capacity', () => {
    const f1 = makeFocusTag('o1', '2026-09-30', 5, 'python');
    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([f1], busyPeriods, 4);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].required_hours).toBeGreaterThanOrEqual(5);
  });

  it('no weekly_load_warnings when single opp within capacity', () => {
    const f = makeFocusTag('o1', '2026-09-30', 4, 'python');
    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([f], busyPeriods, 8);
    expect(warnings).toEqual([]);
  });

  it('empty focus opps produce empty weekly_load_warnings', () => {
    const busyPeriods: Plan['busy_weeks'] = [];
    const warnings = detectWeeklyLoadWarnings([], busyPeriods, 8);
    expect(warnings).toEqual([]);
  });
});
