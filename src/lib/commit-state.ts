import type { CommitState, Opportunity, TieredOpportunity } from '../engine/types'
import { isSchedulable } from '../engine/schedule'

// --- Commit state (AGENTS.md Commit state) ---
// Pure helpers; the only side effects are in loadCommitState/saveCommitState,
// which take the storage object as an argument.

export const COMMITS_STORAGE_KEY = 'opportunity-os:commits'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export type DroppedCommit = { id: string; title: string; reason: string }

export function emptyCommitState(): CommitState {
  return { committed_ids: [] }
}

/** Committable = not SKIP and schedulable (deadline today or later, effort > 0). */
export function isCommittable(tiered: TieredOpportunity, today: string): boolean {
  return tiered.tier !== 'SKIP' && isSchedulable(tiered.opportunity, today)
}

/** Why a card cannot be committed, or null when it can. */
export function lockReason(tiered: TieredOpportunity, today: string): string | null {
  if (isCommittable(tiered, today)) return null
  if (tiered.tier === 'SKIP') return tiered.match.reason.split(' | ')[0] || 'Skipped'
  return 'Needs a deadline and an effort estimate'
}

/**
 * Keep only string ids that exist in the dataset, once each, in first-seen
 * order. Anything malformed yields an empty state (never throws).
 */
export function normalizeCommitState(raw: unknown, knownIds: Iterable<string>): CommitState {
  if (raw === null || typeof raw !== 'object') return emptyCommitState()
  const ids = (raw as Record<string, unknown>).committed_ids
  if (!Array.isArray(ids)) return emptyCommitState()
  const known = new Set(knownIds)
  const seen = new Set<string>()
  const committed_ids: string[] = []
  for (const id of ids) {
    if (typeof id !== 'string' || !known.has(id) || seen.has(id)) continue
    seen.add(id)
    committed_ids.push(id)
  }
  return { committed_ids }
}

export function loadCommitState(storage: StorageLike, knownIds: Iterable<string>): CommitState {
  try {
    const raw = storage.getItem(COMMITS_STORAGE_KEY)
    if (!raw) return emptyCommitState()
    return normalizeCommitState(JSON.parse(raw), knownIds)
  } catch {
    return emptyCommitState()
  }
}

export function saveCommitState(storage: StorageLike, state: CommitState): void {
  try { storage.setItem(COMMITS_STORAGE_KEY, JSON.stringify(state)) } catch { /* storage full or unavailable */ }
}

export function isCommitted(state: CommitState, id: string): boolean {
  return state.committed_ids.includes(id)
}

/** Uncommit if committed; commit only if committable. Returns a new state. */
export function toggleCommit(state: CommitState, tiered: TieredOpportunity, today: string): CommitState {
  const id = tiered.opportunity.id
  if (isCommitted(state, id)) return { committed_ids: state.committed_ids.filter(c => c !== id) }
  if (!isCommittable(tiered, today)) return state
  return { committed_ids: [...state.committed_ids, id] }
}

/**
 * Committed items that are locked under `tiered` (e.g. tiers recomputed at a
 * lower capacity), with the lock reason. Used for the what-if preview
 * ("dropped at this capacity") and for the auto-uncommit notice.
 */
export function droppedCommits(state: CommitState, tiered: TieredOpportunity[], today: string): DroppedCommit[] {
  const byId = new Map(tiered.map(t => [t.opportunity.id, t]))
  const dropped: DroppedCommit[] = []
  for (const id of state.committed_ids) {
    const t = byId.get(id)
    if (!t) continue
    const reason = lockReason(t, today)
    if (reason !== null) dropped.push({ id, title: t.opportunity.title, reason })
  }
  return dropped
}

/** Saved capacity changed: uncommit items that became locked and say which. */
export function autoUncommit(
  state: CommitState,
  tiered: TieredOpportunity[],
  today: string,
): { state: CommitState; uncommitted: DroppedCommit[] } {
  const uncommitted = droppedCommits(state, tiered, today)
  if (uncommitted.length === 0) return { state, uncommitted }
  const gone = new Set(uncommitted.map(d => d.id))
  return { state: { committed_ids: state.committed_ids.filter(id => !gone.has(id)) }, uncommitted }
}

/** Committed opportunities that are still committable, for buildSchedule. */
export function committedOpportunities(state: CommitState, tiered: TieredOpportunity[], today: string): Opportunity[] {
  const byId = new Map(tiered.map(t => [t.opportunity.id, t]))
  const out: Opportunity[] = []
  for (const id of state.committed_ids) {
    const t = byId.get(id)
    if (t && isCommittable(t, today)) out.push(t.opportunity)
  }
  return out
}
