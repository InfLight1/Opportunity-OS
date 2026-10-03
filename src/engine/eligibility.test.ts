import { describe, it, expect } from 'vitest';
import type { Profile, Opportunity } from '../engine/types';
import { isEligible, filterEligibility, matchTags, passesMatching } from '../engine/eligibility';
import { fixtureProfile, fixtureOpportunities, TODAY } from '../engine/fixtures';

describe('isEligible', () => {
  const profile = fixtureProfile;
  const today = TODAY;

  it('returns true for a clean pass (opp-cac)', () => {
    const opp: Opportunity = fixtureOpportunities[0]; // CASE 1
    expect(isEligible(profile, opp, today)).toBe(true);
  });

  it('returns false when grade_range excludes student (opp-grade-fail)', () => {
    const opp: Opportunity = fixtureOpportunities[1]; // CASE 2
    expect(isEligible(profile, opp, today)).toBe(false);
  });

  it('returns true when deadline == today (opp-deadline-today)', () => {
    const opp: Opportunity = fixtureOpportunities[2]; // CASE 3
    expect(isEligible(profile, opp, today)).toBe(true);
  });

  it('returns false when deadline < today', () => {
    const lateOpp: Opportunity = { ...fixtureOpportunities[0], deadline: '2026-09-23' };
    expect(isEligible(profile, lateOpp, today)).toBe(false);
  });

  it('returns true when prerequisites are satisfied by asset tags', () => {
    const withPrereqs: Opportunity = { ...fixtureOpportunities[0], prerequisites: ['python'] };
    expect(isEligible(profile, withPrereqs, today)).toBe(true);
  });

  it('returns false when a prerequisite is missing from assets', () => {
    const withoutPrereqs: Opportunity = { ...fixtureOpportunities[0], prerequisites: ['leadership'] };
    expect(isEligible(profile, withoutPrereqs, today)).toBe(false);
  });

  it('returns true when location.remote_ok is true and region is null', () => {
    const remoteOpp: Opportunity = { ...fixtureOpportunities[0], location: { remote_ok: true, region: null } };
    expect(isEligible(profile, remoteOpp, today)).toBe(true);
  });

  it('returns false when location is incompatible (no remote_ok and region mismatch)', () => {
    const profileIE = profile;
    const opp: Opportunity = { ...fixtureOpportunities[0], location: { remote_ok: false, region: 'US-C' } };
    expect(isEligible(profileIE, opp, today)).toBe(false);
  });

  it('returns true when no remote but region matches', () => {
    const profileIE: Profile = { ...fixtureProfile, region: 'IE-D' };
    const regionMatchOpp: Opportunity = { ...fixtureOpportunities[0], location: { remote_ok: false, region: 'IE-D' } };
    expect(isEligible(profileIE, regionMatchOpp, today)).toBe(true);
  });

  it('returns true when remote_ok is true even with mismatched region', () => {
    const oppRemote: Opportunity = { ...fixtureOpportunities[0], location: { remote_ok: true, region: 'US-C' } };
    expect(isEligible(profile, oppRemote, today)).toBe(true);
  });
});

describe('filterEligibility', () => {
  const profile = fixtureProfile;
  const today = TODAY;

  it('returns eligible with reason for a clean pass', () => {
    const opp = fixtureOpportunities[0];
    const result = filterEligibility(profile, opp, today);
    expect(result.eligible).toBe(true);
    expect(result.reason).toContain('Eligible');
    expect(result.reason).toContain('grade 10');
  });

  it('returns ineligible with grade reason', () => {
    const opp = fixtureOpportunities[1];
    const result = filterEligibility(profile, opp, today);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Ineligible');
    expect(result.reason).toContain('grade 10');
    expect(result.reason).toContain('9-9');
  });

  it('returns ineligible with deadline reason', () => {
    const lateOpp: Opportunity = { ...fixtureOpportunities[0], deadline: '2026-09-20' };
    const result = filterEligibility(profile, lateOpp, today);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('deadline passed');
    expect(result.reason).toContain('2026-09-20');
    expect(result.reason).toContain('2026-09-24');
  });

  it('returns ineligible with prerequisite reason', () => {
    const noPrereqs: Opportunity = { ...fixtureOpportunities[0], prerequisites: ['leadership', 'web-dev'] };
    const result = filterEligibility(profile, noPrereqs, today);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('missing prerequisite');
    expect(result.reason).toContain('leadership');
    expect(result.reason).toContain('web-dev');
  });

  it('returns eligible with matching location reason', () => {
    const profileUS: Profile = { ...fixtureProfile, region: 'US-C' };
    const regionOpp: Opportunity = { ...fixtureOpportunities[0], location: { remote_ok: false, region: 'US-C' } };
    const result = filterEligibility(profileUS, regionOpp, today);
    expect(result.eligible).toBe(true);
  });

  it('returns ineligible with location incompatible reason', () => {
    const profileIE = fixtureProfile;
    const opp: Opportunity = { ...fixtureOpportunities[0], location: { remote_ok: false, region: 'US-C' } };
    const result = filterEligibility(profileIE, opp, today);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('location incompatible');
  });

  it('passes deadline-is-today boundary correctly', () => {
    const opp: Opportunity = { ...fixtureOpportunities[0], deadline: TODAY };
    const result = filterEligibility(profile, opp, today);
    expect(result.eligible).toBe(true);
    expect(result.reason).toContain('Eligible');
  });
});

describe('matchTags', () => {
  const profile = fixtureProfile;

  it('returns MatchResult with reason for a clean match', () => {
    // fixtureProfile.asset-tennis has technical-project, computer-vision, python, portfolio-github, data-analysis
    const opp: Opportunity = { ...fixtureOpportunities[0], required_tags: ['technical-project'], helpful_tags: ['portfolio-github'] };
    const result = matchTags(profile, opp);
    expect(result.reason).toBeDefined();
    expect(typeof result.reason).toBe('string');
  });

  it('one required_tag match is enough to pass matching', () => {
    // asset-tennis has 'technical-project' and 'computer-vision'
    const opp: Opportunity = {
      ...fixtureOpportunities[0],
      grade_range: { min: 9, max: 12 },
      location: { remote_ok: true, region: null },
      prerequisites: [],
      required_tags: ['technical-project'],
      helpful_tags: [],
    };
    expect(passesMatching(profile, opp)).toBe(true);
    const result = matchTags(profile, opp);
    expect(result.matched_required.length).toBe(1);
  });

  it('needs at least 2 helpful_tag matches when no required match', () => {
    // Use asset-tennis tags: technical-project, computer-vision, python, portfolio-github, data-analysis
    const opp: Opportunity = {
      ...fixtureOpportunities[0],
      grade_range: { min: 9, max: 12 },
      location: { remote_ok: true, region: null },
      prerequisites: [],
      required_tags: ['web-dev'],       // NOT in asset → no required match
      helpful_tags: ['python', 'computer-vision'],  // both IN asset → 2 helpful matches
    };
    expect(passesMatching(profile, opp)).toBe(true);
    const result = matchTags(profile, opp);
    expect(result.helpful_match_count).toBe(2);
  });

  it('only 1 helpful_tag is NOT enough when no required match', () => {
    const opp: Opportunity = {
      ...fixtureOpportunities[0],
      grade_range: { min: 9, max: 12 },
      location: { remote_ok: true, region: null },
      prerequisites: [],
      required_tags: ['web-dev'],       // NOT in asset
      helpful_tags: ['python'],          // IN asset but only 1
    };
    expect(passesMatching(profile, opp)).toBe(false);
    const result = matchTags(profile, opp);
    expect(result.matched_required.length).toBe(0);
    expect(result.helpful_match_count).toBe(1);
  });

  it('tags not backed by an Asset must not count (Evidence rule)', () => {
    // Create a profile where skills include 'python' but asset tags don't
    const noEvidenceProfile: Profile = {
      ...fixtureProfile,
      grade: 11,
      assets: [
        {
          id: 'asset-project',
          title: 'Research Paper',
          description: 'A written research project.',
          kind: 'writing',
          tags: ['research-writing', 'writing-sample'],
        },
      ],
    };

    // Use a required_tag 'python' that IS in the original asset — it counts
    const opp: Opportunity = {
      ...fixtureOpportunities[0],
      required_tags: ['research-writing'],
      helpful_tags: [],
    };

    expect(passesMatching(noEvidenceProfile, opp)).toBe(true);

    // The skills field on profile has ['python', 'computer-vision'] — use one that's NOT in the asset tags
    const pureSkillsProfile: Profile = {
      ...fixtureProfile,
      grade: 11,
      assets: [
        {
          id: 'asset-tennis-only',
          title: 'Tennis App',
          description: 'Python project.',
          kind: 'project',
          tags: ['python'], // only python on the asset
        },
      ],
    };

    const skillsOnlyOpp2: Opportunity = {
      ...fixtureOpportunities[0],
      grade_range: { min: 9, max: 12 },
      location: { remote_ok: true, region: null },
      prerequisites: [],
      required_tags: ['computer-vision'], // NOT in asset-tennis-only.tags → no match
    };

    expect(passesMatching(pureSkillsProfile, skillsOnlyOpp2)).toBe(false);
  });

  it('gap_count equals required tags absent from all assets', () => {
    const opp: Opportunity = {
      ...fixtureOpportunities[0],
      grade_range: { min: 9, max: 12 },
      location: { remote_ok: true, region: null },
      prerequisites: [],
      required_tags: ['technical-project', 'web-dev'],  // technical-project in asset, web-dev not
    };
    const result = matchTags(profile, opp);
    expect(result.gap_count).toBe(1);
  });

  it('reason string reports matched tags plainly without scores or percentages', () => {
    const opp: Opportunity = {
      ...fixtureOpportunities[0],
      grade_range: { min: 9, max: 12 },
      location: { remote_ok: true, region: null },
      prerequisites: [],
      required_tags: ['technical-project'],
      helpful_tags: ['portfolio-github', 'python'],
    };
    const result = matchTags(profile, opp);
    expect(result.reason).toContain('Matched');
    expect(result.reason).not.toContain('%');
    expect(result.reason).not.toContain('%');
  });

  it('zero-match case uses a real no-match reason string', () => {
    const zeroMatchProfile: Profile = {
      ...fixtureProfile,
      assets: [
        {
          id: 'asset-none',
          title: 'Blank Project',
          description: 'No tags.',
          kind: 'other',
          tags: [],
        },
      ],
    };
    const opp: Opportunity = {
      ...fixtureOpportunities[0],
      required_tags: ['leadership'],
      helpful_tags: ['web-dev'],
    };
    const result = matchTags(zeroMatchProfile, opp);
    expect(result.reason).toBe('No sufficient match (0 required, 0 helpful)');
    expect(result.matched_required.length).toBe(0);
    expect(result.helpful_match_count).toBe(0);
  });

  it('zero-match reports 0 matched even when helpful_tags are non-empty but none match', () => {
    const profileNoCV: Profile = {
      ...fixtureProfile,
      assets: [
        {
          id: 'asset-writer-only',
          title: 'Essay Collection',
          description: 'Writing samples.',
          kind: 'writing',
          tags: ['research-writing', 'writing-sample'],
        },
      ],
    };
    const opp: Opportunity = {
      ...fixtureOpportunities[0],
      required_tags: [],
      helpful_tags: ['python', 'computer-vision', 'web-dev'],
    };
    const result = matchTags(profileNoCV, opp);
    expect(result.reason).toBe('No sufficient match (0 required, 0 helpful)');
    expect(result.matched_required.length).toBe(0);
    expect(result.helpful_match_count).toBe(0);
  });
});

describe('Evidence rule integration', () => {
  it('bare profile skills without asset backing do NOT satisfy required_tags', () => {
    // Create a profile where profile.skills includes a tag but no asset carries it
    const profile: Profile = {
      ...fixtureProfile,
      grade: 11,
      assets: [
        {
          id: 'asset-writer',
          title: 'Science Essay',
          description: 'A written essay about renewable energy.',
          kind: 'writing',
          tags: ['research-writing'], // only this tag
        },
      ],
    };

    // leadership is NOT in the asset-tennis.tags — requires evidence to count
    const opp: Opportunity = {
      ...fixtureOpportunities[0],
      grade_range: { min: 9, max: 12 },
      location: { remote_ok: true, region: 'IE-D' },
      prerequisites: [],
      required_tags: ['technical-project', 'leadership'],
      helpful_tags: [],
    };

    const result = matchTags(profile, opp);
    expect(result.gap_count).toBe(2); // both NOT in assets
  });

  it('tags on an Asset do count for matching when evidence exists', () => {
    const profile = fixtureProfile;
    const opp: Opportunity = {
      ...fixtureOpportunities[0],
      grade_range: { min: 9, max: 12 },
      location: { remote_ok: true, region: null },
      prerequisites: [],
      required_tags: ['technical-project'], // present in asset-tennis.tags
    };

    const result = matchTags(profile, opp);
    expect(result.matched_required.length).toBe(1);
    expect(passesMatching(profile, opp)).toBe(true);
  });
});

