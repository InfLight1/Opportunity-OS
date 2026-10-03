import type { BusyPeriod, WeekBucket } from './types';

// --- Rolling 7-day buckets (AGENTS.md Scheduler) ---
// bucket k = days [today+7k, today+7k+6]. Single source of truth for capacity:
// both the runway SKIP rule and the scheduler use bucketAt/buildBuckets/availableHours.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  return new Date(toUtcMs(iso) + n * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

/** Bucket index of a date; negative for dates before today. */
export function bucketIndex(date: string, today: string): number {
  return Math.floor(daysBetween(today, date) / 7);
}

/** Round to the nearest 0.5 h. */
export function roundHalf(hours: number): number {
  return Math.round(hours * 2) / 2;
}

/** Busy periods with an empty start or end are ignored (AGENTS.md Time). */
export function completeBusyPeriods(busyPeriods: BusyPeriod[]): BusyPeriod[] {
  return busyPeriods.filter(bp => bp.start.trim() !== '' && bp.end.trim() !== '');
}

function isBusyDay(day: string, busyPeriods: BusyPeriod[]): boolean {
  for (const bp of busyPeriods) {
    if (day >= bp.start && day <= bp.end) return true;
  }
  return false;
}

/** Capacity of bucket k: weekly x (1 - busy_days/7), rounded to 0.5 h, never negative. */
export function bucketAt(
  index: number,
  today: string,
  weeklyCapacityHours: number,
  busyPeriods: BusyPeriod[],
): WeekBucket {
  const complete = completeBusyPeriods(busyPeriods);
  const start = addDays(today, index * 7);
  const end = addDays(start, 6);
  let busyDays = 0;
  for (let i = 0; i < 7; i++) {
    if (isBusyDay(addDays(start, i), complete)) busyDays++;
  }
  const weekly = Math.max(0, weeklyCapacityHours);
  return {
    index,
    start,
    end,
    busy_days: busyDays,
    capacity_hours: roundHalf(weekly * (1 - busyDays / 7)),
  };
}

/** Buckets 0..count-1 from today. */
export function buildBuckets(
  today: string,
  count: number,
  weeklyCapacityHours: number,
  busyPeriods: BusyPeriod[],
): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  for (let k = 0; k < count; k++) {
    buckets.push(bucketAt(k, today, weeklyCapacityHours, busyPeriods));
  }
  return buckets;
}

/**
 * Runway: hours available from today through the deadline bucket (the deadline
 * bucket counts fully). 0 when the deadline is before today.
 */
export function availableHours(
  deadline: string,
  today: string,
  weeklyCapacityHours: number,
  busyPeriods: BusyPeriod[],
): number {
  const last = bucketIndex(deadline, today);
  if (last < 0) return 0;
  let total = 0;
  for (const b of buildBuckets(today, last + 1, weeklyCapacityHours, busyPeriods)) {
    total += b.capacity_hours;
  }
  return total;
}
