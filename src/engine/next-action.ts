import type { TieredOpportunity, NextAction, Asset } from './types';

/** 
 * Mechanical next-action from FOCUS opportunities.
 * Asset most appearing in gap.affects + reuse.supports — asset that unblocks the most focus opps.
 * Tie-break: earliest deadline among the opps it affects/unblocks.
 */
export function selectNextAction(
  focusOpps: TieredOpportunity[],
  allAssets: Map<string, Asset>,
): NextAction | null {
  if (focusOpps.length === 0) return null;

  // Count how many focus opps each candidate asset appears across.
  const counts = new Map<string, number>();
  for (const [assetId] of allAssets.entries()) {
    counts.set(assetId, 0);
  }

  for (const opp of focusOpps) {
    // Check which assets have tag overlap with this opportunity
    for (const [assetId, asset] of allAssets.entries()) {
      let hasOverlap = false;
      for (const tag of asset.tags) {
        if (opp.opportunity.required_tags.includes(tag as never) ||
            opp.opportunity.helpful_tags.includes(tag as never)) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) {
        counts.set(assetId, (counts.get(assetId) || 0) + 1);
      }
    }
  }

  let bestAssetId: string | null = null;
  let bestCount = -1;
  let earliestDeadline: string | null = null;

  for (const [assetId, count] of counts.entries()) {
    if (count === 0) continue;

    // Find earliest deadline among the focus opps that this asset helps.
    let oppEarliest: string | null = null;
    let hasOverlapForThis = false;
    for (const opp of focusOpps) {
      const a = allAssets.get(assetId)!;
      let overlap = false;
      for (const tag of opp.opportunity.required_tags) {
        if (a.tags.includes(tag as never)) { overlap = true; break; }
      }
      if (!overlap) {
        for (const tag of opp.opportunity.helpful_tags) {
          if (a.tags.includes(tag as never)) { overlap = true; break; }
        }
      }
      if (overlap) {
        hasOverlapForThis = true;
        if (!oppEarliest || opp.opportunity.deadline < oppEarliest) {
          oppEarliest = opp.opportunity.deadline;
        }
      }
    }

    if (!hasOverlapForThis) continue;

    // Tie-break: earlier deadline wins.
    if (count > bestCount || (count === bestCount && (earliestDeadline === null || oppEarliest! < earliestDeadline))) {
      bestCount = count;
      bestAssetId = assetId;
      earliestDeadline = oppEarliest;
    }
  }

  if (!bestAssetId) return null;

  // Find the specific opportunity with the earliest unblocked deadline for this asset.
  let bestOppId: string | null = null;
  let bestOppEarliest: string | null = null;

  for (const opp of focusOpps) {
    // Check if this asset matches this opp
    let overlap = false;
    const a = allAssets.get(bestAssetId)!;
    for (const tag of opp.opportunity.required_tags) {
      if (a.tags.includes(tag as never)) { overlap = true; break; }
    }
    if (!overlap) {
      for (const tag of opp.opportunity.helpful_tags) {
        if (a.tags.includes(tag as never)) { overlap = true; break; }
      }
    }
    if (overlap) {
      if (!bestOppEarliest || opp.opportunity.deadline < bestOppEarliest) {
        bestOppEarliest = opp.opportunity.deadline;
        bestOppId = opp.opportunity.id;
      }
    }
  }

  if (!bestOppId) return null;
  return { asset_id: bestAssetId, opportunity_id: bestOppId };
}
