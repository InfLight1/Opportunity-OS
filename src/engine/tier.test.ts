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
  it('SKIP when effort_hours > available_hours (runway)', () => { const t = makeOpp(); t.match.matched_required = ['python']; computeTier(t, 3); expect(t.tier).toBe('SKIP'); });
  it('FOCUS when >=1 required match AND no collision AND reuse_count>=2', () => { const t = makeOpp(); t.match.matched_required = ['python']; t.reuse_count = 2; computeTier(t, 8); expect(t.tier).toBe('FOCUS'); });
  it('FOCUS when >=1 required match AND no collision AND gap_count==0', () => { const t = makeOpp(); t.match.matched_required = ['python']; t.gap_count = 0; computeTier(t, 8); expect(t.tier).toBe('FOCUS'); });
  it('CONSIDER when collision blocks FOCUS but has match', () => { const t = makeOpp({ required_tags: ['python'], helpful_tags: [] }); t.gap_count = 1; t.reuse_count = 0; t.match.matched_required = ['python']; t.has_busy_week_collision = true; computeTier(t, 8); expect(t.tier).toBe('CONSIDER'); });
  it('CONSIDER when has match and no collision but reuse<2 AND gaps>0', () => { const t = makeOpp({ required_tags: ['python'], helpful_tags: [] }); t.match.matched_required = ['python']; t.reuse_count = 1; t.gap_count = 1; computeTier(t, 8); expect(t.tier).toBe('CONSIDER'); });
});

describe('computeTier — boundary cases', () => {
  it('reuse_count exactly 2 → FOCUS', () => { const t = makeOpp(); t.match.matched_required = ['python']; t.reuse_count = 2; t.gap_count = 1; computeTier(t, 8); expect(t.tier).toBe('FOCUS'); });
  it('reuse_count exactly 1 → not enough for FOCUS (with gaps)', () => { const t = makeOpp(); t.match.matched_required = ['python']; t.reuse_count = 1; t.gap_count = 1; computeTier(t, 8); expect(t.tier).toBe('CONSIDER'); });
  it('effort_hours exactly == available_hours -> not SKIP', () => { const t = makeOpp(); t.match.matched_required = ['python']; computeTier(t, 4); expect(t.tier).not.toBe('SKIP'); });
});

describe('computeTier — edge cases', () => {
  it('no required tags on opportunity at all → SKIP', () => { const t = makeOpp({ required_tags: [] }); computeTier(t, 8); expect(t.tier).toBe('SKIP'); });
  it('collision AND zero matches → SKIP (first SKIP condition wins)', () => { const t = makeOpp({ required_tags: ['web-dev'], helpful_tags: [] }); t.gap_count = 1; t.match.matched_required = []; t.has_busy_week_collision = true; computeTier(t, 8); expect(t.tier).toBe('SKIP'); });
  it('eligible=false AND matched → SKIP (eligibility checked before match)', () => { const t = makeOpp({ required_tags: ['python'], helpful_tags: []}); t.match.matched_required = ['python']; t.eligible = false; computeTier(t, 8); expect(t.tier).toBe('SKIP'); });
});

describe('tierAll', () => {
  it('tiers all opportunities in batch', () => { const a = makeOpp(); a.match.matched_required = ['python']; const b = makeOpp(); b.eligible = false; const result = tierAll([a, b], 8, '2026-10-03', []); expect(result[1].tier).toBe('SKIP'); });
});

describe('tierAll - runway rule (rolling buckets from today 2026-10-03, capacity 10)', () => {
  const TODAY = '2026-10-03';
  it('effort above one week but within runway is NOT SKIP (old single-week rule would SKIP)', () => {
    const t = makeOpp({ effort_hours: 30, deadline: '2026-12-01' }); t.match.matched_required = ['python'];
    tierAll([t], 10, TODAY, []); expect(t.tier).toBe('FOCUS');
  });
  it('effort above runway -> SKIP (due bucket 1: 20 h available, needs 30 h)', () => {
    const t = makeOpp({ effort_hours: 30, deadline: '2026-10-12' }); t.match.matched_required = ['python'];
    tierAll([t], 10, TODAY, []); expect(t.tier).toBe('SKIP');
  });
  it('effort == runway -> not SKIP (due bucket 1: 20 h available, needs 20 h)', () => {
    const t = makeOpp({ effort_hours: 20, deadline: '2026-10-12' }); t.match.matched_required = ['python'];
    tierAll([t], 10, TODAY, []); expect(t.tier).toBe('FOCUS');
  });
  it('busy days shrink runway: due 10-26 with midterms 10-20..10-27 -> 29 h, 30 h -> SKIP', () => {
    const t = makeOpp({ effort_hours: 30, deadline: '2026-10-26' }); t.match.matched_required = ['python'];
    tierAll([t], 10, TODAY, [{ start: '2026-10-20', end: '2026-10-27' }]); expect(t.tier).toBe('SKIP');
  });
  it('deadline today -> only bucket 0 counts', () => {
    const t = makeOpp({ effort_hours: 11, deadline: TODAY }); t.match.matched_required = ['python'];
    tierAll([t], 10, TODAY, []); expect(t.tier).toBe('SKIP');
  });
});
