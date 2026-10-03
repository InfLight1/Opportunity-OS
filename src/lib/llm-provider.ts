import { checkAskWhy } from './ask-why-check'
import { askWhyRequestBody, cacheKey, type AskWhyFacts } from './llm-prompt'

// --- Ask why provider chain (AGENTS.md: live -> cached answers -> templates) ---
// fetch is injected so tests can mock it. Any failure, timeout or guard
// violation falls through to the next tier. Never touches tier, schedule,
// reuse, gaps or next action: it only returns text for one card.

export type FetchLike = (input: string, init?: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>

export type LlmCache = { answers: Record<string, string> }

export type ChainSource = 'live' | 'cache' | 'template'

export type ChainResult = { text: string; source: ChainSource; key: string; violations: string[] }

export type ChainOptions = {
  facts: AskWhyFacts
  templateText: string
  datasetTitles: string[]
  fetchFn: FetchLike | null       // null = live tier off (e.g. production build without the proxy)
  cache: LlmCache
  endpoint?: string
  timeoutMs?: number
}

export const LLM_ENDPOINT = '/api/llm/generate'
export const LLM_TIMEOUT_MS = 8000

/** Text from a Gemini generateContent response, or null. */
export function extractText(body: unknown): string | null {
  const parts = (body as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] } | null)?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return null
  const text = parts.map(p => (typeof p.text === 'string' ? p.text : '')).join('').trim()
  return text || null
}

async function liveCall(fetchFn: FetchLike, endpoint: string, facts: AskWhyFacts, timeoutMs: number): Promise<string | null> {
  const ctrl = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>(resolve => {
    timer = setTimeout(() => { ctrl.abort(); resolve(null) }, timeoutMs)
  })
  const call = (async () => {
    try {
      const res = await fetchFn(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(askWhyRequestBody(facts)),
        signal: ctrl.signal,
      })
      if (!res.ok) return null
      return extractText(await res.json())
    } catch {
      return null
    }
  })()
  try {
    return await Promise.race([call, timeout])
  } finally {
    clearTimeout(timer)
  }
}

export async function explainWithChain(opts: ChainOptions): Promise<ChainResult> {
  const key = cacheKey(opts.facts)
  const violations: string[] = []

  if (opts.fetchFn) {
    const text = await liveCall(opts.fetchFn, opts.endpoint ?? LLM_ENDPOINT, opts.facts, opts.timeoutMs ?? LLM_TIMEOUT_MS)
    if (text !== null) {
      const check = checkAskWhy(text, opts.facts, opts.datasetTitles)
      if (check.ok) return { text, source: 'live', key, violations: [] }
      violations.push(...check.violations.map(v => `live: ${v}`))
    } else {
      violations.push('live: no answer')
    }
  }

  const cached = opts.cache.answers[key]
  if (typeof cached === 'string') {
    const check = checkAskWhy(cached, opts.facts, opts.datasetTitles)
    if (check.ok) return { text: cached, source: 'cache', key, violations }
    violations.push(...check.violations.map(v => `cache: ${v}`))
  }

  return { text: opts.templateText, source: 'template', key, violations }
}
