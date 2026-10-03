import { describe, it, expect } from 'vitest'
import opps from '../data/opportunities.json'
import cacheFile from '../data/llm-cache.json'
import { fixtureProfile } from '../engine/fixtures'
import type { Opportunity } from '../engine/types'
import { candidateTitles, checkAskWhy, numbersIn } from './ask-why-check'
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
const NASA = buildAskWhyFacts(tieredOf('opp-nasa-space-apps'), PROFILE, assets, TODAY)
const OPENCV = buildAskWhyFacts(tieredOf('opp-opencv-ai'), PROFILE, assets, TODAY)

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
      matched_tags: ['data analysis', 'python'],
      projects: ['Tennis Analytics App'],
      lock_reason: null,
    })
    expect(OPENCV.tier).toBe('Not now')
    expect(OPENCV.lock_reason).toBe('Needs 30 h, 29 h available by Oct 26')
  })
})

describe('prompt', () => {
  it('system prompt: only these facts, no scores or percentages, under 60 words', () => {
    expect(ASK_WHY_SYSTEM).toMatch(/ONLY the facts/)
    expect(ASK_WHY_SYSTEM).toMatch(/Never mention scores, percentages/)
    expect(ASK_WHY_SYSTEM).toMatch(/under 60 words/)
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
  it('(b) numbers from the facts and from titles are fine', () => {
    expect(checkAskWhy('Due 2026-11-14, about 12 h.', NASA, TITLES).ok).toBe(true)
  })
  it('(c) rejects score, percent, % and match meter', () => {
    for (const bad of ['Your score is high.', 'A 90 percent fit.', 'A strong 9% fit.', 'The match meter is full.', 'It scored well.']) {
      expect(checkAskWhy(bad, NASA, TITLES).ok).toBe(false)
    }
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

  it('HTTP error, thrown fetch and empty body fall through', async () => {
    const http500: FetchLike = async () => ({ ok: false, status: 500, json: async () => ({}) })
    const thrown: FetchLike = async () => { throw new Error('network') }
    const empty: FetchLike = async () => ({ ok: true, status: 200, json: async () => ({ candidates: [] }) })
    for (const f of [http500, thrown, empty]) {
      expect((await explainWithChain({ ...base, fetchFn: f })).source).toBe('template')
    }
  })

  it('timeout falls through (and aborts the request)', async () => {
    let aborted = false
    const hang: FetchLike = (_url, init) => new Promise((_res, rej) => {
      init?.signal?.addEventListener('abort', () => { aborted = true; rej(new Error('aborted')) })
    })
    const r = await explainWithChain({ ...base, fetchFn: hang, timeoutMs: 20 })
    expect(r.source).toBe('template')
    expect(aborted).toBe(true)
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
  })

  it('shipped cache file has the documented shape', () => {
    expect(typeof cacheFile._doc).toBe('string')
    expect(typeof cacheFile.answers).toBe('object')
  })
})
