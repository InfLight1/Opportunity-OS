import { describe, it, expect } from 'vitest'
import opps from '../data/opportunities.json'
import cacheFile from '../data/llm-cache.json'
import { fixtureProfile } from '../engine/fixtures'
import type { Opportunity } from '../engine/types'
import { checkAskWhy } from './ask-why-check'
import { askWhyTemplate } from './ask-why-template'
import { buildAskWhyFacts, cacheKey } from './llm-prompt'
import { explainWithChain, type FetchLike, type LlmCache } from './llm-provider'
import { planForForm, profileToFormData } from './profile-model'

// The shipped cache was generated for the demo profile (no added
// opportunities) on 2026-10-03; keys hash the facts, which include the
// runway hours, so this pins the same day.
const TODAY = '2026-10-03'
const OPPS = opps as Opportunity[]
const TITLES = OPPS.map(o => o.title)
const CACHE = cacheFile as LlmCache
const IDS = ['opp-imlc', 'opp-cac', 'opp-global-appathon', 'opp-nasa-space-apps', 'opp-cosmo-hacks']

// Same inputs as App.tsx builds for Ask why.
const form = profileToFormData(fixtureProfile)
const { plan, assets } = planForForm(form, OPPS, TODAY)
const tiered = plan.tiered_opportunities
const profile = { grade: form.grade, region: form.region, weeklyCapacityHours: form.weekly_capacity_hours, busyWeeks: form.busy_weeks }

function inputsFor(id: string) {
  const t = tiered.find(x => x.opportunity.id === id)!
  const facts = buildAskWhyFacts(t, profile, assets, TODAY, tiered)
  const templateText = askWhyTemplate(t, { grade: form.grade, region: form.region, weeklyCapacityHours: form.weekly_capacity_hours, busyWeeks: form.busy_weeks, assets, tiered }, TODAY)
  return { facts, templateText }
}

const failingFetch: FetchLike = async () => { throw new Error('live call forced to fail') }

describe('shipped llm-cache.json (demo profile, 2026-10-03)', () => {
  it('has exactly one answer per demo card, under the key llm-provider reads', () => {
    expect(Object.keys(CACHE.answers).sort()).toEqual(IDS.map(id => cacheKey(inputsFor(id).facts)).sort())
  })

  it('every cached answer passes the Ask why guard', () => {
    for (const id of IDS) {
      const { facts } = inputsFor(id)
      expect(checkAskWhy(CACHE.answers[cacheKey(facts)], facts, TITLES)).toEqual({ ok: true, violations: [] })
    }
  })

  for (const id of IDS) {
    it(`${id}: live fails -> cached answer, not the template`, async () => {
      const { facts, templateText } = inputsFor(id)
      const r = await explainWithChain({ facts, templateText, datasetTitles: TITLES, fetchFn: failingFetch, cache: CACHE })
      expect(r.source).toBe('cache')
      expect(r.text).toBe(CACHE.answers[cacheKey(facts)])
      expect(r.text).not.toBe(templateText)
    })
  }

  it('live tier off (production build) -> cached answer too', async () => {
    const { facts, templateText } = inputsFor('opp-imlc')
    const r = await explainWithChain({ facts, templateText, datasetTitles: TITLES, fetchFn: null, cache: CACHE })
    expect(r.source).toBe('cache')
  })
})
