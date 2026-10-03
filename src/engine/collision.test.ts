import { describe, it, expect } from 'vitest';
import type { TieredOpportunity } from './types';
import { hasCollision, detectCollisions } from '../engine/collision';

const makeOpp = (deadline: string): TieredOpportunity => ({
  opportunity: { id: 'opp-1', title: 'Test', organization: 'Org', type: 'competition', description: '', grade_range: { min: 9, max: 12 }, location: { remote_ok: true, region: null }, prerequisites: [], required_tags: ['python'], helpful_tags: [], deadline, effort_hours: 4, participation: 'individual', submission_format: 'submission-format:demo', requirements: [], source_url: '' },
  tier: 'FOCUS', match: { matched_required: ['python'], helpful_match_count: 0, matched_helpful: [], gap_count: 0, reason: ''}, reuse_count: 2, gap_count: 0, has_busy_week_collision: false, eligible: true,
});

describe('hasCollision — normal cases', () => {
  it('returns true when deadline == busy period start', () => {
    expect(hasCollision(makeOpp('2026-10-20'), [{ start: '2026-10-20', end: '2026-10-27' }])).toBe(true);
  });
  it('returns true when deadline == busy period end', () => {
    expect(hasCollision(makeOpp('2026-10-27'), [{ start: '2026-10-20', end: '2026-10-27' }])).toBe(true);
  });
  it('returns true when deadline inside busy period', () => {
    expect(hasCollision(makeOpp('2026-10-23'), [{ start: '2026-10-20', end: '2026-10-27' }])).toBe(true);
  });
});

describe('hasCollision — boundary cases', () => {
  it('returns false when deadline == busy period start day minus 1 day', () => {
    expect(hasCollision(makeOpp('2026-10-19'), [{ start: '2026-10-20', end: '2026-10-27' }])).toBe(false);
  });
  it('returns false when deadline == busy period end day plus 1 day', () => {
    expect(hasCollision(makeOpp('2026-10-28'), [{ start: '2026-10-20', end: '2026-10-27' }])).toBe(false);
  });
});

describe('hasCollision — edge cases', () => {
  it('returns false when no busy periods given', () => {
    expect(hasCollision(makeOpp('2026-10-23'), [])).toBe(false);
  });
  it('returns true with multiple busy periods, matches first', () => {
    const bps = [
      { start: '2026-09-01', end: '2026-09-07' },
      { start: '2026-10-20', end: '2026-10-27' },
    ];
    expect(hasCollision(makeOpp('2026-09-05'), bps)).toBe(true);
  });
});

describe('detectCollisions — bulk detection', () => {
  it('sets has_busy_week_collision on all opps', () => {
    const o1 = makeOpp('2026-10-23'); // inside busy period
    const o2 = makeOpp('2026-11-15'); // outside
    detectCollisions([o1, o2], [{ start: '2026-10-20', end: '2026-10-27' }]);
    expect(o1.has_busy_week_collision).toBe(true);
    expect(o2.has_busy_week_collision).toBe(false);
  });

  it('returns the same array reference (in-place mutation)', () => {
    const arr = [makeOpp('2026-10-23')];
    const result = detectCollisions(arr, [{ start: '2026-10-20', end: '2026-10-27' }]);
    expect(result).toBe(arr);
  });
});
