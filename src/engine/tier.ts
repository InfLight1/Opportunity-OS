import type { TieredOpportunity } from './types';

// ─── Tiering (FOCUS / CONSIDER / SKIP) ──────────────────────────────────────
// Decision tree per AGENTS.md Section 2a — no new conditions.
// remainingCapacityHours = weekly_capacity_hours (per-op single-week hard cap).

export function computeTier(
  tiered: TieredOpportunity,
  weeklyCapacityHours: number,
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

  // effort_hours > weekly capacity → SKIP (single-op can't fit in one week).
  if (tiered.opportunity.effort_hours > weeklyCapacityHours) {
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
): TieredOpportunity[] {
  for (const opp of opportunities) {
    computeTier(opp, weeklyCapacityHours);
  }
  return opportunities;
}
