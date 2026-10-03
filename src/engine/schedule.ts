import type { BusyPeriod, Opportunity, Placement, Schedule, ScheduledItem } from './types';
import { bucketIndex, buildBuckets, roundHalf } from './buckets';

// --- Deadline scheduler (AGENTS.md Scheduler) ---
// Pure function of the whole committed set. Items are processed by deadline
// descending (ties by id ascending); each fills its deadline bucket first, then
// earlier buckets, up to remaining capacity. Unplaced hours are overflow,
// added to the deadline bucket's load.

export type SchedulableItem = Pick<Opportunity, 'id' | 'deadline' | 'effort_hours'>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Schedulable = has an ISO deadline on or after today and a positive, finite
 * effort. Past deadlines are not committable; a missing field means the card
 * must ask for it.
 */
export function isSchedulable(item: SchedulableItem, today: string): boolean {
  if (typeof item.deadline !== 'string' || !ISO_DATE.test(item.deadline)) return false;
  if (typeof item.effort_hours !== 'number' || !Number.isFinite(item.effort_hours) || item.effort_hours <= 0) return false;
  return bucketIndex(item.deadline, today) >= 0;
}

function compareIds(a: SchedulableItem, b: SchedulableItem): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function byDeadlineDescThenId(a: SchedulableItem, b: SchedulableItem): number {
  if (a.deadline !== b.deadline) return a.deadline < b.deadline ? 1 : -1;
  return compareIds(a, b);
}

function byDeadlineAscThenId(a: SchedulableItem, b: SchedulableItem): number {
  if (a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1;
  return compareIds(a, b);
}

export function buildSchedule(
  committed: SchedulableItem[],
  today: string,
  weeklyCapacityHours: number,
  busyPeriods: BusyPeriod[],
): Schedule {
  // Unschedulable items are left out; a repeated id counts once (first wins).
  const seen = new Set<string>();
  const items = committed.filter(i => {
    if (seen.has(i.id) || !isSchedulable(i, today)) return false;
    seen.add(i.id);
    return true;
  });

  // Timeline extends to the latest committed deadline (at least bucket 0).
  let lastBucket = 0;
  for (const i of items) lastBucket = Math.max(lastBucket, bucketIndex(i.deadline, today));

  const baseBuckets = buildBuckets(today, lastBucket + 1, weeklyCapacityHours, busyPeriods);
  const remaining = baseBuckets.map(b => b.capacity_hours);
  const load = baseBuckets.map(() => 0);

  const scheduled = new Map<string, ScheduledItem>();
  for (const item of [...items].sort(byDeadlineDescThenId)) {
    const deadlineBucket = bucketIndex(item.deadline, today);
    let left = roundHalf(item.effort_hours);
    const placements: Placement[] = [];

    for (let b = deadlineBucket; b >= 0 && left > 0; b--) {
      const hours = Math.min(left, remaining[b]);
      if (hours <= 0) continue;
      placements.push({ bucket: b, hours });
      remaining[b] -= hours;
      load[b] += hours;
      left -= hours;
    }

    load[deadlineBucket] += left;
    placements.sort((p, q) => p.bucket - q.bucket);
    scheduled.set(item.id, {
      opportunity_id: item.id,
      placements,
      overflow_hours: left,
      start_by_bucket: placements.length > 0 ? placements[0].bucket : null,
    });
  }

  return {
    buckets: baseBuckets.map((b, k) => ({ ...b, load_hours: load[k], overloaded: load[k] > b.capacity_hours })),
    items: [...items].sort(byDeadlineAscThenId).map(i => scheduled.get(i.id)!),
  };
}
