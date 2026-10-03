import type { Asset, CommitState, Plan, Tag } from '../engine/types'
import { humanTag } from './exit-reason'

// --- Reuse web model (DESIGN-BRIEF s5.5) ---
// Projects on the left, opportunities on the right, one thread per
// asset.supports entry labelled with the matched tags. Shared gaps become a
// "No project yet" placeholder linked to the entries it would unlock.
// No counts anywhere: reuse is shown as threads, never as a number.

export type ReuseOppState = 'committed' | 'pursuable' | 'skipped'

export interface ReuseWebModel {
  projects: { id: string; title: string; missing: boolean }[]
  opportunities: { id: string; title: string; state: ReuseOppState; skipReason?: string }[]
  threads: { projectId: string; opportunityId: string; matchedTags: Tag[] }[]
}

const STATE_ORDER: Record<ReuseOppState, number> = { committed: 0, pursuable: 1, skipped: 2 }

export function buildReuseWeb(
  plan: Plan,
  assets: Asset[],
  commits: CommitState,
  skipReasons: Record<string, string | null>,
): ReuseWebModel {
  const byId = new Map(plan.tiered_opportunities.map(t => [t.opportunity.id, t]))
  const projects: ReuseWebModel['projects'] = []
  const threads: ReuseWebModel['threads'] = []
  const targetIds: string[] = []
  const addTarget = (id: string) => { if (!targetIds.includes(id)) targetIds.push(id) }

  for (const a of assets) {
    const supports = a.supports.filter(id => byId.has(id))
    if (supports.length === 0) continue
    projects.push({ id: a.id, title: a.title, missing: false })
    const held = new Set(a.tags)
    for (const id of supports) {
      const o = byId.get(id)!.opportunity
      const matchedTags = [...o.required_tags, ...o.helpful_tags].filter((t, i, all) => held.has(t) && all.indexOf(t) === i)
      threads.push({ projectId: a.id, opportunityId: id, matchedTags })
      addTarget(id)
    }
  }

  for (const g of plan.shared_gaps) {
    const affects = g.affects.filter(id => byId.has(id))
    if (affects.length === 0) continue
    const pid = `gap:${g.tag}`
    projects.push({ id: pid, title: `No project yet: ${humanTag(g.tag)}`, missing: true })
    for (const id of affects) {
      threads.push({ projectId: pid, opportunityId: id, matchedTags: [g.tag] })
      addTarget(id)
    }
  }

  const committed = new Set(commits.committed_ids)
  const opportunities: ReuseWebModel['opportunities'] = targetIds.map(id => {
    const t = byId.get(id)!
    if (t.tier === 'SKIP') return { id, title: t.opportunity.title, state: 'skipped', skipReason: skipReasons[id] ?? 'Not now' }
    return { id, title: t.opportunity.title, state: committed.has(id) ? 'committed' : 'pursuable' }
  })
  opportunities.sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state])
  return { projects, opportunities, threads }
}
