import type { Plan as EnginePlan, Asset } from '../engine/types'

export interface ReuseCategory {
  asset_id: string
  asset_title: string
  pursueable: string[]   // opp ids that are FOCUS/CONSIDER
  skipped: string[]      // opp ids that are SKIP
}

export type ReuseView = ReuseCategory[]

export function buildReuseView(plan: EnginePlan, assets: Asset[]): ReuseView {
  const tierMap = new Map<string, string>()
  for (const t of plan.tiered_opportunities) {
    tierMap.set(t.opportunity.id, t.tier)
  }

  const result: ReuseCategory[] = []

  for (const a of assets) {
    if (!a.supports || a.supports.length === 0) continue

    const pursueable: string[] = []
    const skipped: string[] = []

    for (const sid of a.supports) {
      const tier = tierMap.get(sid)
      if (tier === 'FOCUS' || tier === 'CONSIDER') {
        pursueable.push(sid)
      } else {
        skipped.push(sid)
      }
    }

    result.push({
      asset_id: a.id,
      asset_title: a.title,
      pursueable,
      skipped,
    })
  }

  return result
}
