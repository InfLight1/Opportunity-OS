import type { BusyPeriod, TieredOpportunity } from '../engine/types'
import { buildSchedule } from '../engine/schedule'
import { isCommittable } from './commit-state'

// --- What-if capacity helpers (preview only; never changes stored commits) ---

const MAX_SUBSET_ITEMS = 12

/**
 * True when at least one set of committable entries overloads a week at this
 * capacity. Used for the honest "no combination overloads at N h" line.
 * Enumerates subsets (capped at 12 items = 4095 sets); null when over the cap.
 */
export function anyCombinationOverloads(
  tiered: TieredOpportunity[],
  today: string,
  weeklyCapacityHours: number,
  busyWeeks: BusyPeriod[],
): boolean | null {
  const items = tiered.filter(t => isCommittable(t, today)).map(t => t.opportunity)
  if (items.length > MAX_SUBSET_ITEMS) return null
  for (let mask = 1; mask < 1 << items.length; mask++) {
    const subset = items.filter((_, i) => mask & (1 << i))
    if (buildSchedule(subset, today, weeklyCapacityHours, busyWeeks).buckets.some(b => b.overloaded)) return true
  }
  return false
}
