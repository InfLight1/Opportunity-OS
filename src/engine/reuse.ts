import type { Asset, Opportunity } from './types';

/** Compute asset.supports[] by tag overlap — never manual. */
export function computeSupports(
  _asset: Pick<Asset, 'tags' | 'id'>,
  opportunities: Opportunity[],
): string[] {
  const hasTag = new Set(_asset.tags);
  const ids: string[] = [];

  for (const opp of opportunities) {
    let matched = false;
    for (const t of opp.required_tags) {
      if (hasTag.has(t)) { matched = true; break; }
    }
    if (!matched) {
      let helpfulCount = 0;
      for (const t of opp.helpful_tags) {
        if (hasTag.has(t)) helpfulCount++;
      }
      if (helpfulCount >= 2) matched = true;
    }
    if (matched) ids.push(opp.id);
  }

  return ids;
}

/** Compute all asset supports in one pass, returns mutable assets with updated supports/reuse_count. */
export function buildAssetsWithSupports(
  assets: Asset[],
  opportunities: Opportunity[],
): Asset[] {
  const result = assets.map(asset => {
    const supports = computeSupports(asset, opportunities);
    return { ...asset, supports };
  });

  for (const asset of result) {
    asset.reuse_count = asset.supports.length;
  }

  return result;
}
