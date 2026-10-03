# Opportunity OS — AGENTS.md
Wins over global AGENTS.md on conflict.

## Problem
Too many opportunities, too little time. App narrows a curated list into a focused plan and finds reusable work across opportunities.

## Locked
- Stack: Vite+React+TS+Tailwind+shadcn/ui. Browser-only SPA, no backend. localStorage only.
- Engine: deterministic, pure functions, zero React/UI imports. **No percentages/scores, ever.**
- LLM (optional, behind a flag; provider not fixed): proposes and explains, rules decide. Two roles only: (1) "Ask why" — verbalizes structured engine facts for one card; (2) add-your-own intake — extracts opportunity fields from pasted text into a draft the user confirms. Never decides eligibility/matching/tiering/ranking/scheduling, never states deadlines it was not given. Template text renders first, LLM text swaps in; fallback chain: live call → cached answers → templates (intake falls back to the manual form). Every LLM output passes a pure check before display: intake = schema + taxonomy tags + verbatim-quote check; Ask why = titles must exist in the dataset, numbers must come from the input, no "score"/"percent". API keys never in the repo or the client bundle.
- Tags = only matching mechanism. No semantic/NL matching.

## Types (src/engine/types.ts)
Profile, Opportunity, Asset, Evidence, MatchResult, Plan, BusyPeriod. Tags typed from taxonomy below, never free `string`. Shapes locked in the file itself — update this doc before redesigning them.

New types (scheduler and commits; the milestone that adds each one puts it in `types.ts` with these fields, and updates this list first if a field changes):
- `WeekBucket` — `{ index: number; start: string; end: string; busy_days: number; capacity_hours: number }` (rolling 7-day bucket, ISO dates, `end` inclusive).
- `Placement` — `{ bucket: number; hours: number }`.
- `ScheduledItem` — `{ opportunity_id: string; placements: Placement[]; overflow_hours: number; start_by_bucket: number | null }`.
- `Schedule` — `{ buckets: (WeekBucket & { load_hours: number; overloaded: boolean })[]; items: ScheduledItem[] }`.
- `CommitState` — `{ committed_ids: string[] }` (persisted; see Commit state).

## Tags (locked; add here first, then retag — never invent ad hoc)
- Skill: `python` `computer-vision` `data-analysis` `web-dev` `ai-ml` `research-writing` `public-speaking` `leadership`
- Experience: `technical-project` `competition-experience` `portfolio-github` `writing-sample`
- Interest (helpful_tags only, never required): `ai-interest` `entrepreneurship` `stem-general` `social-impact`
- Structural (filter/effort only): `team-required`/`individual`; `submission-format:demo`/`:essay`/`:pitch`

## Engine rules (build exactly — do not redesign)

**Eligibility** (binary). OUT if any: grade_range excludes student; deadline<today; location incompatible; any prerequisite missing from assets.

**Evidence rule.** A tag counts as "held" only if it's on an `Asset`. Profile-form skill checkboxes with no backing asset do NOT satisfy required_tags, matching, or clear gaps. (Evidence > claims — Master Context §10.)

**Matching.** Survives if ≥1 required_tag match OR ≥2 helpful_tag matches, checked against asset tags only (not raw profile.skills).

**Tiering** (order matters, no scores):
```
SKIP: failed eligibility, OR zero required_tag matches, OR effort_hours > available_hours (see Runway rule)
FOCUS: ≥1 required_tag match AND no busy-week collision AND (reuse_count≥2 OR gap_count==0)
CONSIDER: everything else that passed eligibility+matching
```

**Time.** `weekly_capacity_hours`; `busy_weeks[]`. Collision (deadline in busy week) → drop to CONSIDER, don't exclude. Busy weeks with an empty start or end are ignored.

**Runway rule (SKIP).** `available_hours(opp)` = sum of `capacity_hours` over buckets 0..deadline bucket (see Scheduler). SKIP when `effort_hours > available_hours` (infeasible even if it were the only commitment). `effort_hours == available_hours` is not SKIP. Uses the same capacity function as the scheduler (single source of truth). FOCUS and collision rules unchanged.

**Weekly load.** If any single week's required effort from FOCUS opps exceeds `weekly_capacity_hours`, surface as a warning — do not demote tier. A week where multiple opps are due with combined effort > capacity is flagged in `plan.weekly_load_warnings`.

**Reuse.** `asset.supports[]` = opportunity IDs via tag overlap (never manual). Asset-level `reuse_count` = supports.length. Opportunity-level `reuse_count` (used in FOCUS rule) = **max asset-level reuse_count among its matching assets** (best single asset, not summed). Show as graph, never score.

**Shared gap.** gap = required_tag absent from all assets. shared_gap = gap on ≥2 CONSIDER/FOCUS opportunities.

**Next action.** Mechanical: asset/action appearing in most gap.affects[]/reuse.supports[] across FOCUS. Tie-break: earliest deadline unblocked. Never LLM-generated.

## Scheduler (pure; `src/engine/buckets.ts`, `src/engine/schedule.ts`)
- **Buckets.** Rolling 7-day buckets from today, not calendar weeks: bucket k = days [today+7k, today+7k+6]. `today` is always an argument (app passes the real date; tests pin `2026-10-03`).
- **Capacity.** `capacity_hours = weekly_capacity_hours × (1 − busy_days/7)`, where busy_days = days of the bucket inside any busy period (prorated; PROPOSED default). The deadline bucket counts fully (known optimism; state it in the UI).
- **`effort_hours`** = incremental application effort, assuming the shared project exists. Reuse never subtracts hours; a missing project shows as a gap.
- **Schedule.** Pure function of the whole committed set, recomputed on every change (order independent). Process items by deadline descending, ties by id. Each item fills its deadline bucket first, then earlier buckets, up to remaining capacity. Unplaced hours = `overflow_hours`, added to the deadline bucket's load; load > capacity → `overloaded` (shown red, with its reason). `start_by_bucket` = earliest bucket with hours placed (`null` if none). Hours round to 0.5.
- **Edge cases.** Deadline today → bucket 0 only. Deadline in the past → not committable. Deadline in a busy period → reduced capacity (tier is already CONSIDER). Capacity 0 → every commit overflows ("no hours available"). Uncommit → recompute, no leftovers. Same-deadline ties → stable by id. Item missing deadline or effort → not schedulable; card asks for the field. Timeline extends to the latest committed deadline.
- **Properties (tested with a seeded hand-rolled generator, no new dependency).** (1) placed + overflow = effort per item; (2) no bucket over capacity unless it carries overflow; (3) no hours before today or after the deadline bucket; (4) order independence; (5) commit then uncommit restores the schedule; (6) raising capacity never increases total overload; (7) start-by = earliest bucket with hours.

## Commit state (pure; `src/lib/commit-state.ts`)
- FOCUS and CONSIDER are committable; SKIP is locked (not committable) and shows its reason.
- Persisted under localStorage key `opportunity-os:commits` as `CommitState`, normalized on load (drop unknown ids, duplicates and malformed values; never blank-screen on a bad save). The profile storage shape is unchanged.
- Lowering the saved capacity auto-uncommits items that become locked, with a notice naming them.
- What-if capacity is a non-destructive preview ("dropped at this capacity"); stored commits change only when saved capacity changes (PROPOSED).

## Acceptance (DONE WHEN)
Every milestone is finished only when all items below pass. Write them into `.task/CC-HANDOFF.md` before coding, run each command, quote the output. After the milestone, rewrite `.task/CC-HANDOFF.md`: status, commit hash, raw check output, open questions.

**Standing checks (every milestone):**
1. `npx tsc --noEmit` → exit 0.
2. `npx vitest run` → exit 0, no skipped or `.only` tests.
3. Every exported type in `types.ts` is used somewhere else in `src/` (no speculative types like an unused `Evidence` mapped type), or is named in the Types list above.

**Per-milestone block (copy this shape into `.task/CC-HANDOFF.md`):**
```
MILESTONE: <name>
DONE WHEN:
- [ ] <behavior> → `npx vitest run <file>` → expected: <specific tests pass>
- [ ] Standing checks 1-3 pass
- [ ] Read the diff and raw outputs: no unresolved findings
```
Each behavior item must name the test file and the rule it covers (for example tiering order, deadline == today stays eligible, collision drops FOCUS to CONSIDER). If a behavior has no test yet, writing that test is part of the milestone.

**Self-consistency (multi-file tasks):** when a task touches two files that share a type or tag vocabulary, diff them field by field before declaring done, and list the diff result in the final report.

## Out of scope
Accounts, backend, live scraping, calendar integration, LLM in decision path, mobile responsiveness, deployment, NL calibration/asset inference, fit %, value scores.

## Working rules
One milestone per task, completed fully in one turn (implement, test, self-review, fix, then stop). Read every diff. Tests in `src/engine/*.test.ts` (vitest), green suite before moving on. Commit only on green.
