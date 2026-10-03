import { describe, it, expect } from 'vitest';
import opps from '../data/opportunities.json';
import { fixtureProfile } from './fixtures';
import { runEngine } from './run-engine';

const TEST_TODAY = '2026-10-03';

describe('demo-narrative: full funnel with finalized demo profile', () => {
  const profile = {
    name: fixtureProfile.name,
    grade: fixtureProfile.grade,
    region: fixtureProfile.region,
    interests: [...fixtureProfile.interests],
    skills: [...fixtureProfile.skills],
    assets: JSON.parse(JSON.stringify(fixtureProfile.assets)),
    weekly_capacity_hours: fixtureProfile.weekly_capacity_hours,
    busy_weeks: JSON.parse(JSON.stringify(fixtureProfile.busy_weeks)) as [],
  };

  const result = runEngine(profile, opps as Parameters<typeof runEngine>[1], TEST_TODAY);
  const tennisAsset = result.assets.find(a => a.id === 'asset-tennis');

  expect(tennisAsset).toBeDefined();
  if (!tennisAsset) throw new Error('tennis asset not found in computed assets');

  // ====== Report: full supports list (id, title, effort_hours, tier) ======
  const supportRows: string[] = [];
  for (const oid of tennisAsset.supports) {
    const tiered = result.plan.tiered_opportunities.find(t => t.opportunity.id === oid);
    if (tiered) {
      supportRows.push(
        `  ${oid}: title="${tiered.opportunity.title}", effort_hours=${tiered.opportunity.effort_hours}, tier=${tiered.tier}`
      );
    } else {
      supportRows.push(`  ${oid}: NOT in tiered list`);
    }
  }
  console.log('[demo-narrative] Tennis asset tags:', JSON.stringify(tennisAsset.tags));
  console.log('[demo-narrative] Tennis asset supports.length:', tennisAsset.supports.length);
  console.log('[demo-narrative] Tennis asset supports list:');
  supportRows.forEach(r => console.log(r));

  // ====== Report: ALL 9 opportunities eligibility ======
  const allOpps = result.plan.tiered_opportunities;
  for (const t of allOpps) {
    const eligibleStr = t.eligible ? 'true' : 'false';
    console.log(`[demo-narrative] ${t.opportunity.id}: eligible=${eligibleStr}, tier=${t.tier}`);
    if (!t.eligible) {
      // The reason string is in match.reason (starts with "Eligibility: Ineligible: ...")
      const reason = t.match.reason;
      console.log(`  -> ${reason}`);
    }
  }

  // ====== Report: CAC tier breakdown ======
  const cacTiered = allOpps.find(t => t.opportunity.id === 'opp-cac');
  if (cacTiered) {
    const requiredMatchCount = cacTiered.match.matched_required ? cacTiered.match.matched_required.length : 0;
    console.log(`[demo-narrative] opp-cac tier breakdown:`);
    console.log(`  required_tag_matches: ${requiredMatchCount} (${cacTiered.match.matched_required?.join(', ' || '')})`);
    console.log(`  busy_collision: ${cacTiered.has_busy_week_collision}`);
    console.log(`  reuse_count: ${cacTiered.reuse_count}`);
    console.log(`  gap_count: ${cacTiered.gap_count}`);
    console.log(`  helper_tag_matches: ${cacTiered.match.helpful_match_count}`);
  }

  // ====== Report: funnel counts ======
  const total = allOpps.length;
  const eligible = allOpps.filter(t => t.eligible).length;
  const matched = allOpps.filter(
    t => t.eligible && (t.match.matched_required.length >= 1 || t.match.helpful_match_count >= 2)
  ).length;
  const focusCount = allOpps.filter(t => t.tier === 'FOCUS').length;
  const considerCount = allOpps.filter(t => t.tier === 'CONSIDER').length;
  const skipCount = allOpps.filter(t => t.tier === 'SKIP').length;
  console.log(`[demo-narrative] Funnel: total=${total}, eligible=${eligible}, matched=${matched}, FOCUS=${focusCount}, CONSIDER=${considerCount}, SKIP=${skipCount}`);

  // ── Assertion 1: tennis asset supports >= 3 ──
  it('tennis asset supports >= 3 opportunities', () => {
    expect(tennisAsset.supports.length).toBeGreaterThanOrEqual(3);
  });

  // ── Assertion 2 (modified): count of supported opps with effort <= capacity >= 3 ──
  // EXPECTED to fail: current qualifying count is 2 (opp-imlc, opp-cac). Failure message lists them.
  it('tennis-supported opps within weekly capacity >= 3', () => {
    const qualifyingIds: string[] = [];
    for (const oid of tennisAsset.supports) {
      const tiered = allOpps.find(t => t.opportunity.id === oid);
      if (tiered && tiered.opportunity.effort_hours <= profile.weekly_capacity_hours) {
        qualifyingIds.push(oid);
      }
    }
    console.log('[demo-narrative] Qualifying tennis-supported opps (effort <= capacity):', JSON.stringify(qualifyingIds), 'count:', qualifyingIds.length);
    expect(qualifyingIds.length).toBeGreaterThanOrEqual(3);
  });

  // ── Assertion 3: two intentionally ineligible entries are SKIP and not in supports ──
  it('regeneron-sts is ineligible (grade) and not supported by tennis asset', () => {
    const regeneron = allOpps.find(t => t.opportunity.id === 'opp-regeneron-sts');
    expect(regeneron).toBeDefined();
    if (!regeneron) throw new Error('regeneron-sts not found in tiered opps');
    expect(regeneron.eligible).toBe(false);
    expect(regeneron.tier).toBe('SKIP');
    expect(tennisAsset.supports).not.toContain('opp-regeneron-sts');
  });

  it('au-stem-vgc is ineligible (region + deadline) and not supported by tennis asset', () => {
    const auStem = allOpps.find(t => t.opportunity.id === 'opp-au-stem-vgc');
    expect(auStem).toBeDefined();
    if (!auStem) throw new Error('au-stem-vgc not found in tiered opps');
    expect(auStem.eligible).toBe(false);
    expect(auStem.tier).toBe('SKIP');
    expect(tennisAsset.supports).not.toContain('opp-au-stem-vgc');
  });

  // ── Assertion 4: at least one FOCUS opportunity exists ──
  it('has at least one FOCUS opportunity', () => {
    expect(focusCount).toBeGreaterThanOrEqual(1);
  });
});
