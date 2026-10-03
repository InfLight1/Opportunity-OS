import { checkAskWhy } from './ask-why-check'
import { askWhyRequestBody, cacheKey, type AskWhyFacts } from './llm-prompt'

// --- Ask why provider chain (AGENTS.md: live -> cached answers -> templates) ---
// fetch is injected so tests can mock it. Any failure, timeout or guard
// violation falls through to the next tier, and explainWithChain never
// rejects, so the UI status always ends in ready or fallback. It never
// touches tier, schedule, reuse, gaps or next action: it only returns text.

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

type Part = { text?: unknown; thought?: unknown }

/** Answer text from a Gemini generateContent response (thought parts dropped), or null. */
export function extractText(body: unknown): string | null {
  const parts = (body as { candidates?: { content?: { parts?: Part[] } }[] } | null)?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return null
  const text = parts
    .filter(p => p && p.thought !== true)
    .map(p => (typeof p.text === 'string' ? p.text : ''))
    .join('')
    .trim()
  return text || null
}

type LiveOutcome = { text: string } | { error: string }

async function postOnce(fetchFn: FetchLike, endpoint: string, body: unknown, signal: AbortSignal): Promise<{ status: number; ok: boolean; json: unknown }> {
  const res = await fetchFn(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  let json: unknown
  try { json = await res.json() } catch { json = null }
  return { status: res.status, ok: res.ok, json }
}

/** One live attempt (plus one retry without thinkingConfig on HTTP 400), bounded by timeoutMs overall. */
async function liveCall(fetchFn: FetchLike, endpoint: string, facts: AskWhyFacts, timeoutMs: number): Promise<LiveOutcome> {
  const ctrl = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<LiveOutcome>(resolve => {
    timer = setTimeout(() => { ctrl.abort(); resolve({ error: `timeout after ${timeoutMs} ms` }) }, timeoutMs)
  })
  const call = (async (): Promise<LiveOutcome> => {
    try {
      let r = await postOnce(fetchFn, endpoint, askWhyRequestBody(facts, true), ctrl.signal)
      if (r.status === 400) r = await postOnce(fetchFn, endpoint, askWhyRequestBody(facts, false), ctrl.signal)
      if (!r.ok) return { error: `HTTP ${r.status}` }
      const text = extractText(r.json)
      return text === null ? { error: 'no answer text' } : { text }
    } catch (e) {
      return { error: `fetch failed: ${e instanceof Error ? e.message : String(e)}` }
    }
  })()
  try {
    return await Promise.race([call, timeout])
  } finally {
    clearTimeout(timer)
  }
}

async function chain(opts: ChainOptions): Promise<ChainResult> {
  const key = cacheKey(opts.facts)
  const violations: string[] = []

  if (opts.fetchFn) {
    const live = await liveCall(opts.fetchFn, opts.endpoint ?? LLM_ENDPOINT, opts.facts, opts.timeoutMs ?? LLM_TIMEOUT_MS)
    if ('text' in live) {
      const check = checkAskWhy(live.text, opts.facts, opts.datasetTitles)
      if (check.ok) return { text: live.text, source: 'live', key, violations: [] }
      violations.push(...check.violations.map(v => `live: ${v}`))
    } else {
      violations.push(`live: ${live.error}`)
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

/** Never rejects: any unexpected error yields the template. */
export async function explainWithChain(opts: ChainOptions): Promise<ChainResult> {
  try {
    return await chain(opts)
  } catch (e) {
    return { text: opts.templateText, source: 'template', key: '', violations: [`chain error: ${e instanceof Error ? e.message : String(e)}`] }
  }
}
