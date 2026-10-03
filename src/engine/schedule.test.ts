import { describe, it, expect } from 'vitest';
import { buildSchedule, isSchedulable, type SchedulableItem } from './schedule';
import { bucketIndex } from './buckets';
import type { BusyPeriod, Schedule } from './types';

// Pinned per AGENTS.md: bucket 0 = 10-03..10-09, b1 = 10-10..10-16,
// b2 = 10-17..10-23, b3 = 10-24..10-30.
const TODAY = '2026-10-03';
const B0 = '2026-10-05';
const B2 = '2026-10-20';
const B3 = '2026-10-26';

const item = (id: string, deadline: string, effort_hours: number): SchedulableItem => ({ id, deadline, effort_hours });

function itemById(s: Schedule, id: string) {
  const found = s.items.find(i => i.opportunity_id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

function hoursIn(s: Schedule, id: string): Record<number, number> {
  const out: Record<number, number> = {};
  for (const p of itemById(s, id).placements) out[p.bucket] = p.hours;
  return out;
}

// --- Worked examples (Plan s5, capacity 10) ---

describe('worked examples (capacity 10)', () => {
  it('overload: A 8h + B 8h due bucket 0 -> 10 placed, 6 overflow, bucket 0 shows 16/10 red', () => {
    const s = buildSchedule([item('A', B0, 8), item('B', B0, 8)], TODAY, 10, []);
    expect(hoursIn(s, 'A')).toEqual({ 0: 8 });
    expect(hoursIn(s, 'B')).toEqual({ 0: 2 });
    expect(itemById(s, 'A').overflow_hours).toBe(0);
    expect(itemById(s, 'B').overflow_hours).toBe(6);
    expect(s.buckets[0].load_hours).toBe(16);
    expect(s.buckets[0].capacity_hours).toBe(10);
    expect(s.buckets[0].overloaded).toBe(true);
  });

  it('spill: A 6h, B 10h, C 6h due bucket 3 -> loads 10/10, 10/10, 2/10; start-by A=3, B=2, C=1', () => {
    const s = buildSchedule([item('A', B3, 6), item('B', B3, 10), item('C', B3, 6)], TODAY, 10, []);
    expect(hoursIn(s, 'A')).toEqual({ 3: 6 });
    expect(hoursIn(s, 'B')).toEqual({ 3: 4, 2: 6 });
    expect(hoursIn(s, 'C')).toEqual({ 2: 4, 1: 2 });
    expect(s.buckets.map(b => b.load_hours)).toEqual([0, 2, 10, 10]);
    expect(s.buckets.some(b => b.overloaded)).toBe(false);
    expect(itemById(s, 'A').start_by_bucket).toBe(3);
    expect(itemById(s, 'B').start_by_bucket).toBe(2);
    expect(itemById(s, 'C').start_by_bucket).toBe(1);
  });

  it('busy: F 6h due in a fully busy bucket 2 -> b2 0, b1 6, start-by 1', () => {
    const busy: BusyPeriod[] = [{ start: '2026-10-17', end: '2026-10-23', label: 'Exams' }];
    const s = buildSchedule([item('F', B2, 6)], TODAY, 10, busy);
    expect(s.buckets[2].capacity_hours).toBe(0);
    expect(hoursIn(s, 'F')).toEqual({ 1: 6 });
    expect(itemById(s, 'F').start_by_bucket).toBe(1);
    expect(itemById(s, 'F').overflow_hours).toBe(0);
  });
});

// --- Edge table (Plan s5) ---

describe('edge cases', () => {
  it('deadline today -> only bucket 0', () => {
    const s = buildSchedule([item('T', TODAY, 15)], TODAY, 10, []);
    expect(s.buckets).toHaveLength(1);
    expect(hoursIn(s, 'T')).toEqual({ 0: 10 });
    expect(itemById(s, 'T').overflow_hours).toBe(5);
  });

  it('deadline in the past -> not schedulable, left out', () => {
    expect(isSchedulable(item('P', '2026-10-02', 4), TODAY)).toBe(false);
    const s = buildSchedule([item('P', '2026-10-02', 4)], TODAY, 10, []);
    expect(s.items).toEqual([]);
  });

  it('deadline in a busy period -> reduced capacity in that bucket', () => {
    const busy: BusyPeriod[] = [{ start: '2026-10-20', end: '2026-10-27' }];
    const s = buildSchedule([item('M', B2, 8)], TODAY, 10, busy);
    expect(s.buckets[2].capacity_hours).toBe(4.5);
    expect(hoursIn(s, 'M')).toEqual({ 2: 4.5, 1: 3.5 });
  });

  it('capacity 0 -> every commit overflows, no start-by', () => {
    const s = buildSchedule([item('Z', B3, 6)], TODAY, 0, []);
    expect(itemById(s, 'Z').placements).toEqual([]);
    expect(itemById(s, 'Z').overflow_hours).toBe(6);
    expect(itemById(s, 'Z').start_by_bucket).toBeNull();
    expect(s.buckets[3].overloaded).toBe(true);
  });

  it('fractional hours round to 0.5', () => {
    const s = buildSchedule([item('R', B0, 2.3)], TODAY, 10, []);
    expect(hoursIn(s, 'R')).toEqual({ 0: 2.5 });
  });

  it('uncommit -> recompute with no leftovers', () => {
    const before = buildSchedule([item('A', B3, 6)], TODAY, 10, []);
    buildSchedule([item('A', B3, 6), item('B', B3, 10)], TODAY, 10, []);
    const after = buildSchedule([item('A', B3, 6)], TODAY, 10, []);
    expect(after).toEqual(before);
  });

  it('same-deadline ties are stable by id regardless of input order', () => {
    const s1 = buildSchedule([item('b', B0, 8), item('a', B0, 8)], TODAY, 10, []);
    expect(hoursIn(s1, 'a')).toEqual({ 0: 8 });
    expect(hoursIn(s1, 'b')).toEqual({ 0: 2 });
    expect(s1.items.map(i => i.opportunity_id)).toEqual(['a', 'b']);
  });

  it('missing deadline or effort -> not schedulable', () => {
    expect(isSchedulable(item('X', '', 4), TODAY)).toBe(false);
    expect(isSchedulable(item('X', 'soon', 4), TODAY)).toBe(false);
    expect(isSchedulable(item('X', B3, 0), TODAY)).toBe(false);
    expect(isSchedulable(item('X', B3, Number.NaN), TODAY)).toBe(false);
    expect(buildSchedule([item('X', '', 4)], TODAY, 10, []).items).toEqual([]);
  });

  it('timeline extends to the latest committed deadline', () => {
    const s = buildSchedule([item('A', B0, 2), item('L', '2026-12-13', 6)], TODAY, 10, []);
    expect(s.buckets).toHaveLength(bucketIndex('2026-12-13', TODAY) + 1);
    expect(s.buckets[s.buckets.length - 1].start <= '2026-12-13').toBe(true);
    expect(s.buckets[s.buckets.length - 1].end >= '2026-12-13').toBe(true);
  });

  it('no commits -> bucket 0 only, empty items', () => {
    const s = buildSchedule([], TODAY, 10, []);
    expect(s.buckets).toHaveLength(1);
    expect(s.items).toEqual([]);
  });

  it('a repeated id counts once', () => {
    const s = buildSchedule([item('A', B0, 4), item('A', B0, 4)], TODAY, 10, []);
    expect(s.items).toHaveLength(1);
    expect(s.buckets[0].load_hours).toBe(4);
  });
});

// --- Properties (seeded hand-rolled generator, no new dependency) ---

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
function dayOffset(n: number): string {
  return new Date(Date.UTC(2026, 9, 3) + n * DAY_MS).toISOString().slice(0, 10);
}

type Case = { items: SchedulableItem[]; capacity: number; busy: BusyPeriod[] };

function genCase(rand: () => number): Case {
  const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  const n = int(0, 7);
  const items: SchedulableItem[] = [];
  for (let i = 0; i < n; i++) {
    items.push(item(`o${i}`, dayOffset(int(0, 55)), int(1, 60) / 2));
  }
  const busy: BusyPeriod[] = [];
  if (rand() < 0.5) {
    const start = int(0, 50);
    busy.push({ start: dayOffset(start), end: dayOffset(start + int(0, 10)) });
  }
  return { items, capacity: int(0, 40) / 2, busy };
}

function shuffle<T>(xs: T[], rand: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const totalOverflow = (s: Schedule) => s.items.reduce((sum, i) => sum + i.overflow_hours, 0);

const RUNS = 300;

describe('schedule properties (seeded, 300 cases each)', () => {
  it('(1) placed + overflow = effort (rounded to 0.5) per item', () => {
    const rand = mulberry32(1);
    for (let r = 0; r < RUNS; r++) {
      const c = genCase(rand);
      const s = buildSchedule(c.items, TODAY, c.capacity, c.busy);
      for (const it of c.items) {
        const si = itemById(s, it.id);
        const placed = si.placements.reduce((sum, p) => sum + p.hours, 0);
        expect(placed + si.overflow_hours).toBe(Math.round(it.effort_hours * 2) / 2);
      }
    }
  });

  it('(2) no bucket over capacity unless it carries overflow', () => {
    const rand = mulberry32(2);
    let overloadedSeen = 0;
    for (let r = 0; r < RUNS; r++) {
      const c = genCase(rand);
      const s = buildSchedule(c.items, TODAY, c.capacity, c.busy);
      const carriesOverflow = new Set<number>();
      for (const it of c.items) {
        if (itemById(s, it.id).overflow_hours > 0) carriesOverflow.add(bucketIndex(it.deadline, TODAY));
      }
      for (const b of s.buckets) {
        if (b.overloaded) { overloadedSeen++; expect(carriesOverflow.has(b.index)).toBe(true); }
        expect(b.overloaded).toBe(b.load_hours > b.capacity_hours);
      }
    }
    expect(overloadedSeen).toBeGreaterThan(0); // generator reaches the interesting case
  });

  it('(3) no hours before today or after the deadline bucket', () => {
    const rand = mulberry32(3);
    for (let r = 0; r < RUNS; r++) {
      const c = genCase(rand);
      const s = buildSchedule(c.items, TODAY, c.capacity, c.busy);
      for (const it of c.items) {
        for (const p of itemById(s, it.id).placements) {
          expect(p.bucket).toBeGreaterThanOrEqual(0);
          expect(p.bucket).toBeLessThanOrEqual(bucketIndex(it.deadline, TODAY));
          expect(p.hours).toBeGreaterThan(0);
        }
      }
    }
  });

  it('(4) order independence', () => {
    const rand = mulberry32(4);
    for (let r = 0; r < RUNS; r++) {
      const c = genCase(rand);
      const a = buildSchedule(c.items, TODAY, c.capacity, c.busy);
      const b = buildSchedule(shuffle(c.items, rand), TODAY, c.capacity, c.busy);
      expect(b).toEqual(a);
    }
  });

  it('(5) commit then uncommit restores the schedule', () => {
    const rand = mulberry32(5);
    for (let r = 0; r < RUNS; r++) {
      const c = genCase(rand);
      const before = buildSchedule(c.items, TODAY, c.capacity, c.busy);
      const extra = item('extra', dayOffset(Math.floor(rand() * 56)), 1 + Math.floor(rand() * 30));
      const withExtra = [...c.items, extra];
      buildSchedule(withExtra, TODAY, c.capacity, c.busy);
      const after = buildSchedule(withExtra.filter(i => i.id !== 'extra'), TODAY, c.capacity, c.busy);
      expect(after).toEqual(before);
    }
  });

  it('(6) raising capacity never increases total overload', () => {
    const rand = mulberry32(6);
    let strictlyBetter = 0;
    for (let r = 0; r < RUNS; r++) {
      const c = genCase(rand);
      const lower = buildSchedule(c.items, TODAY, c.capacity, c.busy);
      const higher = buildSchedule(c.items, TODAY, c.capacity + (1 + Math.floor(rand() * 20)) / 2, c.busy);
      expect(totalOverflow(higher)).toBeLessThanOrEqual(totalOverflow(lower));
      if (totalOverflow(higher) < totalOverflow(lower)) strictlyBetter++;
    }
    expect(strictlyBetter).toBeGreaterThan(0); // generator reaches the interesting case
  });

  it('(7) start-by = earliest bucket with hours (null if none)', () => {
    const rand = mulberry32(7);
    for (let r = 0; r < RUNS; r++) {
      const c = genCase(rand);
      const s = buildSchedule(c.items, TODAY, c.capacity, c.busy);
      for (const si of s.items) {
        const withHours = si.placements.filter(p => p.hours > 0).map(p => p.bucket);
        expect(si.start_by_bucket).toBe(withHours.length > 0 ? Math.min(...withHours) : null);
      }
    }
  });
});
