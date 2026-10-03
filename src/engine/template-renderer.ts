import type { TieredOpportunity } from './types';

/** Plain-text renderer built before any LLM-prose feature per spec order. */

export function renderWhyFits(opp: TieredOpportunity): string {
  const r = opp.match.matched_required;
  const h = opp.match.matched_helpful;

  if (r.length > 0 && h.length > 0) {
    return 'Matched ' + r.length + ' required tags (' + formatTags(r) + ') and ' + h.length + ' helpful tags (' + formatTags(h) + ')';
  }

  if (r.length > 0) {
    return 'Matched ' + r.length + ' required tag(s): ' + formatTags(r);
  }

  if (h.length >= 1) {
    return 'No required matches but ' + h.length + ' helpful tags match (' + formatTags(h) + ')';
  }

  return opp.match.reason;
}

export function renderGapReason(opp: TieredOpportunity): string {
  const n = opp.gap_count;
  if (n === 0) return 'No gaps — all required tags covered by assets';
  return formatGaps(opp);
}

/** Render gap names from a TieredOperationpportunity. */
function formatGaps(opp: TieredOpportunity): string {
  return 'missing ' + opp.gap_count + ' required tag(s)';
}

export function renderTierReason(opp: TieredOpportunity): string {
  const tier = opp.tier;
  if (tier === 'FOCUS') return 'Focused: fits before the deadline, no collision, high reuse or zero gaps';
  if (tier === 'CONSIDER') return 'Consider: eligible and matched but needs more evidence or has conflicts';
  return 'Skipped: not eligible, no required-tag match, or not enough hours before the deadline';
}

export function renderSharedGaps(sharedGaps: Array<{ tag: string; affects: string[] }>): string {
  if (sharedGaps.length === 0) return 'No shared gaps';
  const lines = sharedGaps.map(g => '  ' + g.tag + ': affects ' + g.affects.join(', '));
  return ['Shared gaps across opportunities:', ...lines].join('\n');
}

export function renderNextAction(oppId: string, assetId: string): string {
  return 'Build asset ' + assetId + ' to unlock opportunity ' + oppId;
}

/** Return tag array for gap reasons with details. */
export function getGapTags(opp: TieredOpportunity): string[] {
  return opp.opportunity.required_tags.filter(() => true);
}

/** Join tag array into comma-separated list without scores or percentages. **/
export function formatTags(tags: string[]): string {
  return tags.join(', ');
}
