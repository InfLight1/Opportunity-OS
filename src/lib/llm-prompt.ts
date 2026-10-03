import type { Asset, TieredOpportunity } from '../engine/types'
import { availableHours } from '../engine/buckets'
import { heldTagsOf, humanTag, shortDate } from './exit-reason'
import { TIER_WORD, cardLockReason, cardReasons, type ToolProfile } from './tool-view'

// --- Ask why prompt (AGENTS.md LLM role 1) ---
// The model only sees structured engine facts and is asked to restate them.
// It never decides tier, schedule, reuse, gaps or next action.

export type AskWhyFacts = {
  opportunity_id: string
  title: string
  tier: string
  reasons: string[]
  deadline: string
  deadline_short: string
  effort_hours: number
  available_hours: number | null     // runway: hours from today through the deadline week
  weekly_hours: number
  matched_tags: string[]
  missing_tags: string[]             // required tags no project shows yet
  busy_collision: string | null      // busy-period label the deadline falls in
  projects: string[]
  also_counts_for: string[]          // other Focus/Consider entries the same project supports
  lock_reason: string | null
}

export function buildAskWhyFacts(
  t: TieredOpportunity,
  profile: ToolProfile,
  assets: Asset[],
  today: string,
  tiered: TieredOpportunity[],
): AskWhyFacts {
  const o = t.opportunity
  const tags = [...t.match.matched_required, ...t.match.matched_helpful].filter((x, i, all) => all.indexOf(x) === i)
  const held = heldTagsOf(assets)
  const supporting = assets.filter(a => a.supports.includes(o.id))
  const bw = t.has_busy_week_collision
    ? profile.busyWeeks.find(b => b.start && b.end && o.deadline >= b.start && o.deadline <= b.end)
    : undefined
  return {
    opportunity_id: o.id,
    title: o.title,
    tier: TIER_WORD[t.tier],
    reasons: cardReasons(t, profile, assets, today),
    deadline: o.deadline,
    deadline_short: o.deadline ? shortDate(o.deadline) : '',
    effort_hours: o.effort_hours,
    available_hours: o.deadline && o.deadline >= today ? availableHours(o.deadline, today, profile.weeklyCapacityHours, profile.busyWeeks) : null,
    weekly_hours: profile.weeklyCapacityHours,
    matched_tags: tags.map(humanTag),
    missing_tags: o.required_tags.filter(tag => !held.has(tag)).map(humanTag),
    busy_collision: t.has_busy_week_collision ? bw?.label || 'a busy period' : null,
    projects: supporting.map(a => a.title),
    also_counts_for: tiered
      .filter(x => x.opportunity.id !== o.id && x.tier !== 'SKIP' && supporting.some(a => a.supports.includes(x.opportunity.id)))
      .map(x => x.opportunity.title),
    lock_reason: cardLockReason(t, profile, assets, today),
  }
}

export const ASK_WHY_SYSTEM = [
  'You explain one planning decision to a high-school student.',
  'Explain ONLY the facts in the JSON you are given. Do not add facts, dates, numbers, titles or advice that are not in it.',
  'Never mention scores, percentages, ratings or match meters.',
  'Do not change or question the tier; it was decided by fixed rules.',
  'Cover three points in this order: (1) why it has this tier: the reasons, the tags your projects show, any tags still missing, any busy period it is due in, and the lock reason if there is one;',
  '(2) whether the hours fit: the hours it needs against the hours available before the deadline at your weekly hours;',
  '(3) if the JSON lists other opportunities the same work counts for, name them.',
  'Skip a point only when its facts are empty or null.',
  'Write numbers as digits exactly as they appear in the JSON, with "h" for hours (12 h, not twelve hours).',
  'Never write JSON field names or words joined by underscores.',
  'Write plain sentences, second person, under 70 words, no lists, no markdown.',
].join(' ')

export function askWhyUserPrompt(facts: AskWhyFacts): string {
  return `Facts (JSON):\n${JSON.stringify(facts, null, 2)}\n\nIn under 70 words, explain why "${facts.title}" is "${facts.tier}", covering the three points, using only these facts.`
}

/**
 * Request body for the Gemini generateContent endpoint. With `minimalThinking`
 * the model is asked to skip thinking (Gemma 4 on the Gemini API otherwise
 * spends the whole token budget on thought parts and returns no answer).
 * Models that reject thinkingConfig get a retry without it (llm-provider).
 */
export function askWhyRequestBody(facts: AskWhyFacts, minimalThinking = true): unknown {
  return {
    systemInstruction: { parts: [{ text: ASK_WHY_SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: askWhyUserPrompt(facts) }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      ...(minimalThinking ? { thinkingConfig: { thinkingLevel: 'minimal' } } : {}),
    },
  }
}

/** FNV-1a 32-bit over the canonical facts JSON, as 8 hex chars. */
export function hashFacts(facts: AskWhyFacts): string {
  const s = JSON.stringify(facts)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

export function cacheKey(facts: AskWhyFacts): string {
  return `${facts.opportunity_id}:${hashFacts(facts)}`
}
