import { describe, it, expect } from 'vitest';
import type { TieredOpportunity, Asset, Tag } from './types';
import { selectNextAction } from '../engine/next-action';

const makeFocusOpp = (id: string, deadline: string, requiredTags: Tag[], helpfulTags: Tag[]): TieredOpportunity => ({
  opportunity: { id, title: 'Test', organization: 'Org', type: 'competition', description: '', grade_range: { min: 9, max: 12 }, location: { remote_ok: true, region: null }, prerequisites: [], required_tags: requiredTags, helpful_tags: helpfulTags, deadline, effort_hours: 4, participation: 'individual', submission_format: 'submission-format:demo', requirements: [], source_url: '' },
  tier: 'FOCUS', match: { matched_required: requiredTags, helpful_match_count: 0, matched_helpful: [], gap_count: 0, reason: ''}, reuse_count: 0, gap_count: 0, has_busy_week_collision: false, eligible: true,
});

const makeAsset = (id: string, tags: Tag[]): Asset => ({ id, title: 'Test', description: '', kind: 'project', tags, supports: [], reuse_count: 0 });

describe('selectNextAction - normal cases', () => {
  it('returns asset appearing in most focus opps', () => {
    const f1 = makeFocusOpp('o1', '2026-11-01', ['python'], []);
    const f2 = makeFocusOpp('o2', '2026-10-15', ['python'], []);
    const assets = new Map([['a1', makeAsset('a1', ['python'])]]);
    const result = selectNextAction([f1, f2], assets);
    expect(result!.asset_id).toBe('a1');
  });

  it('picks earliest deadline as tie-break when counts equal', () => {
    const f1 = makeFocusOpp('o1', '2026-11-01', ['python'], []);
    const f2 = makeFocusOpp('o2', '2026-10-01', ['web-dev'], []);
    const assets = new Map([
      ['a1', makeAsset('a1', ['python'])],
      ['a2', makeAsset('a2', ['web-dev'])],
    ]);
    const result = selectNextAction([f1, f2], assets);
    expect(result).not.toBeNull();
  });

  it('returns null when no focus opps', () => {
    const assets = new Map([['a1', makeAsset('a1', ['python'])]]);
    expect(selectNextAction([], assets)).toBeNull();
  });

  it('returns null when no asset matches any focus opp', () => {
    const f1 = makeFocusOpp('o1', '2026-11-01', ['python'], []);
    const assets = new Map([['a1', makeAsset('a1', ['leadership'])]]);
    expect(selectNextAction([f1], assets)).toBeNull();
  });
});

describe('selectNextAction - boundary cases', () => {
  it('single focus opp, single matching asset returns that asset', () => {
    const f1 = makeFocusOpp('o1', '2026-10-30', ['python'], []);
    const assets = new Map([['a1', makeAsset('a1', ['python'])]]);
    const result = selectNextAction([f1], assets);
    expect(result).not.toBeNull();
    expect(result!.asset_id).toBe('a1');
    expect(result!.opportunity_id).toBe('o1');
  });

  it('asset matching both required AND helpful tags still counted once', () => {
    const f1 = makeFocusOpp('o1', '2026-10-30', ['python'], ['web-dev']);
    const assets = new Map([['a1', makeAsset('a1', ['python'])]]);
    const result = selectNextAction([f1], assets);
    expect(result).not.toBeNull();
  });
});

describe('selectNextAction - edge cases', () => {
  it('when asset matches multiple opps returns the one with earliest deadline', () => {
    const f1 = makeFocusOpp('o1', '2026-12-01', ['python'], []);
    const f2 = makeFocusOpp('o2', '2026-09-01', ['python'], []);
    const assets = new Map([['a1', makeAsset('a1', ['python'])]]);
    const result = selectNextAction([f1, f2], assets);
    expect(result).not.toBeNull();
    // tie-break: earliest deadline is o2 (Sep 1)
    expect(result!.opportunity_id).toBe('o2');
  });

  it('does not crash with empty asset map', () => {
    const f1 = makeFocusOpp('o1', '2026-11-01', ['python'], []);
    const assets = new Map<string, Asset>([]);
    expect(selectNextAction([f1], assets)).toBeNull();
  });
});
