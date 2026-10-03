import type { BusyPeriod, TieredOpportunity } from './types';
import { availableHours } from './buckets';

// ─── Tiering (FOCUS / CONSIDER / SKIP) ──────────────────────────────────────
// Decision tree per AGENTS.md Tiering - no new conditions.
// availableHoursForOpp = runway: capacity from today through the deadline bucket.

export function computeTier(
  tiered: TieredOpportunity,
  availableHoursForOpp: number,
): void {
  // Order matters per spec — check SKIP first.

  if (!tiered.eligible) {
    tiered.tier = 'SKIP';
    return;
  }

  if (tiered.match.matched_required.length === 0) {
    tiered.tier = 'SKIP';
    return;
  }

  // Runway rule: infeasible even as the only commitment -> SKIP.
  if (tiered.opportunity.effort_hours > availableHoursForOpp) {
    tiered.tier = 'SKIP';
    return;
  }

  // FOCUS: ≥1 required match AND no busy-week collision AND (reuse≥2 OR gaps==0)
  const hasRequiredMatch = tiered.match.matched_required.length >= 1;
  const noBusyCollision = !tiered.has_busy_week_collision;
  const highReuse = tiered.reuse_count >= 2;
  const noGaps = tiered.gap_count === 0;

  if (hasRequiredMatch && noBusyCollision && (highReuse || noGaps)) {
    tiered.tier = 'FOCUS';
    return;
  }

  // CONSIDER: everything else that passed eligibility+matching
  tiered.tier = 'CONSIDER';
}

export function tierAll(
  opportunities: TieredOpportunity[],
  weeklyCapacityHours: number,
  today: string,
  busyPeriods: BusyPeriod[],
): TieredOpportunity[] {
  for (const opp of opportunities) {
    computeTier(opp, availableHours(opp.opportunity.deadline, today, weeklyCapacityHours, busyPeriods));
  }
  return opportunities;
}
