import type { Profile, Opportunity } from './types';

// today is passed as an argument to the engine, not read from the clock —
// use this constant in tests so results are reproducible
export const TODAY = '2026-09-24';

export const fixtureProfile: Profile = {
  name: 'Rudra Goel',
  grade: 10,
  region: 'Dublin, CA, US',
  interests: ['ai-interest', 'stem-general'],
  skills: ['python', 'computer-vision'], // NOTE: per Evidence rule, these
  // alone don't satisfy matching/gaps — only the tags on assets below do.
  assets: [
    {
      id: 'asset-tennis',
      title: 'Tennis Analytics App',
      description: 'Computer vision tool that tracks shot placement from match video.',
      kind: 'project',
      tags: ['technical-project', 'computer-vision', 'python', 'portfolio-github', 'data-analysis'],
    },
  ],
  weekly_capacity_hours: 10,
  busy_weeks: [
    { start: '2026-10-20', end: '2026-10-27', label: 'Midterms' },
  ],
};

export const fixtureOpportunities: Opportunity[] = [
  {
    // CASE 1: clean pass — eligible, matches, no collision, reuse should exist
    // once a second opportunity below also matches this same asset.
    id: 'opp-cac',
    title: 'Congressional App Challenge',
    organization: 'U.S. House of Representatives',
    type: 'competition',
    description: 'Student-built app competition, one submission per district.',
    grade_range: { min: 9, max: 12 },
    location: { remote_ok: true, region: null },
    prerequisites: [],
    required_tags: ['technical-project'],
    helpful_tags: ['portfolio-github', 'ai-interest'],
    deadline: '2026-10-30',
    effort_hours: 4,
    participation: 'individual',
    submission_format: 'submission-format:demo',
    requirements: ['Original app + video demo + code repository'],
    source_url: 'https://www.congressionalappchallenge.us/',
  },
  {
    // CASE 2: grade fail — grade_range excludes an 11th grader.
    // Confirms eligibility rejects on grade alone, independent of matching.
    id: 'opp-grade-fail',
    title: 'Freshman STEM Showcase',
    organization: 'Example Regional STEM Council',
    type: 'competition',
    description: 'Showcase limited to first-year high schoolers.',
    grade_range: { min: 9, max: 9 },
    location: { remote_ok: true, region: null },
    prerequisites: [],
    required_tags: ['technical-project'],
    helpful_tags: [],
    deadline: '2026-11-15',
    effort_hours: 3,
    participation: 'individual',
    submission_format: 'submission-format:demo',
    requirements: ['9th graders only'],
    source_url: 'https://example.org/stem-showcase',
  },
  {
    // CASE 3: deadline-today boundary — deadline == TODAY.
    // AGENTS.md rule is `deadline < today` fails, so deadline == today
    // must still be ELIGIBLE. This is the trickiest off-by-one to get right.
    id: 'opp-deadline-today',
    title: 'Same-Day Micro-Grant',
    organization: 'Example Foundation',
    type: 'scholarship',
    description: 'Small grant with a same-day submission window.',
    grade_range: { min: 9, max: 12 },
    location: { remote_ok: true, region: null },
    prerequisites: [],
    required_tags: ['technical-project'],
    helpful_tags: [],
    deadline: TODAY, // '2026-09-24' — must NOT be filtered out
    effort_hours: 2,
    participation: 'individual',
    submission_format: 'submission-format:essay',
    requirements: ['One-page project summary'],
    source_url: 'https://example.org/micro-grant',
  },
];
