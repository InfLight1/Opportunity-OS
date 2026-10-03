import type { Opportunity, Tag } from '../engine/types'
import { missingFields, toOpportunity } from './draft-card'
import type { StorageLike } from './commit-state'

// --- Added opportunities (AGENTS.md "Added opportunities") ---
// Persisted under its own key, normalized on load; never touches src/data/.

export const USER_OPPS_STORAGE_KEY = 'opportunity-os:user-opps'

export const TAXONOMY_TAGS: readonly Tag[] = [
  'python', 'computer-vision', 'data-analysis', 'web-dev', 'ai-ml', 'research-writing', 'public-speaking', 'leadership',
  'technical-project', 'competition-experience', 'portfolio-github', 'writing-sample',
  'ai-interest', 'entrepreneurship', 'stem-general', 'social-impact',
  'team-required', 'individual', 'submission-format:demo', 'submission-format:essay', 'submission-format:pitch',
]

const TAGS = new Set<string>(TAXONOMY_TAGS)

function tagList(v: unknown): Tag[] {
  if (!Array.isArray(v)) return []
  return v.filter((t): t is Tag => typeof t === 'string' && TAGS.has(t)).filter((t, i, all) => all.indexOf(t) === i)
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

/** One stored entry -> a complete Opportunity, or null when it cannot be trusted. */
export function normalizeUserOpp(raw: unknown): Opportunity | null {
  if (raw === null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = str(r.id)
  if (!id || !id.startsWith('user-')) return null
  const g = r.grade_range as Record<string, unknown> | undefined
  const loc = r.location as Record<string, unknown> | undefined
  const partial: Partial<Opportunity> = {
    title: str(r.title),
    organization: str(r.organization),
    source_url: str(r.source_url),
    deadline: str(r.deadline),
    effort_hours: typeof r.effort_hours === 'number' ? r.effort_hours : undefined,
    grade_range: g && typeof g.min === 'number' && typeof g.max === 'number' ? { min: g.min, max: g.max } : undefined,
    location: loc && typeof loc.remote_ok === 'boolean' ? { remote_ok: loc.remote_ok, region: str(loc.region) ?? null } : undefined,
    required_tags: tagList(r.required_tags),
    helpful_tags: tagList(r.helpful_tags),
    prerequisites: tagList(r.prerequisites),
  }
  if (missingFields(partial).length > 0) return null
  return { ...toOpportunity(partial), id }
}

export function normalizeUserOpps(raw: unknown, datasetIds: Iterable<string>): Opportunity[] {
  if (!Array.isArray(raw)) return []
  const taken = new Set(datasetIds)
  const out: Opportunity[] = []
  for (const item of raw) {
    const o = normalizeUserOpp(item)
    if (!o || taken.has(o.id)) continue
    taken.add(o.id)
    out.push(o)
  }
  return out
}

export function loadUserOpps(storage: StorageLike, datasetIds: Iterable<string>): Opportunity[] {
  try {
    const raw = storage.getItem(USER_OPPS_STORAGE_KEY)
    return raw ? normalizeUserOpps(JSON.parse(raw), datasetIds) : []
  } catch {
    return []
  }
}

export function saveUserOpps(storage: StorageLike, opps: Opportunity[]): void {
  try { storage.setItem(USER_OPPS_STORAGE_KEY, JSON.stringify(opps)) } catch { /* storage full or unavailable */ }
}

/** Add or replace by id. */
export function upsertUserOpp(list: Opportunity[], o: Opportunity): Opportunity[] {
  return [...list.filter(x => x.id !== o.id), o]
}

export function removeUserOpp(list: Opportunity[], id: string): Opportunity[] {
  return list.filter(x => x.id !== id)
}
