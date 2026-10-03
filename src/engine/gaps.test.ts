import { describe, it, expect } from 'vitest';
import type { TieredOpportunity, Tag } from './types';
import { findSharedGaps } from '../engine/gaps';

const makeTieredOpp = (id: string, tier: string, requiredTags: Tag[]): TieredOpportunity => ({
  opportunity: { id, title: 'Test', organization: 'Org', type: 'competition', description: '', grade_range: { min: 9, max: 12 }, location: { remote_ok: true, region: null }, prerequisites: [], required_tags: requiredTags as Tag[], helpful_tags: [] as Tag[], deadline: '2026-11-30', effort_hours: 4, participation: 'individual', submission_format: 'submission-format:demo', requirements: [], source_url: '' },
  tier: tier as 'FOCUS' | 'CONSIDER' | 'SKIP', match: { matched_required: [] as Tag[], helpful_match_count: 0, matched_helpful: [] as Tag[], gap_count: 0, reason: ''}, reuse_count: 0, gap_count: 0, has_busy_week_collision: false, eligible: true,
});

describe('findSharedGaps — normal cases', () => {
  it('identifies a shared gap when missing tag appears on >=2 CONSIDER/FOCUS opps', () => {
    const o1 = makeTieredOpp('o1', 'FOCUS', ['python', 'web-dev']);
    const o2 = makeTieredOpp('o2', 'CONSIDER', ['leadership', 'web-dev']);
    // web-dev missing from assets → shared gap on both opps
    const allAssetTags = new Set(['python', 'leadership']);
    const result = findSharedGaps([o1, o2], allAssetTags);
    expect(result.length).toBe(1);
    expect(result[0].tag).toBe('web-dev');
    expect(result[0].affects).toEqual(['o1', 'o2']);
  });

  it('returns empty when shared gap appears on only 1 opp', () => {
    const o1 = makeTieredOpp('o1', 'FOCUS', ['web-dev']);
    const allAssetTags = new Set(['python']);
    const result = findSharedGaps([o1], allAssetTags);
    expect(result.length).toBe(0);
  });

  it('skips SKIP-tiered opps from gap analysis', () => {
    const o1 = makeTieredOpp('o1', 'SKIP', ['web-dev']);
    const o2 = makeTieredOpp('o2', 'FOCUS', ['web-dev']);
    const allAssetTags = new Set(['python']);
    const result = findSharedGaps([o1, o2], allAssetTags);
    // Only o2 counts → gap on 1 opp → not shared
    expect(result.length).toBe(0);
  });

  it('returns two shared gaps when same tags appear on multiple opps', () => {
    const o1 = makeTieredOpp('o1', 'FOCUS', ['web-dev', 'leadership']);
    const o2 = makeTieredOpp('o2', 'FOCUS', ['python', 'leadership']);
    const allAssetTags = new Set(['python']);
    const result = findSharedGaps([o1, o2], allAssetTags);
    expect(result.length).toBe(1); // only leadership shared
  });
});

describe('findSharedGaps — boundary cases', () => {
  it('gap count exactly 2 → qualifies as shared gap', () => {
    const o1 = makeTieredOpp('o1', 'FOCUS', ['web-dev']);
    const o2 = makeTieredOpp('o2', 'CONSIDER', ['web-dev']);
    const allAssetTags = new Set(['python']);
    const result = findSharedGaps([o1, o2], allAssetTags);
    expect(result.length).toBe(1);
  });

  it('gap count exactly 1 → does not qualify', () => {
    const o1 = makeTieredOpp('o1', 'FOCUS', ['web-dev']);
    const o2 = makeTieredOpp('o2', 'SKIP', ['web-dev']);
    const allAssetTags = new Set(['python']);
    const result = findSharedGaps([o1, o2], allAssetTags);
    expect(result.length).toBe(0);
  });

  it('no gaps at all (all required tags held by assets)', () => {
    const o1 = makeTieredOpp('o1', 'FOCUS', ['python']);
    const allAssetTags = new Set(['python']);
    const result = findSharedGaps([o1], allAssetTags);
    expect(result.length).toBe(0);
  });
});

describe('findSharedGaps — edge cases', () => {
  it('empty opps list returns no gaps', () => {
    const allAssetTags = new Set(['python']);
    expect(findSharedGaps([], allAssetTags)).toEqual([]);
  });

  it('empty asset tags → all required_tags are gaps', () => {
    const o1 = makeTieredOpp('o3', 'FOCUS', ['web-dev']);
    const o2 = makeTieredOpp('o4', 'CONSIDER', ['leadership']);
    const emptyAssetTags = new Set<string>();
    const result = findSharedGaps([o1, o2], emptyAssetTags);
    expect(result.length).toBe(0); // web-dev and leadership each on 1 opp only — not shared
  });

  it('same tag missing from assets but only appears on CONSIDER tier (qualifies)', () => {
    const o1 = makeTieredOpp('o1', 'CONSIDER', ['web-dev']);
    const o2 = makeTieredOpp('o2', 'CONSIDER', ['web-dev']);
    const allAssetTags = new Set<string>();
    const result = findSharedGaps([o1, o2], allAssetTags);
    expect(result.length).toBe(1);
  });

  it('opp with empty required_tags has no gaps for that opp', () => {
    const o1 = makeTieredOpp('o1', 'FOCUS', []);
    const o2 = makeTieredOpp('o2', 'FOCUS', ['web-dev']);
    const allAssetTags = new Set<string>();
    const result = findSharedGaps([o1, o2], allAssetTags);
    // Only o2 has gap → not shared (count=1)
    expect(result.length).toBe(0);
  });
});
