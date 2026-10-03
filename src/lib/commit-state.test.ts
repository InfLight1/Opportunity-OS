import { describe, it, expect } from 'vitest'
import opps from '../data/opportunities.json'
import { fixtureProfile } from '../engine/fixtures'
import { runEngine } from '../engine/run-engine'
import type { Opportunity, TieredOpportunity } from '../engine/types'
import {
  COMMITS_STORAGE_KEY, autoUncommit, committedOpportunities, droppedCommits, emptyCommitState,
  isCommittable, loadCommitState, lockReason, normalizeCommitState, saveCommitState, toggleCommit,
  type StorageLike,
} from './commit-state'

const TODAY = '2026-10-03'
const OPPS = opps as Opportunity[]
const KNOWN = OPPS.map(o => o.id)

function tieredAt(capacity: number): TieredOpportunity[] {
  const input = {
    name: fixtureProfile.name, grade: fixtureProfile.grade, region: fixtureProfile.region,
    interests: [...fixtureProfile.interests], skills: [...fixtureProfile.skills],
    assets: fixtureProfile.assets.map(a => ({ ...a, tags: [...a.tags], supports: [], reuse_count: 0 })),
    weekly_capacity_hours: capacity, busy_weeks: fixtureProfile.busy_weeks,
  }
  return runEngine(input, OPPS, TODAY).plan.tiered_opportunities
}

function byId(tiered: TieredOpportunity[], id: string): TieredOpportunity {
  const t = tiered.find(x => x.opportunity.id === id)
  if (!t) throw new Error(`missing ${id}`)
  return t
}

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v) } }
}

describe('committable vs locked (SKIP is locked)', () => {
  const t10 = tieredAt(10)

  it('FOCUS and CONSIDER are committable', () => {
    expect(byId(t10, 'opp-imlc').tier).toBe('FOCUS')
    expect(isCommittable(byId(t10, 'opp-imlc'), TODAY)).toBe(true)
    expect(byId(t10, 'opp-cac').tier).toBe('CONSIDER')
    expect(isCommittable(byId(t10, 'opp-cac'), TODAY)).toBe(true)
  })

  it('SKIP is locked and carries its reason (first reason segment)', () => {
    const opencv = byId(t10, 'opp-opencv-ai')
    expect(opencv.tier).toBe('SKIP')
    expect(isCommittable(opencv, TODAY)).toBe(false)
    expect(lockReason(opencv, TODAY)).toContain('Needs 30h')
    expect(lockReason(opencv, TODAY)).not.toContain('|')
    expect(lockReason(byId(t10, 'opp-imlc'), TODAY)).toBeNull()
  })

  it('a non-SKIP item with a past deadline is not committable', () => {
    const t = { ...byId(t10, 'opp-imlc') }
    t.opportunity = { ...t.opportunity, deadline: '2026-10-02' }
    expect(isCommittable(t, TODAY)).toBe(false)
    expect(lockReason(t, TODAY)).toBe('Needs a deadline and an effort estimate')
  })
})

describe('toggleCommit', () => {
  const t10 = tieredAt(10)

  it('commits, then uncommits', () => {
    const s1 = toggleCommit(emptyCommitState(), byId(t10, 'opp-imlc'), TODAY)
    expect(s1.committed_ids).toEqual(['opp-imlc'])
    const s2 = toggleCommit(s1, byId(t10, 'opp-imlc'), TODAY)
    expect(s2.committed_ids).toEqual([])
  })

  it('SKIP items cannot be committed (state unchanged)', () => {
    const s0 = emptyCommitState()
    expect(toggleCommit(s0, byId(t10, 'opp-opencv-ai'), TODAY)).toBe(s0)
  })

  it('does not mutate the input state', () => {
    const s0 = { committed_ids: ['opp-imlc'] }
    toggleCommit(s0, byId(t10, 'opp-cac'), TODAY)
    expect(s0.committed_ids).toEqual(['opp-imlc'])
  })
})

describe('normalize, load, save (key opportunity-os:commits)', () => {
  it('drops unknown ids, duplicates and non-strings, keeps first-seen order', () => {
    const s = normalizeCommitState({ committed_ids: ['opp-cac', 'nope', 7, 'opp-imlc', 'opp-cac', null] }, KNOWN)
    expect(s.committed_ids).toEqual(['opp-cac', 'opp-imlc'])
  })

  it('malformed shapes become empty', () => {
    expect(normalizeCommitState(null, KNOWN)).toEqual(emptyCommitState())
    expect(normalizeCommitState('x', KNOWN)).toEqual(emptyCommitState())
    expect(normalizeCommitState({ committed_ids: 'opp-cac' }, KNOWN)).toEqual(emptyCommitState())
    expect(normalizeCommitState([], KNOWN)).toEqual(emptyCommitState())
  })

  it('save then load round-trips under the commits key', () => {
    const storage = memoryStorage()
    saveCommitState(storage, { committed_ids: ['opp-imlc', 'opp-cac'] })
    expect(storage.data.has(COMMITS_STORAGE_KEY)).toBe(true)
    expect(COMMITS_STORAGE_KEY).toBe('opportunity-os:commits')
    expect(loadCommitState(storage, KNOWN).committed_ids).toEqual(['opp-imlc', 'opp-cac'])
  })

  it('a bad save (invalid JSON) loads as empty instead of throwing', () => {
    const storage = memoryStorage({ [COMMITS_STORAGE_KEY]: '{not json' })
    expect(loadCommitState(storage, KNOWN)).toEqual(emptyCommitState())
  })

  it('missing key and throwing storage load as empty', () => {
    expect(loadCommitState(memoryStorage(), KNOWN)).toEqual(emptyCommitState())
    const throwing: StorageLike = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
    expect(loadCommitState(throwing, KNOWN)).toEqual(emptyCommitState())
    expect(() => saveCommitState(throwing, emptyCommitState())).not.toThrow()
  })
})

describe('auto-uncommit and what-if preview', () => {
  const committed = { committed_ids: ['opp-imlc', 'opp-cac', 'opp-nasa-space-apps', 'opp-cosmo-hacks'] }

  it('lowering saved capacity to 2h uncommits Cosmo (now SKIP) with its reason', () => {
    const { state, uncommitted } = autoUncommit(committed, tieredAt(2), TODAY)
    expect(uncommitted.map(d => d.id)).toEqual(['opp-cosmo-hacks'])
    expect(uncommitted[0].title).toBe('Cosmo Hacks 2026')
    expect(uncommitted[0].reason).toContain('Needs 24h')
    expect(state.committed_ids).toEqual(['opp-imlc', 'opp-cac', 'opp-nasa-space-apps'])
  })

  it('no item locked at 4h -> nothing uncommitted, same state object', () => {
    const { state, uncommitted } = autoUncommit(committed, tieredAt(4), TODAY)
    expect(uncommitted).toEqual([])
    expect(state).toBe(committed)
  })

  it('preview (droppedCommits) reports drops without changing the stored state', () => {
    const dropped = droppedCommits(committed, tieredAt(1), TODAY)
    expect(dropped.map(d => d.id)).toEqual(['opp-cac', 'opp-nasa-space-apps', 'opp-cosmo-hacks'])
    expect(committed.committed_ids).toHaveLength(4)
  })

  it('committedOpportunities returns only still-committable items, in commit order', () => {
    const ids = committedOpportunities(committed, tieredAt(2), TODAY).map(o => o.id)
    expect(ids).toEqual(['opp-imlc', 'opp-cac', 'opp-nasa-space-apps'])
  })
})
