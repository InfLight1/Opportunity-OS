import type { TieredOpportunity } from './types';

/** Check if opportunity deadline falls within any busy period range. */
export function hasCollision(
  opp: TieredOpportunity,
  busyPeriods: { start: string; end: string }[],
): boolean {
  const deadline = opp.opportunity.deadline;
  for (const bp of busyPeriods) {
    if (deadline >= bp.start && deadline <= bp.end) {
      return true;
    }
  }
  return false;
}

/** Set has_busy_week_collision on each opportunity in-place. */
export function detectCollisions(
  opportunities: TieredOpportunity[],
  busyPeriods: { start: string; end: string }[],
): TieredOpportunity[] {
  for (const opp of opportunities) {
    opp.has_busy_week_collision = hasCollision(opp, busyPeriods);
  }
  return opportunities;
}
