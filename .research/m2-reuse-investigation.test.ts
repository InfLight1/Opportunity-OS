import { describe, it } from 'vitest'
import { runEngine, type ProfileInput } from '../src/engine/run-engine'
import opps from '../src/data/opportunities.json'
import { TODAY } from '../src/engine/fixtures'

describe('M2: next-action vs reuse investigation', () => {
  it('debug next action and reuse data for demo profile', () => {
    // Demo-profile-style inputs
    const input: ProfileInput = {
      name: 'Tennis Student',
      grade: 10,
      region: 'US',
      interests: ['ai-interest', 'stem-general'],
      skills: [],
      assets: [
        { id: 'tas-ta-tennis', title: 'Tennis Analytics App', kind: 'project', description: '', tags: ['computer-vision', 'data-analysis'], supports: [], reuse_count: 0 },
        { id: 'tas-python-pet', title: 'Pet Tracker (Python)', kind: 'project', description: '', tags: ['python', 'web-dev'], supports: [], reuse_count: 0 },
      ],
      weekly_capacity_hours: 10,
      busy_weeks: [{ start: '2026-11-01', end: '2026-11-15' }],
    }

    const result = runEngine(input, opps as Parameters<typeof runEngine>[1], TODAY)

    const { plan, assets } = result

    // All FOCUS opps
    const focusOpps = plan.tiered_opportunities.filter(t => t.tier === 'FOCUS')
    console.log('\n[ M2 ] >>> FOCUS opportunities:')
    for (const f of focusOpps) { console.log(`  ${f.opportunity.title} (${f.opportunity.id}) → reuse=${f.reuse_count} gap=${f.gap_count}`) }

    // Tennis asset supports
    const tennisAsset = assets.find(a => a.id === 'tas-ta-tennis')
    if (tennisAsset) {
      console.log(`\n[ M2 ] >>> Tennis analytics supports: ${JSON.stringify(tennisAsset.supports)}`)
    } else {
      // Find any asset with "Tennis" in the title
      const tennisLike = assets.find(a => a.title.toLowerCase().includes('tennis'))
      if (tennisLike) {
        console.log(`\n[ M2 ] >>> Tennis-like asset supports: ${JSON.stringify(tennisLike.supports)}`)
      } else {
        console.log('\n[ M2 ] >>> No tennis asset found in results')
        for (const a of assets) {
          console.log(`  asset ${a.id}: tags=[${a.tags.join(',')}] supports=[${a.supports.join(',')}] reuse=${a.reuse_count}`)
        }
      }
    }

    // Next action
    const nextAction = plan.next_action
    if (nextAction && typeof nextAction === 'object' && nextAction.title) {
      console.log(`\n[ M2 ] >>> Next action: "${(nextAction as any).title}" (asset ${(nextAction as any).asset || nextAction})`)
    } else {
      console.log(`\n[ M2 ] >>> Next action: ${JSON.stringify(nextAction)}`)
    }

    // All opps with tiers
    console.log('\n[ M2 ] >>> All opportunities:')
    for (const t of plan.tiered_opportunities) {
      console.log(`  ${t.opportunity.id} | tier=${t.tier} | eligible=${t.eligible} | reasons=[${t.match.reason}]`)
    }

    // All assets details
    console.log('\n[ M2 ] >>> All assets:')
    for (const a of assets) {
      console.log(`  ${a.id}: tags=[${a.tags.join(',')}] supports=[${a.supports.join(',')}] reuse=${a.reuse_count}`)
    }
  })
})
