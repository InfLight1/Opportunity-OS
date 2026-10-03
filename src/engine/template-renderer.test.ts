import { describe, it, expect } from 'vitest';
import type { TieredOpportunity, Tag } from './types';
import {
  renderWhyFits,
  renderGapReason,
  renderTierReason,
  renderSharedGaps,
  renderNextAction,
  formatTags,
  getGapTags,
} from '../engine/template-renderer';

const makeOpp = (match: { matched_required: Tag[]; matched_helpful: Tag[]; gap_count: number; reason: string }): TieredOpportunity => ({
  opportunity: { id: 'o1', title: 'Test', organization: 'Org', type: 'competition', description: '', grade_range: { min: 9, max: 12 }, location: { remote_ok: true, region: null }, prerequisites: [], required_tags: ['python', 'web-dev'] as Tag[], helpful_tags: ['ai-interest'] as Tag[], deadline: '2026-11-30', effort_hours: 4, participation: 'individual', submission_format: 'submission-format:demo', requirements: [], source_url: '' },
  tier: 'FOCUS' as const, match: { matched_required: match.matched_required, helpful_match_count: match.matched_helpful.length, matched_helpful: match.matched_helpful, gap_count: match.gap_count, reason: match.reason }, reuse_count: 2, gap_count: match.gap_count, has_busy_week_collision: false, eligible: true,
});

describe('renderWhyFits — normal cases', () => {
  it('renders both required and helpful matches', () => {
    const opp = makeOpp({ matched_required: ['python'], matched_helpful: ['ai-interest'], gap_count: 0, reason: '' });
    const result = renderWhyFits(opp);
    expect(result).toContain('Matched');
    expect(result).toContain('required tags');
    expect(result).toContain('helpful tags');
  });

  it('renders only required matches', () => {
    const opp = makeOpp({ matched_required: ['python'], matched_helpful: [], gap_count: 0, reason: '' });
    const result = renderWhyFits(opp);
    expect(result).toContain('Matched');
    expect(result).toContain('1 required');
  });

  it('falls back to match.reason when no matches', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 2, reason: 'No sufficient match' });
    const result = renderWhyFits(opp);
    expect(result).toBe('No sufficient match');
  });

  it('handles helpful match without required', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: ['python'], gap_count: 1, reason: '' });
    const result = renderWhyFits(opp);
    expect(result).toContain('helpful tags match');
  });
});

describe('renderWhyFits — boundary cases', () => {
  it('zero matches returns raw reason string', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 3, reason: 'Custom reason' });
    expect(renderWhyFits(opp)).toBe('Custom reason');
  });

  it('large match counts work', () => {
    const opp = makeOpp({
      matched_required: ['python', 'web-dev', 'ai-ml'],
      matched_helpful: ['leadership', 'public-speaking'],
      gap_count: 0,
      reason: '',
    });
    const result = renderWhyFits(opp);
    expect(result).toContain('3 required tags');
    expect(result).toContain('2 helpful tags');
  });

  it('no required_tags on opp (empty set)', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 0, reason: 'No tags at all' });
    expect(renderWhyFits(opp)).toBe('No tags at all');
  });
});

describe('renderWhyFits — edge cases', () => {
  it('empty strings in match arrays handled gracefully', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 0, reason: 'Empty' });
    expect(renderWhyFits(opp)).toBe('Empty');
  });

  it('single helpful tag counts (even though not enough for matching)', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: ['python'], gap_count: 1, reason: '' });
    const result = renderWhyFits(opp);
    expect(result).toContain('helpful tags match');
  });
});

describe('renderGapReason', () => {
  it('returns no-gaps message when gap_count == 0', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 0, reason: '' });
    expect(renderGapReason(opp)).toContain('No gaps');
  });

  it('returns gap count message when gaps exist', () => {
    const opp = makeOpp({ matched_required: ['python'], matched_helpful: [], gap_count: 1, reason: '' });
    expect(renderGapReason(opp)).toContain('missing 1 required tag(s)');
  });

  it('handles multiple gaps', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 3, reason: '' });
    expect(renderGapReason(opp)).toContain('missing 3 required tag(s)');
  });

  it('edge: large gap count', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 10, reason: '' });
    expect(renderGapReason(opp)).toContain('missing 10 required tag(s)');
  });
});

describe('renderTierReason', () => {
  it('renders FOCUS tier message', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 0, reason: '' });
    opp.tier = 'FOCUS' as const;
    expect(renderTierReason(opp)).toContain('Focused');
  });

  it('renders CONSIDER tier message', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 0, reason: '' });
    opp.tier = 'CONSIDER' as const;
    expect(renderTierReason(opp)).toContain('Consider');
  });

  it('renders SKIP tier message', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 0, reason: '' });
    opp.tier = 'SKIP' as const;
    expect(renderTierReason(opp)).toContain('Skipped');
  });
});

describe('renderSharedGaps', () => {
  it('returns no-gaps message when empty', () => {
    expect(renderSharedGaps([])).toBe('No shared gaps');
  });

  it('renders single shared gap with affects list', () => {
    const result = renderSharedGaps([{ tag: 'web-dev', affects: ['o1', 'o2'] }]);
    expect(result).toContain('Shared gaps across opportunities');
    expect(result).toContain('web-dev');
    expect(result).toContain('o1, o2');
  });

  it('renders multiple shared gaps', () => {
    const result = renderSharedGaps([
      { tag: 'web-dev', affects: ['o1'] },
      { tag: 'leadership', affects: ['o2', 'o3'] },
    ]);
    expect(result).toContain('web-dev');
    expect(result).toContain('leadership');
  });

  it('edge: gap with single opp in affects', () => {
    const result = renderSharedGaps([{ tag: 'test-tag', affects: ['o1'] }]);
    expect(result).toContain('test-tag');
    expect(result).toContain('o1');
  });
});

describe('renderNextAction', () => {
  it('renders asset and opp ids', () => {
    const result = renderNextAction('o-1', 'a-2');
    expect(result).toContain('o-1');
    expect(result).toContain('a-2');
  });

  it('edge: empty string ids still rendered', () => {
    const result = renderNextAction('', '');
    expect(result).toBe('Build asset  to unlock opportunity ');
  });
});

describe('formatTags', () => {
  it('joins tags with commas', () => {
    expect(formatTags(['python', 'web-dev'])).toBe('python, web-dev');
  });

  it('single tag returns just that tag', () => {
    expect(formatTags(['python'])).toBe('python');
  });

  it('empty array returns empty string', () => {
    expect(formatTags([])).toBe('');
  });

  it('edge: many tags joined correctly', () => {
    const result = formatTags(['a', 'b', 'c', 'd', 'e']);
    expect(result).toBe('a, b, c, d, e');
  });
});

describe('getGapTags', () => {
  it('returns all required_tags from opp', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 0, reason: '' });
    opp.opportunity.required_tags = ['python', 'web-dev', 'ai-ml'];
    const result = getGapTags(opp);
    expect(result).toEqual(['python', 'web-dev', 'ai-ml']);
  });

  it('returns empty array when no required_tags', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 0, reason: '' });
    opp.opportunity.required_tags = [];
    expect(getGapTags(opp)).toEqual([]);
  });

  it('edge: single required tag', () => {
    const opp = makeOpp({ matched_required: [], matched_helpful: [], gap_count: 0, reason: '' });
    opp.opportunity.required_tags = ['leadership'];
    expect(getGapTags(opp)).toEqual(['leadership']);
  });
});

describe('renderWhyFits — no scores or percentages allowed (spec rule)', () => {
  it("does not contain '%' in output", () => {
    const opp = makeOpp({ matched_required: ['python', 'web-dev'], matched_helpful: ['ai-interest'], gap_count: 0, reason: '' });
    expect(renderWhyFits(opp)).not.toContain('%');
  });
});
