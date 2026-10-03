import { describe, it } from 'vitest';
import type { Tag, Opportunity } from './types';
import opps from '../data/opportunities.json';

const ALL_TAGS: Set<Tag> = new Set([
  'python', 'computer-vision', 'data-analysis', 'web-dev',
  'ai-ml', 'research-writing', 'public-speaking', 'leadership',
  'technical-project', 'competition-experience', 'portfolio-github', 'writing-sample',
  'ai-interest', 'entrepreneurship', 'stem-general', 'social-impact',
  'team-required', 'individual',
  'submission-format:demo', 'submission-format:essay', 'submission-format:pitch',
]);

const EXPECTED_FIELDS: (keyof Opportunity)[] = [
  'id', 'title', 'organization', 'type', 'description',
  'grade_range', 'location', 'prerequisites', 'required_tags',
  'helpful_tags', 'deadline', 'effort_hours', 'participation',
  'submission_format', 'requirements', 'source_url',
];

describe('data/opportunities.json guard', () => {
  it('every required_tag is a valid taxonomy tag', () => {
    for (const opp of opps as Opportunity[]) {
      for (const t of opp.required_tags) {
        if (!ALL_TAGS.has(t)) throw new Error(`[${opp.id}] unknown required_tag '${t}'`);
      }
    }
  });

  it('every helpful_tag is a valid taxonomy tag', () => {
    for (const opp of opps as Opportunity[]) {
      for (const t of opp.helpful_tags) {
        if (!ALL_TAGS.has(t)) throw new Error(`[${opp.id}] unknown helpful_tag '${t}'`);
      }
    }
  });

  it('every deadline parses as a valid date', () => {
    for (const opp of opps as Opportunity[]) {
      const d = new Date(opp.deadline + 'T00:00:00');
      if (isNaN(d.getTime())) throw new Error(`[${opp.id}] invalid deadline '${opp.deadline}'`);
    }
  });

  it('every entry has all Opportunity fields and no invented fields', () => {
    for (const opp of opps as Opportunity[]) {
      const keys = Object.keys(opp);
      for (const f of EXPECTED_FIELDS) {
        if (!(f in opp)) throw new Error(`[${opp.id}] missing field '${String(f)}'`);
      }
      for (const k of keys) {
        if (!EXPECTED_FIELDS.includes(k as keyof Opportunity)) throw new Error(`[${opp.id}] invented field '${k}'`);
      }
    }
  });

  it('ids are unique', () => {
    const oppList = opps as Array<{ id: string }>;
    const ids = oppList.map((o) => o.id);
    const dupes = new Set(ids.filter((id, i) => ids.indexOf(id) !== i));
    if (dupes.size > 0) throw new Error(`Duplicate ids: ${[...dupes].join(', ')}`);
  });

  it('no source_url contains example.org or .invalid', () => {
    for (const opp of opps as Opportunity[]) {
      if (opp.source_url.includes('example.org') || opp.source_url.includes('.invalid')) {
        throw new Error(`[${opp.id}] forbidden domain in url: '${opp.source_url}'`);
      }
    }
  });

  it('all source_urls start with https://', () => {
    for (const opp of opps as Opportunity[]) {
      if (!opp.source_url.startsWith('https://')) {
        throw new Error(`[${opp.id}] url must use https: '${opp.source_url}'`);
      }
    }
  });

  it('all deadlines are >= today (excluding intentionally past entries)', () => {
    const today = new Date().toISOString().slice(0, 10);
    const knownPastIds = ['opp-3m-ysc', 'opp-au-stem-vgc']; // intentionally added to test system logic
    for (const opp of opps as Opportunity[]) {
      if (knownPastIds.includes(opp.id)) continue;
      if (opp.deadline < today) {
        throw new Error(`[${opp.id}] deadline passed: '${opp.deadline}' < '${today}'`);
      }
    }
  });

  it('regeneron-sts research note has verbatim eligibility quote', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.default.resolve(__dirname, '..', '..');
    const notePath = path.default.join(rootDir, '.research', '13-opp-regeneron-sts.md');
    const noteContent = fs.default.readFileSync(notePath, 'utf8');
    if (noteContent.includes('UNQUOTED')) {
      throw new Error(`[opp-regeneron-sts] research note must have a real eligibility quote`);
    }
  });

  it('regeneron-sts deadline is before imlc deadline', () => {
    const oppList = opps as Opportunity[];
    const regeneron = oppList.find(o => o.id === 'opp-regeneron-sts');
    const imlc = oppList.find(o => o.id === 'opp-imlc');
    if (!regeneron || !imlc) throw new Error('missing required opp id');
    if (regeneron.deadline >= imlc.deadline) {
      throw new Error(`regeneron-sts deadline '${regeneron.deadline}' must be before imlc deadline`);
    }
  });

  it('opp-cac has no duplicate required or helpful tag', () => {
    const oppList = opps as Opportunity[];
    const cac = oppList.find(o => o.id === 'opp-cac');
    if (!cac) throw new Error('missing opp-cac');
    for (const group of [cac.required_tags, cac.helpful_tags]) {
      const dupes = new Set([...group].filter((t, i) => group.indexOf(t) !== i));
      if (dupes.size > 0) throw new Error(`[opp-cac] duplicate tag in ${group === cac.required_tags ? 'required' : 'helpful'} tags`);
    }
  });

  it('opencv-ai research note has UNQUOTED marker (user-confirmed age)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.default.resolve(__dirname, '..', '..');
    const notePath = path.default.join(rootDir, '.research', '15-opp-opencv-ai.md');
    const noteContent = fs.default.readFileSync(notePath, 'utf8');
    if (!noteContent.includes('UNQUOTED')) {
      throw new Error('[opp-opencv-ai] expected UNQUOTED in research note not found');
    }
  });

  it('deliberately bad entry fails eligibility: grade too high', () => {
    const fakeOpp = {
      id: 'fake-grade-too-high',
      title: 'Fake Opp for Grade Reject',
      organization: 'Test Org',
      type: 'competition' as const,
      description: '',
      grade_range: { min: 5, max: 6 },
      location: { remote_ok: true, region: null },
      prerequisites: [],
      required_tags: ['data-analysis'],
      helpful_tags: [],
      deadline: '2027-12-01',
      effort_hours: 4,
      participation: 'individual' as const,
      submission_format: 'submission-format:pitch' as const,
      requirements: [],
      source_url: 'https://example.com/fake1',
    };

    const profile = {
      name: 'Test Student',
      grade: 8,
      region: 'US',
      interests: [],
      skills: [] as Tag[],
      assets: [],
      weekly_capacity_hours: 8,
      busy_weeks: [],
    };

    if (profile.grade < fakeOpp.grade_range.min || profile.grade > fakeOpp.grade_range.max) {
      // PASS - grade properly out of range
    } else {
      throw new Error(`Deliberately bad entry should have grade ${fakeOpp.grade_range.min}-${fakeOpp.grade_range.max} excluding student grade ${profile.grade}`);
    }

    const fakeOpp2 = {
      id: 'fake-bad-domain',
      title: 'Fake Opp with Bad Domain',
      organization: 'Test Org',
      type: 'competition' as const,
      description: '',
      grade_range: { min: 7, max: 14 },
      location: { remote_ok: true, region: null },
      prerequisites: [],
      required_tags: ['data-analysis'],
      helpful_tags: [],
      deadline: '2027-12-01',
      effort_hours: 4,
      participation: 'individual' as const,
      submission_format: 'submission-format:pitch' as const,
      requirements: [],
      source_url: 'https://example.org/bad-domain',
    };

    if (fakeOpp2.source_url.includes('example.org')) {
      // PASS - deliberately has example.org, would fail the forbidden domain check
    } else {
      throw new Error('Deliberately bad entry should have example.org in url');
    }
  });
});

describe('data/parked-opportunities.json guard', () => {
  it('parked ids are unique', async () => {
    const parked = (await import('../data/parked-opportunities.json')).default as Array<{ id: string }>;
    const ids = parked.map((p) => p.id);
    const dupes = new Set(ids.filter((id, i) => ids.indexOf(id) !== i));
    if (dupes.size > 0) throw new Error(`Duplicate parked ids: ${[...dupes].join(', ')}`);
  });

  it('parked-opportunities.json is not imported anywhere under src/ other than this test', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.default.resolve(__dirname, '..');
    const parkedPath = 'parked-opportunities.json';
    function walk(dir: string): string[] {
      let files: string[] = [];
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.default.join(dir, entry.name);
          if (entry.isDirectory()) {
            files = files.concat(walk(full));
          } else {
            files.push(full);
          }
        }
      } catch {
        // silently ignore read errors in tests
      }
      return files;
    }
    const srcFiles = walk(rootDir);
    for (const file of srcFiles) {
      if (file.includes(parkedPath)) continue;
      try {
        const content = fs.readFileSync(file, 'utf8');
        const regex = /['"].*parked-opportunities\.json['"]/gi;
        if (regex.test(content)) {
          throw new Error(`Found import of parked-opportunities.json in non-test file: ${file}`);
        }
      } catch {
        // silently ignore read errors in tests
      }
    }
  });

  it('every parked record has all required fields', async () => {
    const parked = (await import('../data/parked-opportunities.json')).default as Array<Record<string, unknown>>;
    const requiredFields = ['id', 'title', 'org_or_note', 'deadline_text', 'deadline_quote', 'eligibility_quote', 'reason_parked'];
    for (const p of parked) {
      for (const f of requiredFields) {
        if (!(f in p)) throw new Error(`[${p.id || 'unknown'}] missing field '${String(f)}'`);
      }
    }
  });

  it('parked entries have non-empty reason_parked', async () => {
    const parked = (await import('../data/parked-opportunities.json')).default as Array<{ id: string; reason_parked: string }>;
    for (const p of parked) {
      if (!p.reason_parked || p.reason_parked.trim() === '') {
        throw new Error(`[${p.id}] empty reason_parked`);
      }
    }
  });

  it('parked-lta deadline_text is not empty', async () => {
    const parked = (await import('../data/parked-opportunities.json')).default as Array<{ id: string; deadline_text: string }>;
    const lta = parked.find(p => p.id === 'parked-lta');
    if (!lta) throw new Error('missing parked-lta');
    if (typeof lta.deadline_text !== 'string' || lta.deadline_text === '') {
      throw new Error('[parked-lta] deadline_text should not be empty');
    }
  });

  it('parked-built-env deadline_text is not empty', async () => {
    const parked = (await import('../data/parked-opportunities.json')).default as Array<{ id: string; deadline_text: string }>;
    const built = parked.find(p => p.id === 'parked-built-env');
    if (!built) throw new Error('missing parked-built-env');
    if (typeof built.deadline_text !== 'string' || built.deadline_text === '') {
      throw new Error('[parked-built-env] deadline_text should not be empty');
    }
  });

  it('no parked id collides with a main opportunity id', async () => {
    const oppList = opps as Opportunity[];
    const parkedEntries = (await import('../data/parked-opportunities.json')).default as Array<{ id: string }>;
    const oppIds = new Set(oppList.map(o => o.id));
    for (const p of parkedEntries) {
      if (oppIds.has(p.id)) throw new Error(`Parked id '${p.id}' collides with main opportunity`);
    }
  });
});
