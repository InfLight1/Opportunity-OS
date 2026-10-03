import { describe, it, expect } from 'vitest';
import opps from '../data/opportunities.json';
import { runEngine, type ProfileInput } from './run-engine';
import { TODAY } from './fixtures';

describe('M-D4: reason strings in tiered opportunities', () => {
  function makeProfile(grade: number): ProfileInput {
    return {
      name: 'Test Student',
      grade,
      region: 'IE-D',
      interests: [],
      skills: [],
      assets: [],
      weekly_capacity_hours: 8,
      busy_weeks: [],
    };
  }

  it('eligible entry has a reason with eligibility check and matching information', () => {
    const result = runEngine(
      makeProfile(10),
      opps as Parameters<typeof runEngine>[1],
      TODAY,
    );

    const imlc = result.plan.tiered_opportunities.find(i => i.opportunity.id === 'opp-imlc');
    expect(imlc).toBeDefined();
    if (!imlc) throw new Error('missing opp-imlc');

    console.log('[reason] opp-imlc reason:', imlc.match.reason);
    
    // Must contain eligibility info
    expect(imlc.match.reason).toContain('Eligibility');
  });

  it('ineligible-by-grade entry has grade reason and SKIP tier', () => {
    const result = runEngine(
      makeProfile(8), // below 9
      opps as Parameters<typeof runEngine>[1],
      TODAY,
    );

    const regeneron = result.plan.tiered_opportunities.find(i => i.opportunity.id === 'opp-regeneron-sts');
    expect(regeneron).toBeDefined();
    if (!regeneron) throw new Error('missing opp-regeneron-sts');

    console.log('[reason] opp-regeneron-sts reason:', regeneron.match.reason);
    console.log('[reason] opp-regeneron-sts tier:', regeneron.tier);
    
    expect(regeneron.eligible).toBe(false);
    expect(regeneron.tier).toBe('SKIP');
    // Reason should mention grade mismatch
    expect(regeneron.match.reason.toLowerCase()).toContain('grade');
  });

  it('SKIP-by-effort entry (effort > weekly capacity) has effort reason', () => {
    const profile: ProfileInput = {
      name: 'Test Student',
      grade: 10,
      region: 'IE-D',
      interests: [],
      skills: [],
      assets: [{ id: 'tmp-asset', title: 'test', description: '', kind: 'project', tags: ['python'], supports: [], reuse_count: 0 }],
      weekly_capacity_hours: 4, // very low capacity
      busy_weeks: [],
    };

    const result = runEngine(profile, opps as Parameters<typeof runEngine>[1], TODAY);

    // opencv-ai has effort_hours = 30, should be SKIP no matter what
    const opencv = result.plan.tiered_opportunities.find(i => i.opportunity.id === 'opp-opencv-ai');
    expect(opencv).toBeDefined();
    if (!opencv) throw new Error('missing opp-opencv-ai');

    console.log('[reason] opp-opencv-ai reason:', opencv.match.reason);
    console.log('[reason] opp-opencv-ai tier:', opencv.tier);
    
    expect(opencv.tier).toBe('SKIP');
  });
});
