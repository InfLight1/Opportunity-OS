import type { TieredOpportunity, SharedGap } from './types';

/** A required_tag on an opportunity is a "gap" when no profile asset holds it. */
function findGapsForOpp(opp: TieredOpportunity, allAssetTagSet: Set<string>): string[] {
  const gaps: string[] = [];
  for (const tag of opp.opportunity.required_tags) {
    if (!allAssetTagSet.has(tag)) {
      gaps.push(tag);
    }
  }
  return gaps;
}

/** shared_gaps: required_tag missing from ALL assets, appearing on >=2 CONSIDER/FOCUS opps. */
export function findSharedGaps(
  tieredOpps: TieredOpportunity[],
  allAssetTagSet: Set<string>,
): SharedGap[] {
  const tagToOpps = new Map<string, Set<string>>();

  for (const opp of tieredOpps) {
    if (opp.tier !== 'CONSIDER' && opp.tier !== 'FOCUS') continue;
    const gaps = findGapsForOpp(opp, allAssetTagSet);
    for (const tag of gaps) {
      let set = tagToOpps.get(tag);
      if (!set) {
        set = new Set();
        tagToOpps.set(tag, set);
      }
      set.add(opp.opportunity.id);
    }
  }

  const shared: SharedGap[] = [];
  for (const [tag, oppIds] of tagToOpps.entries()) {
    if (oppIds.size >= 2) {
      shared.push({ tag: tag as never, affects: Array.from(oppIds).sort() });
    }
  }

  return shared;
}
