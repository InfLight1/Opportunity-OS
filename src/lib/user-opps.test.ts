import { describe, it, expect } from 'vitest'
import type { Opportunity } from '../engine/types'
import { toOpportunity } from './draft-card'
import {
  loadUserOpps, normalizeUserOpp, normalizeUserOpps, removeUserOpp, saveUserOpps, upsertUserOpp, USER_OPPS_STORAGE_KEY,
} from './user-opps'

const GOOD: Opportunity = toOpportunity({
  title: 'Bay Area Youth Hack',
  deadline: '2026-11-20',
  effort_hours: 8,
  grade_range: { min: 9, max: 12 },
  location: { remote_ok: true, region: null },
  required_tags: ['technical-project'],
})

function memStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial))
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v) } }
}

describe('normalizeUserOpp', () => {
  it('keeps a complete entry unchanged', () => {
    expect(normalizeUserOpp(JSON.parse(JSON.stringify(GOOD)))).toEqual(GOOD)
  })
  it('drops non-objects, missing user- prefix, incomplete entries', () => {
    expect(normalizeUserOpp(null)).toBeNull()
    expect(normalizeUserOpp('x')).toBeNull()
    expect(normalizeUserOpp({ ...GOOD, id: 'opp-imlc' })).toBeNull()
    expect(normalizeUserOpp({ ...GOOD, deadline: '' })).toBeNull()
    expect(normalizeUserOpp({ ...GOOD, effort_hours: '8' })).toBeNull()
  })
  it('drops unknown tags; an entry left with no required tag is dropped', () => {
    expect(normalizeUserOpp({ ...GOOD, required_tags: ['technical-project', 'basket-weaving'] })!.required_tags).toEqual(['technical-project'])
    expect(normalizeUserOpp({ ...GOOD, required_tags: ['basket-weaving'] })).toBeNull()
  })
})

describe('normalizeUserOpps', () => {
  it('drops duplicates and ids that clash with the dataset', () => {
    const clash = { ...GOOD, id: 'user-x' }
    expect(normalizeUserOpps([GOOD, GOOD, clash], ['user-x']).map(o => o.id)).toEqual([GOOD.id])
  })
  it('non-array -> empty', () => {
    expect(normalizeUserOpps({ a: 1 }, [])).toEqual([])
  })
})

describe('load / save', () => {
  it('round-trips', () => {
    const s = memStorage()
    saveUserOpps(s, [GOOD])
    expect(loadUserOpps(s, [])).toEqual([GOOD])
  })
  it('corrupt JSON -> empty, never throws', () => {
    expect(loadUserOpps(memStorage({ [USER_OPPS_STORAGE_KEY]: '{not json' }), [])).toEqual([])
  })
})

describe('upsert / remove', () => {
  it('upsert replaces by id; remove drops it', () => {
    const edited = { ...GOOD, effort_hours: 10 }
    expect(upsertUserOpp([GOOD], edited)).toEqual([edited])
    expect(removeUserOpp([GOOD], GOOD.id)).toEqual([])
  })
})
