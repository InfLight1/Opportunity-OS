import type { Plan, TieredOpportunity, Asset, WeeklyLoadWarning } from './types';
import { findSharedGaps } from './gaps';
import { selectNextAction } from './next-action';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Compute runway hours: weekly_capacity_hours * weeks_until_latest_deadline among focus opps. */
export function computeRunwayHours(
  focusOpps: TieredOpportunity[],
  weeklyCapacityHours: number,
  today: string,
): number {
  if (focusOpps.length === 0) return 0;

  const latestDeadline = getLatestDeadline(focusOpps);
  if (latestDeadline === null) return 0;

  const diffMs = new Date(latestDeadline).getTime() - new Date(today).getTime();
  const weeks = Math.max(1, Math.ceil(diffMs / MS_PER_WEEK));
  return weeklyCapacityHours * weeks;
}

/** Find the latest deadline among non-collided focus opps. */
function getLatestDeadline(opps: TieredOpportunity[]): string | null {
  let latest: string | null = null;
  for (const o of opps) {
    if (!o.has_busy_week_collision && (latest === null || o.opportunity.deadline > latest)) {
      latest = o.opportunity.deadline;
    }
  }
  return latest;
}

/** Check runway: sum(effort_hours of FOCUS, non-collided) vs weekly_capacity * weeks_until_latest_deadline. */
export function checkRunway(
  focusOpps: TieredOpportunity[],
  weeklyCapacityHours: number,
  today: string,
): boolean {
  const runwayHours = computeRunwayHours(focusOpps, weeklyCapacityHours, today);
  if (runwayHours === 0) return true;

  let sumEffort = 0;
  for (const opp of focusOpps) {
    if (!opp.has_busy_week_collision) {
      sumEffort += opp.opportunity.effort_hours;
    }
  }

  return sumEffort <= runwayHours;
}

/** Return opps that cannot fit within the runway. */
export function deprioritizeOpps(
  focusOpps: TieredOpportunity[],
  weeklyCapacityHours: number,
  today: string,
): { deprioritized: TieredOpportunity[]; remainingFocus: TieredOpportunity[] } {
  // Use full runway hours (not raw weeklyCapacityHours) as previously flagged.
  const runwayHours = computeRunwayHours(focusOpps, weeklyCapacityHours, today);

  const remaining: TieredOpportunity[] = [];
  const deprioritized: TieredOpportunity[] = [];

  // Sort by effort_hours ascending (greedy: fill smallest first).
  const sorted = [...focusOpps].sort(
    (a, b) => a.opportunity.effort_hours - b.opportunity.effort_hours,
  );

  let currentSum = 0;
  for (const opp of sorted) {
    if (!opp.has_busy_week_collision) {
      const potentialSum = currentSum + opp.opportunity.effort_hours;
      // Check runway with this opp added.
      if (potentialSum > runwayHours) {
        deprioritized.push(opp);
      } else {
        remaining.push(opp);
        currentSum += opp.opportunity.effort_hours;
      }
    } else {
      // Collided opps from focus set don't add to effort but get marked DEPRIORITIZED.
      deprioritized.push(opp);
    }
  }

  return { deprioritized, remainingFocus: remaining };
}

/** Detect weeks where FOCUS effort exceeds weekly capacity -- surface as warnings. */
export function detectWeeklyLoadWarnings(
  focusOpps: TieredOpportunity[],
  busyPeriods: Plan['busy_weeks'],
  weeklyCapacityHours: number,
): WeeklyLoadWarning[] {
  if (focusOpps.length === 0) return [];

  // Group opps by the calendar week of their deadline.
  const weeklyEffort = new Map<string, number>();
  for (const opp of focusOpps) {
    const weekStart = getWeekStart(opp.opportunity.deadline);
    weeklyEffort.set(weekStart, (weeklyEffort.get(weekStart) || 0) + opp.opportunity.effort_hours);
  }

  // Also accumulate effort for any busy-period windows.
  const busyWindows = new Map<string, { end: string; label?: string; effort: number }>();
  for (const bp of busyPeriods) {
    let conflictEffort = 0;
    for (const opp of focusOpps) {
      if (opp.opportunity.deadline >= bp.start && opp.opportunity.deadline <= bp.end) {
        conflictEffort += opp.opportunity.effort_hours;
      }
    }
    if (conflictEffort > 0) {
      busyWindows.set(bp.start, { end: bp.end, label: bp.label, effort: conflictEffort });
    }
  }

  const warnings: WeeklyLoadWarning[] = [];

  for (const [weekStart, effort] of weeklyEffort.entries()) {
    if (effort > weeklyCapacityHours) {
      const weekEnd = new Date(new Date(weekStart).getTime() + 7 * MS_PER_WEEK);
      warnings.push({
        week_start: weekStart,
        week_end: weekEnd.toISOString().slice(0, 10),
        required_hours: effort,
        available_hours: weeklyCapacityHours,
      });
    }
  }

  for (const [start, wp] of busyWindows.entries()) {
    if (wp.effort > 0) {
      warnings.push({
        week_start: start,
        week_end: wp.end,
        required_hours: wp.effort,
        available_hours: weeklyCapacityHours,
        label: wp.label || 'Busy period',
      });
    }
  }

  return warnings;
}

/** Get Monday-start of the calendar week containing a date string. */
function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Assemble Plan object from engine results. */
export function buildPlan(
  tieredOpps: TieredOpportunity[],
  allAssets: Asset[],
  weeklyCapacityHours: number,
  busyPeriods: Plan['busy_weeks'],
  today: string,
): Plan {
  // Gather focus opps.
  const focusOpps = tieredOpps.filter(
    o => o.tier === 'FOCUS' && !o.has_busy_week_collision,
  );

  // Runway check -- if over-capacity, deprioritize.
  let finalFocus = [...focusOpps];
  if (!checkRunway(focusOpps, weeklyCapacityHours, today)) {
    const result = deprioritizeOpps(focusOpps, weeklyCapacityHours, today);
    // Remove deprioritized from tiered list too.
    const deprioritizedIds = new Set(result.deprioritized.map(o => o.opportunity.id));
    for (const opp of tieredOpps) {
      if (opp.tier === 'FOCUS' && deprioritizedIds.has(opp.opportunity.id)) {
        opp.tier = 'CONSIDER';
      }
    }
    finalFocus = result.remainingFocus;
  }

  // Build all-asset tag set for gap analysis.
  const allAssetTagSet = new Set<string>();
  for (const asset of allAssets) {
    for (const tag of asset.tags) { allAssetTagSet.add(tag); }
  }

  // Shared gaps and next action from final focus set.
  const sharedGaps = findSharedGaps(tieredOpps, allAssetTagSet);
  const nextAction = selectNextAction(finalFocus, new Map(allAssets.map(a => [a.id, a])));

  // Weekly load warnings for the focus set.
  const weeklyLoadWarnings = detectWeeklyLoadWarnings(finalFocus, busyPeriods, weeklyCapacityHours);

  return {
    weekly_capacity_hours: weeklyCapacityHours,
    busy_weeks: busyPeriods,
    tiered_opportunities: tieredOpps,
    shared_gaps: sharedGaps,
    next_action: nextAction,
    weekly_load_warnings: weeklyLoadWarnings,
  };
}
