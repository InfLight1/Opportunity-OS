import { describe, it, expect } from 'vitest';
import type { TieredOpportunity } from './types';
import { computeTier, tierAll } from '../engine/tier';

const makeOpp = (extra?: Partial<TieredOpportunity['opportunity']>): TieredOpportunity => ({
  opportunity: {
    id: 'opp-test', title: 'Test Opp', organization: 'Org', type: 'competition', description: 'desc', grade_range: { min: 9, max: 12 }, location: { remote_ok: true, region: null }, prerequisites: [], required_tags: ['python'], helpful_tags: [], deadline: '2026-11-30', effort_hours: 4, participation: 'individual', submission_format: 'submission-format:demo', requirements: ['r1'], source_url: 'https://example.com', ...extra,
  }, tier: 'CONSIDER', match: { matched_required: [], helpful_match_count: 0, matched_helpful: [], gap_count: 0, reason: ''}, reuse_count: 0, gap_count: 0, has_busy_week_collision: false, eligible: true,
});

describe('computeTier — normal cases', () => {
  it('SKIP on failed eligibility', () => { const t = makeOpp(); t.eligible = false; t.match.matched_required = ['python']; computeTier(t, 8); expect(t.tier).toBe('SKIP'); });
  it('SKIP on zero required_tag matches', () => { const t = makeOpp(); t.match.matched_required = []; computeTier(t, 8); expect(t.tier).toBe('SKIP'); });
  it('SKIP when effort_hours > remaining_capacity', () => { const t = makeOpp(); t.match.matched_required = ['python']; computeTier(t, 3); expect(t.tier).toBe('SKIP'); });
  it('FOCUS when >=1 required match AND no collision AND reuse_count>=2', () => { const t = makeOpp(); t.match.matched_required = ['python']; t.reuse_count = 2; computeTier(t, 8); expect(t.tier).toBe('FOCUS'); });
  it('FOCUS when >=1 required match AND no collision AND gap_count==0', () => { const t = makeOpp(); t.match.matched_required = ['python']; t.gap_count = 0; computeTier(t, 8); expect(t.tier).toBe('FOCUS'); });
  it('CONSIDER when collision blocks FOCUS but has match', () => { const t = makeOpp({ required_tags: ['python'], helpful_tags: [] }); t.gap_count = 1; t.reuse_count = 0; t.match.matched_required = ['python']; t.has_busy_week_collision = true; computeTier(t, 8); expect(t.tier).toBe('CONSIDER'); });
  it('CONSIDER when has match and no collision but reuse<2 AND gaps>0', () => { const t = makeOpp({ required_tags: ['python'], helpful_tags: [] }); t.match.matched_required = ['python']; t.reuse_count = 1; t.gap_count = 1; computeTier(t, 8); expect(t.tier).toBe('CONSIDER'); });
});

describe('computeTier — boundary cases', () => {
  it('reuse_count exactly 2 → FOCUS', () => { const t = makeOpp(); t.match.matched_required = ['python']; t.reuse_count = 2; t.gap_count = 1; computeTier(t, 8); expect(t.tier).toBe('FOCUS'); });
  it('reuse_count exactly 1 → not enough for FOCUS (with gaps)', () => { const t = makeOpp(); t.match.matched_required = ['python']; t.reuse_count = 1; t.gap_count = 1; computeTier(t, 8); expect(t.tier).toBe('CONSIDER'); });
  it('effort_hours exactly == weekly_capacity → not SKIP', () => { const t = makeOpp(); t.match.matched_required = ['python']; computeTier(t, 4); expect(t.tier).not.toBe('SKIP'); });
});

describe('computeTier — edge cases', () => {
  it('no required tags on opportunity at all → SKIP', () => { const t = makeOpp({ required_tags: [] }); computeTier(t, 8); expect(t.tier).toBe('SKIP'); });
  it('collision AND zero matches → SKIP (first SKIP condition wins)', () => { const t = makeOpp({ required_tags: ['web-dev'], helpful_tags: [] }); t.gap_count = 1; t.match.matched_required = []; t.has_busy_week_collision = true; computeTier(t, 8); expect(t.tier).toBe('SKIP'); });
  it('eligible=false AND matched → SKIP (eligibility checked before match)', () => { const t = makeOpp({ required_tags: ['python'], helpful_tags: []}); t.match.matched_required = ['python']; t.eligible = false; computeTier(t, 8); expect(t.tier).toBe('SKIP'); });
});

describe('tierAll', () => {
  it('tiers all opportunities in batch', () => { const a = makeOpp(); a.match.matched_required = ['python']; const b = makeOpp(); b.eligible = false; const result = tierAll([a, b], 8); expect(result[1].tier).toBe('SKIP'); });
});
