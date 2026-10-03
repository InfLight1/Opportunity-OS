import type { Plan, TieredOpportunity, Asset, WeeklyLoadWarning } from './types';
import { findSharedGaps } from './gaps';
import { selectNextAction } from './next-action';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

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
): Plan {
  // Gather focus opps. Tiers are final here: buildPlan never demotes
  // (runway is a per-item SKIP rule in tier.ts; overload is the scheduler's job).
  const finalFocus = tieredOpps.filter(
    o => o.tier === 'FOCUS' && !o.has_busy_week_collision,
  );

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
