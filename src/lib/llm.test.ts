import { describe, it, expect } from 'vitest'
import opps from '../data/opportunities.json'
import cacheFile from '../data/llm-cache.json'
import { fixtureProfile } from '../engine/fixtures'
import type { Opportunity } from '../engine/types'
import { candidateTitles, checkAskWhy, numbersIn, wordNumbersIn } from './ask-why-check'
import { askWhyRequestBody, askWhyUserPrompt, ASK_WHY_SYSTEM, buildAskWhyFacts, cacheKey, hashFacts } from './llm-prompt'
import { explainWithChain, extractText, type FetchLike } from './llm-provider'
import { planForForm, profileToFormData } from './profile-model'

const TODAY = '2026-10-03'
const OPPS = opps as Opportunity[]
const TITLES = OPPS.map(o => o.title)
const FORM = profileToFormData(fixtureProfile)
const { plan, assets } = planForForm(FORM, OPPS, TODAY)
const PROFILE = { grade: FORM.grade, region: FORM.region, weeklyCapacityHours: 10, busyWeeks: FORM.busy_weeks }
const tieredOf = (id: string) => plan.tiered_opportunities.find(t => t.opportunity.id === id)!
const NASA = buildAskWhyFacts(tieredOf('opp-nasa-space-apps'), PROFILE, assets, TODAY, plan.tiered_opportunities)
const OPENCV = buildAskWhyFacts(tieredOf('opp-opencv-ai'), PROFILE, assets, TODAY, plan.tiered_opportunities)
const CAC = buildAskWhyFacts(tieredOf('opp-cac'), PROFILE, assets, TODAY, plan.tiered_opportunities)

const GOOD = 'NASA Space Apps Challenge 2026 is Focus because your Tennis Analytics App shows data analysis and python. It takes about 12 h and is due Nov 14.'

describe('buildAskWhyFacts', () => {
  it('only structured engine facts', () => {
    expect(NASA).toEqual({
      opportunity_id: 'opp-nasa-space-apps',
      title: 'NASA Space Apps Challenge 2026',
      tier: 'Focus',
      reasons: ['Your projects show data analysis, python'],
      deadline: '2026-11-14',
      deadline_short: 'Nov 14',
      effort_hours: 12,
      available_hours: 59,
      weekly_hours: 10,
      matched_tags: ['data analysis', 'python'],
      missing_tags: [],
      busy_collision: null,
      projects: ['Tennis Analytics App'],
      also_counts_for: ['International Machine Learning Competition', 'Congressional App Challenge', 'Cosmo Hacks 2026', 'Global Appathon'],
      lock_reason: null,
    })
    expect(OPENCV.tier).toBe('Not now')
    expect(OPENCV.lock_reason).toBe('Needs 30 h, 29 h available by Oct 26')
    expect(OPENCV.available_hours).toBe(29)
  })
  it('the same facts the rule text uses: collision label, reuse targets (never SKIP ones)', () => {
    expect(CAC.busy_collision).toBe('Midterms')
    expect(CAC.also_counts_for).not.toContain('OpenCV AI Competition')
    expect(CAC.also_counts_for).not.toContain('Congressional App Challenge')
  })
  it('closed deadline -> available_hours null', () => {
    expect(buildAskWhyFacts(tieredOf('opp-au-stem-vgc'), PROFILE, assets, TODAY, plan.tiered_opportunities).available_hours).toBeNull()
  })
  it('a faithful three-point answer passes the guard', () => {
    const answer = 'NASA Space Apps Challenge 2026 is Focus: your Tennis Analytics App shows data analysis and python, nothing is missing, and it is not due in a busy period. It needs about 12 h and you have 59 h before Nov 14 at 10 h a week. The same work also counts for the International Machine Learning Competition, Congressional App Challenge, Cosmo Hacks 2026 and Global Appathon.'
    expect(checkAskWhy(answer, NASA, TITLES)).toEqual({ ok: true, violations: [] })
  })
})

describe('prompt', () => {
  it('system prompt: only these facts, no scores or percentages, three points, under 70 words', () => {
    expect(ASK_WHY_SYSTEM).toMatch(/ONLY the facts/)
    expect(ASK_WHY_SYSTEM).toMatch(/Never mention scores, percentages/)
    expect(ASK_WHY_SYSTEM).toMatch(/\(1\) why it has this tier.*\(2\) whether the hours fit.*\(3\) if the JSON lists other opportunities/)
    expect(ASK_WHY_SYSTEM).toMatch(/Never write JSON field names/)
    expect(ASK_WHY_SYSTEM).toMatch(/under 70 words/)
    expect(ASK_WHY_SYSTEM).toMatch(/numbers as digits/)
  })
  it('user prompt carries the facts JSON and nothing from the profile beyond it', () => {
    const p = askWhyUserPrompt(NASA)
    expect(p).toContain('"effort_hours": 12')
    expect(p).not.toContain('Dublin')
    expect(p).not.toContain('grade')
  })
  it('request body shape for generateContent', () => {
    const b = askWhyRequestBody(NASA) as { contents: { parts: { text: string }[] }[]; systemInstruction: unknown }
    expect(b.contents[0].parts[0].text).toContain('NASA Space Apps Challenge 2026')
    expect(b.systemInstruction).toBeDefined()
    expect((askWhyRequestBody(NASA) as { generationConfig: Record<string, unknown> }).generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'minimal' })
    expect((askWhyRequestBody(NASA, false) as { generationConfig: Record<string, unknown> }).generationConfig.thinkingConfig).toBeUndefined()
  })
  it('hash is stable, 8 hex chars, and changes with the facts', () => {
    expect(hashFacts(NASA)).toMatch(/^[0-9a-f]{8}$/)
    expect(hashFacts(NASA)).toBe(hashFacts({ ...NASA }))
    expect(hashFacts({ ...NASA, effort_hours: 13 })).not.toBe(hashFacts(NASA))
    expect(cacheKey(NASA)).toBe(`opp-nasa-space-apps:${hashFacts(NASA)}`)
  })
})

describe('checkAskWhy', () => {
  it('accepts a faithful answer', () => {
    expect(checkAskWhy(GOOD, NASA, TITLES)).toEqual({ ok: true, violations: [] })
  })
  it('(a) rejects a title not in the dataset', () => {
    const r = checkAskWhy('You could also try the Google Science Fair instead.', NASA, TITLES)
    expect(r.ok).toBe(false)
    expect(r.violations).toContain('unknown title: Google Science Fair')
  })
  it('(a) accepts other dataset titles, with a leading "The"', () => {
    expect(checkAskWhy('The same work also counts for the International Machine Learning Competition.', NASA, TITLES).ok).toBe(true)
  })
  it('(b) rejects numbers that are not in the facts', () => {
    const r = checkAskWhy('It takes about 15 h and is due Nov 14.', NASA, TITLES)
    expect(r.violations).toEqual(['number not in facts: 15'])
  })
  it('(b) spelled-out numbers are checked too', () => {
    expect(checkAskWhy('It takes about fifteen hours.', NASA, TITLES).violations).toEqual(['number not in facts: 15'])
    expect(checkAskWhy('You have fifty-nine hours, about twelve of them needed.', NASA, TITLES).ok).toBe(true)
    expect(checkAskWhy('One project opens several doors.', NASA, TITLES).ok).toBe(true)
  })
  it('wordNumbersIn', () => {
    expect(wordNumbersIn('six, twenty-nine, Forty five, ten')).toEqual(['6', '29', '45', '10'])
    expect(wordNumbersIn('someone tends to listen')).toEqual([])
  })
  it('(b) numbers from the facts and from titles are fine', () => {
    expect(checkAskWhy('Due 2026-11-14, about 12 h.', NASA, TITLES).ok).toBe(true)
  })
  it('(c) rejects score, percent, % and match meter', () => {
    for (const bad of ['Your score is high.', 'A 90 percent fit.', 'A strong 9% fit.', 'The match meter is full.', 'It scored well.']) {
      expect(checkAskWhy(bad, NASA, TITLES).ok).toBe(false)
    }
  })
  it('(d) rejects echoed JSON field names', () => {
    expect(checkAskWhy('Your 12 effort_hours fit within 59 available_hours.', NASA, TITLES).violations).toEqual(['field name: effort_hours'])
    expect(checkAskWhy('It is well-known and up-to-date.', NASA, TITLES).ok).toBe(true)
  })
  it('empty text is rejected', () => {
    expect(checkAskWhy('  ', NASA, TITLES).ok).toBe(false)
  })
  it('helpers', () => {
    expect(numbersIn('6.5 h on Oct 06')).toEqual(['6.5', '6'])
    expect(candidateTitles('Midterms. Congressional App Challenge is next.')).toEqual(['Congressional App Challenge'])
  })
})

function okFetch(text: string): FetchLike {
  return async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) })
}

describe('explainWithChain', () => {
  const base = { facts: NASA, templateText: 'TEMPLATE', datasetTitles: TITLES, cache: { answers: {} as Record<string, string> } }

  it('live answer that passes the guard wins', async () => {
    const r = await explainWithChain({ ...base, fetchFn: okFetch(GOOD) })
    expect(r).toEqual({ text: GOOD, source: 'live', key: cacheKey(NASA), violations: [] })
  })

  it('posts the request body to the proxy endpoint', async () => {
    let seen: { url: string; body: string } | null = null
    const f: FetchLike = async (url, init) => { seen = { url, body: String(init?.body) }; return okFetch(GOOD)(url, init) }
    await explainWithChain({ ...base, fetchFn: f })
    expect(seen!.url).toBe('/api/llm/generate')
    expect(JSON.parse(seen!.body).contents[0].parts[0].text).toContain('"opportunity_id": "opp-nasa-space-apps"')
  })

  it('live answer that fails the guard falls to the template', async () => {
    const r = await explainWithChain({ ...base, fetchFn: okFetch('Your score is 15.') })
    expect(r.source).toBe('template')
    expect(r.text).toBe('TEMPLATE')
    expect(r.violations.some(v => v.startsWith('live: banned word'))).toBe(true)
  })

  // --- failure paths: each must end in the template with a stated reason ---
  const run = (fetchFn: FetchLike, timeoutMs?: number) => explainWithChain({ ...base, fetchFn, timeoutMs })

  it('fetch rejects -> template', async () => {
    const r = await run(async () => { throw new Error('network down') })
    expect(r.source).toBe('template')
    expect(r.violations).toEqual(['live: fetch failed: network down'])
  })

  it('non-2xx from the proxy -> template', async () => {
    const r = await run(async () => ({ ok: false, status: 500, json: async () => ({ error: { message: 'boom' } }) }))
    expect(r.source).toBe('template')
    expect(r.violations).toEqual(['live: HTTP 500'])
  })

  it('JSON with no text (no candidates, empty parts, body not JSON) -> template', async () => {
    const bodies: FetchLike[] = [
      async () => ({ ok: true, status: 200, json: async () => ({ candidates: [] }) }),
      async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [] } }] }) }),
      async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad json') } }),
    ]
    for (const f of bodies) {
      const r = await run(f)
      expect(r.source).toBe('template')
      expect(r.violations).toEqual(['live: no answer text'])
    }
  })

  it('only thought parts (budget spent thinking, MAX_TOKENS) -> template', async () => {
    const r = await run(async () => ({ ok: true, status: 200, json: async () => ({
      candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'Thinking about 99 scores...', thought: true }] } }],
    }) }))
    expect(r.source).toBe('template')
    expect(r.violations).toEqual(['live: no answer text'])
  })

  it('thought parts are dropped; the answer part alone is checked and shown', async () => {
    const r = await run(async () => ({ ok: true, status: 200, json: async () => ({
      candidates: [{ content: { parts: [{ text: 'Plan: mention 99 percent.', thought: true }, { text: GOOD }] } }],
    }) }))
    expect(r).toEqual({ text: GOOD, source: 'live', key: cacheKey(NASA), violations: [] })
  })

  it('timeout fires (and aborts) -> template', async () => {
    let aborted = false
    const hang: FetchLike = (_url, init) => new Promise((_res, rej) => {
      init?.signal?.addEventListener('abort', () => { aborted = true; rej(new Error('aborted')) })
    })
    const r = await run(hang, 20)
    expect(r.source).toBe('template')
    expect(r.violations).toEqual(['live: timeout after 20 ms'])
    expect(aborted).toBe(true)
  })

  it('timeout still ends the chain when fetch ignores the abort signal', async () => {
    const r = await run(() => new Promise(() => {}), 20)
    expect(r.source).toBe('template')
    expect(r.violations).toEqual(['live: timeout after 20 ms'])
  })

  it('first request asks for minimal thinking; HTTP 400 retries once without thinkingConfig', async () => {
    const bodies: { generationConfig: Record<string, unknown> }[] = []
    let calls = 0
    const f: FetchLike = async (url, init) => {
      bodies.push(JSON.parse(String(init?.body)))
      calls++
      return calls === 1
        ? { ok: false, status: 400, json: async () => ({ error: { message: 'Thinking level is not supported for this model.' } }) }
        : okFetch(GOOD)(url, init)
    }
    const r = await run(f)
    expect(r.source).toBe('live')
    expect(bodies[0].generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'minimal' })
    expect(bodies[1].generationConfig.thinkingConfig).toBeUndefined()
  })

  it('HTTP 400 twice -> template, no third request', async () => {
    let calls = 0
    const r = await run(async () => { calls++; return { ok: false, status: 400, json: async () => ({}) } })
    expect(r.violations).toEqual(['live: HTTP 400'])
    expect(calls).toBe(2)
  })

  it('never rejects, even on an unexpected error inside the chain', async () => {
    const circular = { ...NASA } as Record<string, unknown>
    circular.self = circular
    const r = await explainWithChain({ ...base, facts: circular as unknown as typeof NASA, fetchFn: okFetch(GOOD) })
    expect(r.source).toBe('template')
    expect(r.text).toBe('TEMPLATE')
    expect(r.violations[0]).toMatch(/^chain error:/)
  })

  it('cached answer used when live fails; cached answers are guarded too', async () => {
    const key = cacheKey(NASA)
    const good = await explainWithChain({ ...base, fetchFn: null, cache: { answers: { [key]: GOOD } } })
    expect(good.source).toBe('cache')
    const bad = await explainWithChain({ ...base, fetchFn: null, cache: { answers: { [key]: 'About 99 percent.' } } })
    expect(bad.source).toBe('template')
  })

  it('live off (fetchFn null) and no cache -> template', async () => {
    expect((await explainWithChain({ ...base, fetchFn: null })).source).toBe('template')
  })

  it('extractText joins parts and ignores junk', () => {
    expect(extractText({ candidates: [{ content: { parts: [{ text: 'a ' }, { text: 'b' }] } }] })).toBe('a b')
    expect(extractText(null)).toBeNull()
    expect(extractText({ candidates: [{ content: { parts: [{ text: '  ' }] } }] })).toBeNull()
    expect(extractText({ candidates: [{ content: { parts: [{ text: 'hidden', thought: true }, { text: 'shown' }] } }] })).toBe('shown')
  })

  it('shipped cache file has the documented shape', () => {
    expect(typeof cacheFile._doc).toBe('string')
    expect(typeof cacheFile.answers).toBe('object')
  })
})
