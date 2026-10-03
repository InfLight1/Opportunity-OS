/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import type { Asset, Opportunity } from './types';
import { computeSupports, buildAssetsWithSupports } from '../engine/reuse';

const makeOpp = (id: string, requiredTags: string[], helpfulTags: string[]): Opportunity => ({
  id, title: 'Test', organization: 'Org', type: 'competition', description: '', grade_range: { min: 9, max: 12 }, location: { remote_ok: true, region: null }, prerequisites: [], required_tags: requiredTags as any[], helpful_tags: helpfulTags as any[], deadline: '2026-11-30', effort_hours: 4, participation: 'individual', submission_format: 'submission-format:demo', requirements: [], source_url: '',
});

const makeAsset = (id: string, tags: string[]): Asset => ({ id, title: 'Test', description: '', kind: 'project', tags: tags as any[], supports: [], reuse_count: 0 });

describe('computeSupports — normal cases', () => {
  it('returns opp ids where asset tag overlaps required_tags', () => {
    const asset = makeAsset('a1', ['python']);
    const opps = [makeOpp('o1', ['python'], []), makeOpp('o2', ['web-dev'], [])];
    expect(computeSupports(asset, opps)).toEqual(['o1']);
  });

  it('returns opp ids where asset tag overlaps helpful_tags', () => {
    const asset = makeAsset('a1', ['python']);
    const opps = [makeOpp('o1', [], []), makeOpp('o2', ['java'], [])];
    expect(computeSupports(asset, opps)).toEqual([]);
  });

  it('returns opp ids when helpful_tags have >=2 matches', () => {
    const asset = makeAsset('a1', ['java', 'web-dev']);
    const opps = [makeOpp('o1', [], ['java', 'web-dev']), makeOpp('o2', ['python'], [])];
    expect(computeSupports(asset, opps)).toEqual(['o1']);
  });

  it('returns empty array when no overlap at all', () => {
    const asset = makeAsset('a1', ['python']);
    const opps = [makeOpp('o1', ['web-dev'], []), makeOpp('o2', ['java'], [])];
    expect(computeSupports(asset, opps)).toEqual([]);
  });

  it('returns multiple opp ids when both match', () => {
    const asset = makeAsset('a1', ['java', 'python']);
    const opps = [makeOpp('o1', ['python'], []), makeOpp('o2', [], ['java', 'python'])];
    expect(computeSupports(asset, opps)).toEqual(['o1', 'o2']);
  });

  it('test a: 1 required overlap, 0 helpful → supports', () => {
    const asset = makeAsset('a1', ['python']);
    const opps = [makeOpp('o1', ['python'], [])];
    expect(computeSupports(asset, opps)).toEqual(['o1']);
  });

  it('test b: 0 required, 1 helpful → does NOT support', () => {
    const asset = makeAsset('a1', ['python']);
    const opps = [makeOpp('o1', [], ['python'])];
    expect(computeSupports(asset, opps)).toEqual([]);
  });

  it('test c: 0 required, 2 helpful → supports', () => {
    const asset = makeAsset('a1', ['java', 'python']);
    const opps = [makeOpp('o1', [], ['java', 'python'])];
    expect(computeSupports(asset, opps)).toEqual(['o1']);
  });

  it('test d: 0 overlap → does NOT support', () => {
    const asset = makeAsset('a1', ['python']);
    const opps = [makeOpp('o1', ['java'], ['web-dev'])];
    expect(computeSupports(asset, opps)).toEqual([]);
  });
});

describe('computeSupports — boundary cases', () => {
  it('empty asset tags → no supports', () => {
    const asset = makeAsset('a1', []);
    const opps = [makeOpp('o1', [], [])];
    expect(computeSupports(asset, opps)).toEqual([]);
  });

  it('empty opps list → no supports', () => {
    const asset = makeAsset('a1', ['python']);
    expect(computeSupports(asset, [])).toEqual([]);
  });
});

describe('computeSupports — edge cases', () => {
  it('asset with tag matching both required AND helpful of same opp → counted once', () => {
    const asset = makeAsset('a1', ['python']);
    const opps = [makeOpp('o1', ['python'], ['python'])];
    expect(computeSupports(asset, opps)).toEqual(['o1']);
  });

  it('asset id not in returned list — only opp ids', () => {
    const asset = makeAsset('a1', ['python']);
    const opps = [makeOpp('o1', ['python'], [])];
    const result = computeSupports(asset, opps);
    expect(result).not.toContain('a1');
    expect(result).toContain('o1');
  });
});

describe('buildAssetsWithSupports', () => {
  it('sets supports and reuse_count on each asset', () => {
    const opps = [makeOpp('o1', ['python'], []), makeOpp('o2', [], ['java', 'web-dev'])];
    const assets = [makeAsset('a1', ['python']), makeAsset('a2', ['java', 'web-dev'])];
    const result = buildAssetsWithSupports(assets, opps);
    expect(result[0].supports).toEqual(['o1']);
    expect(result[0].reuse_count).toBe(1);
    expect(result[1].supports).toEqual(['o2']);
    expect(result[1].reuse_count).toBe(1);
  });

  it('reuse_count = length of supports list', () => {
    const opps = [makeOpp('o1', ['python'], []), makeOpp('o2', ['python'], []), makeOpp('o3', [], ['java', 'python'])];
    const assets = [makeAsset('a1', ['java', 'python'])];
    const result = buildAssetsWithSupports(assets, opps);
    expect(result[0].reuse_count).toBe(3);
  });

  it('boundary: reuse_count exactly 2 → supported by exactly 2 opps', () => {
    const opps = [makeOpp('o1', ['python'], []), makeOpp('o2', [], ['java', 'python'])];
    const assets = [makeAsset('a1', ['java', 'python'])];
    const result = buildAssetsWithSupports(assets, opps);
    expect(result[0].reuse_count).toBe(2);
  });
});
