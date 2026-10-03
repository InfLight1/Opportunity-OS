import { describe, it, expect } from 'vitest'
import opps from '../data/opportunities.json'
import { fixtureProfile } from '../engine/fixtures'
import type { Opportunity, Plan } from '../engine/types'
import { planForForm, profileToFormData } from './profile-model'
import { buildReuseWeb } from './reuse-web'
import { anyCombinationOverloads } from './what-if'

const TODAY = '2026-10-03'
const OPPS = opps as Opportunity[]

function demo(capacity = 10) {
  const form = profileToFormData(fixtureProfile)
  return { form, ...planForForm(form, OPPS, TODAY, capacity) }
}

describe('buildReuseWeb (demo, 10 h)', () => {
  const { plan, assets } = demo()
  const web = buildReuseWeb(plan, assets, { committed_ids: ['opp-cac'] }, { 'opp-opencv-ai': 'Needs 30 h, 29 h available by Oct 26' })

  it('tennis project threads to its supports, labelled with matched tags held by the project', () => {
    expect(web.projects.map(p => p.id)).toEqual(['asset-tennis'])
    const tennisTags = fixtureProfile.assets[0].tags
    for (const t of web.threads) {
      expect(t.matchedTags.length).toBeGreaterThan(0)
      for (const tag of t.matchedTags) expect(tennisTags).toContain(tag)
    }
    expect(web.threads.map(t => t.opportunityId)).toEqual(expect.arrayContaining(['opp-imlc', 'opp-cac']))
  })

  it('states: committed first, skipped matches last with their reason', () => {
    const states = web.opportunities.map(o => o.state)
    expect(states[0]).toBe('committed')
    expect(web.opportunities[0].id).toBe('opp-cac')
    const opencv = web.opportunities.find(o => o.id === 'opp-opencv-ai')!
    expect(opencv.state).toBe('skipped')
    expect(opencv.skipReason).toBe('Needs 30 h, 29 h available by Oct 26')
    expect(states.lastIndexOf('pursuable')).toBeLessThan(states.indexOf('skipped'))
  })

  it('no thread or node carries a count', () => {
    for (const p of web.projects) expect(p.title).not.toMatch(/\d/)
  })
})

describe('buildReuseWeb shared gap placeholder', () => {
  it('a shared gap becomes a missing project linked to the entries it would unlock', () => {
    const { plan, assets } = demo()
    const withGap: Plan = { ...plan, shared_gaps: [{ tag: 'research-writing', affects: ['opp-imlc', 'opp-nasa-space-apps'] }] }
    const web = buildReuseWeb(withGap, assets, { committed_ids: [] }, {})
    const gap = web.projects.find(p => p.missing)!
    expect(gap).toEqual({ id: 'gap:research-writing', title: 'No project yet: research writing', missing: true })
    const gapThreads = web.threads.filter(t => t.projectId === gap.id)
    expect(gapThreads.map(t => t.opportunityId)).toEqual(['opp-imlc', 'opp-nasa-space-apps'])
    expect(gapThreads[0].matchedTags).toEqual(['research-writing'])
  })

  it('no assets -> empty model', () => {
    const { plan } = demo()
    expect(buildReuseWeb({ ...plan, shared_gaps: [] }, [], { committed_ids: [] }, {})).toEqual({ projects: [], opportunities: [], threads: [] })
  })
})

describe('anyCombinationOverloads (C4 report)', () => {
  it('10 h: no committable combination overloads a week', () => {
    const { plan, form } = demo(10)
    expect(anyCombinationOverloads(plan.tiered_opportunities, TODAY, 10, form.busy_weeks)).toBe(false)
  })
  it('4 h: some combination overloads', () => {
    const { plan, form } = demo(4)
    expect(anyCombinationOverloads(plan.tiered_opportunities, TODAY, 4, form.busy_weeks)).toBe(true)
  })
})
