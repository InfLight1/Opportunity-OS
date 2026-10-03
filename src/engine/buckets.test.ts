import { describe, it, expect } from 'vitest';
import { addDays, availableHours, bucketAt, bucketIndex, buildBuckets, daysBetween, roundHalf } from './buckets';

const TODAY = '2026-10-03';

describe('date helpers', () => {
  it('addDays crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    expect(addDays('2026-10-03', -3)).toBe('2026-09-30');
  });

  it('daysBetween is signed', () => {
    expect(daysBetween(TODAY, '2026-10-10')).toBe(7);
    expect(daysBetween(TODAY, '2026-09-30')).toBe(-3);
  });

  it('daysBetween is not shifted by the US DST change (Nov 1 2026)', () => {
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
  });
});

describe('bucketIndex (rolling 7-day buckets from today)', () => {
  it('today and the next 6 days are bucket 0', () => {
    expect(bucketIndex(TODAY, TODAY)).toBe(0);
    expect(bucketIndex('2026-10-09', TODAY)).toBe(0);
  });

  it('day 7 starts bucket 1', () => {
    expect(bucketIndex('2026-10-10', TODAY)).toBe(1);
  });

  it('past dates are negative', () => {
    expect(bucketIndex('2026-10-02', TODAY)).toBe(-1);
  });
});

describe('bucketAt / buildBuckets', () => {
  it('bucket k spans [today+7k, today+7k+6]', () => {
    const b = bucketAt(2, TODAY, 10, []);
    expect(b).toEqual({ index: 2, start: '2026-10-17', end: '2026-10-23', busy_days: 0, capacity_hours: 10 });
  });

  it('busy days prorate capacity: 4 busy days of 7 at 10 h -> 4.5 h (rounded to 0.5)', () => {
    const b = bucketAt(2, TODAY, 10, [{ start: '2026-10-20', end: '2026-10-27' }]);
    expect(b.busy_days).toBe(4);
    expect(b.capacity_hours).toBe(4.5);
  });

  it('fully busy bucket has 0 capacity', () => {
    const b = bucketAt(0, TODAY, 10, [{ start: '2026-10-01', end: '2026-10-12' }]);
    expect(b.busy_days).toBe(7);
    expect(b.capacity_hours).toBe(0);
  });

  it('overlapping busy periods count each day once', () => {
    const b = bucketAt(0, TODAY, 7, [
      { start: '2026-10-03', end: '2026-10-05' },
      { start: '2026-10-04', end: '2026-10-06' },
    ]);
    expect(b.busy_days).toBe(4);
    expect(b.capacity_hours).toBe(3);
  });

  it('busy periods with an empty start or end are ignored', () => {
    const b = bucketAt(0, TODAY, 10, [{ start: '', end: '2026-10-05' }]);
    expect(b.busy_days).toBe(0);
    expect(b.capacity_hours).toBe(10);
  });

  it('negative weekly capacity is treated as 0', () => {
    expect(bucketAt(0, TODAY, -5, []).capacity_hours).toBe(0);
  });

  it('buildBuckets returns count consecutive buckets', () => {
    const bs = buildBuckets(TODAY, 3, 8, []);
    expect(bs.map(b => b.start)).toEqual(['2026-10-03', '2026-10-10', '2026-10-17']);
    expect(bs.map(b => b.index)).toEqual([0, 1, 2]);
  });

  it('roundHalf rounds to the nearest 0.5', () => {
    expect(roundHalf(4.2857)).toBe(4.5);
    expect(roundHalf(4.2)).toBe(4);
    expect(roundHalf(7.75)).toBe(8);
  });
});

describe('availableHours (runway)', () => {
  it('deadline today -> only bucket 0', () => {
    expect(availableHours(TODAY, TODAY, 10, [])).toBe(10);
  });

  it('deadline in bucket 3 -> 4 full buckets', () => {
    expect(availableHours('2026-10-26', TODAY, 10, [])).toBe(40);
  });

  it('deadline bucket counts fully even when the deadline is its first day', () => {
    expect(availableHours('2026-10-10', TODAY, 10, [])).toBe(20);
  });

  it('busy days reduce runway (demo profile midterms 10-20..10-27, due 10-26 -> 10+10+4.5+4.5)', () => {
    expect(availableHours('2026-10-26', TODAY, 10, [{ start: '2026-10-20', end: '2026-10-27', label: 'Midterms' }])).toBe(29);
  });

  it('past deadline -> 0', () => {
    expect(availableHours('2026-10-02', TODAY, 10, [])).toBe(0);
  });

  it('capacity 0 -> 0', () => {
    expect(availableHours('2026-12-01', TODAY, 0, [])).toBe(0);
  });
});
