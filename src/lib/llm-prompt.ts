import type { Asset, TieredOpportunity } from '../engine/types'
import { humanTag, shortDate } from './exit-reason'
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
  matched_tags: string[]
  projects: string[]
  lock_reason: string | null
}

export function buildAskWhyFacts(t: TieredOpportunity, profile: ToolProfile, assets: Asset[], today: string): AskWhyFacts {
  const o = t.opportunity
  const tags = [...t.match.matched_required, ...t.match.matched_helpful].filter((x, i, all) => all.indexOf(x) === i)
  return {
    opportunity_id: o.id,
    title: o.title,
    tier: TIER_WORD[t.tier],
    reasons: cardReasons(t, profile, assets, today),
    deadline: o.deadline,
    deadline_short: o.deadline ? shortDate(o.deadline) : '',
    effort_hours: o.effort_hours,
    matched_tags: tags.map(humanTag),
    projects: assets.filter(a => a.supports.includes(o.id)).map(a => a.title),
    lock_reason: cardLockReason(t, profile, assets, today),
  }
}

export const ASK_WHY_SYSTEM = [
  'You explain one planning decision to a high-school student.',
  'Explain ONLY the facts in the JSON you are given. Do not add facts, dates, numbers, titles or advice that are not in it.',
  'Never mention scores, percentages, ratings or match meters.',
  'Do not change or question the tier; it was decided by fixed rules.',
  'Write plain sentences, second person, under 60 words, no lists, no markdown.',
].join(' ')

export function askWhyUserPrompt(facts: AskWhyFacts): string {
  return `Facts (JSON):\n${JSON.stringify(facts, null, 2)}\n\nIn under 60 words, explain why "${facts.title}" is "${facts.tier}" using only these facts.`
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
