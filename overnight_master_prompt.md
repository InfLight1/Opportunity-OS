# OVERNIGHT RUN - Opportunity OS (Thu Oct 1 night -> Fri Oct 2 morning)

Save as `.task/OVERNIGHT.md` (gitignored). Start with: `Read .task/OVERNIGHT.md completely, then execute it end to end without stopping.`
Builder model: `qwen3.6-35b-120k`. Project AGENTS.md and global AGENTS.md still apply. If this file conflicts with an AGENTS.md ENGINE rule, AGENTS.md wins.

## MODE
I am asleep. Do not ask me anything. Do not wait for "continue". Do not write plans without tool calls. Run milestones M0..M7 in order in ONE continuous run. After each milestone (PASS or BLOCKED) rewrite `.task/QUEUE.md` (whole file, write tool) and start the next milestone immediately. Stop only after the final report.
First action: write `.task/QUEUE.md` listing M0..M7 as TODO.
At the start of every round and after any compaction: re-read `.task/QUEUE.md` and this file.

## HARD RULES
1. Engine rules are locked (AGENTS.md). Do not change eligibility, matching, tiering, reuse, gap or next-action rules. No scores, no percentages, no LLM in the decision path.
2. NO research and NO data edits. Never add, change or invent opportunities, deadlines, URLs, eligibility text or `.research` notes. Do not edit `src/data/opportunities.json` or anything in `.research/`. If a test fails because of data, report it; do not fix the data.
3. Tags come only from the AGENTS.md taxonomy. No invented tags, no invented prerequisites.
4. Staging: stage only the paths of the current milestone, by name. NEVER `git add -A` or `git add .`. Run `git diff --stat` and read it before every commit. PowerShell: chain with `;`, not `&&`.
5. Commit only when every DONE WHEN item has been run and passes, with raw output quoted. Never commit on red. Commit message: `<milestone id>: <summary>`. Never push, never `reset --hard`, never `clean`.
6. Standing checks for EVERY milestone: `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0), `npx vitest run` (exit 0, no skipped, no `.only`), and every exported type in `types.ts` is used elsewhere in `src/`.
7. New logic goes in pure modules (no React imports) with vitest tests. React components only map data to JSX.
8. Edit/write tools only. Never build files with shell appends. Read a whole file before patching it. Copy `oldString` verbatim. ASCII only in source and comments (no em dashes, no smart quotes).
9. No new npm packages. Do not run Playwright. Do not toggle MCPs. Do not touch `opencode.json`, `AGENTS.md` (except rule 10 below) or `.gitignore`.
10. Locked shapes in `types.ts`: if a milestone truly needs a new field, first add one line naming it to the Types section of the project AGENTS.md, then add it, and list it in the report. Prefer the existing field (for example `MatchResult.reason`).
11. When a milestone touches two files that share a type or tag vocabulary, diff them field by field before declaring done and put the diff result in the report.
12. The `eval` skill may be run once per milestone, but its verdict is NOT evidence. Evidence is raw command output and the real diff.

## STUCK RULE
Same failure twice: change approach. Three rounds with no new passing item: mark the milestone BLOCKED, write the exact failing output into `.task/OVERNIGHT-REPORT.md`, restore only that milestone's own tracked files with `git restore -- <paths>`, delete only new files that milestone created (list them), and go to the next milestone that does not depend on it. Environment failures (Ollama or port down, missing tool): write them in the report and STOP the run. Do not work around them in code.

## MILESTONES

### M0 - Baseline
- Record in the report: `git branch --show-current` (call it START_BRANCH), `git status --short`, `git log --oneline -15`.
- Run `npx tsc --noEmit`, `npx eslint src/`, `npx vitest run`; paste the last 15 lines of each.
- Find the commit for the reuse-rule tightening (`git log --oneline -- src/engine/reuse.ts`) and record the hash.
- If Day 8 paths are uncommitted (`src/engine/fixtures.ts`, `src/data/opportunities.json`, the Appathon note in `.research/`, `src/engine/demo-narrative.test.ts`) AND the suite is green, commit ONLY those paths as `day8: capacity 10, Appathon entry, narrative test`. Do not stage `run-engine.ts` or any `.tsx` file.
- If the baseline is red only because of uncommitted `run-engine.ts` work, continue to M1. If red anywhere else, write the output and STOP the run.
DONE WHEN: baseline recorded in `.task/OVERNIGHT-REPORT.md`.

### M1 - Reason strings in `run-engine.ts`
`src/engine/run-engine.ts` has uncommitted reason-string work with a duplicate `./eligibility` import. Read `git diff src/engine/run-engine.ts` first and finish it; do not rewrite from scratch.
- Merge the duplicate import.
- Each opportunity gets its own fresh `match` object (no shared reference between opportunities; inputs and fixtures are not mutated).
- Reasons are built mechanically from existing engine outputs with fixed templates, never from an LLM, never changing a tier:
  - Eligibility failures name the failed check: grade (state the range and the grade), expired (state the deadline), location (state both regions), missing prerequisite (state the tag).
  - SKIP: zero required-tag matches, or effort over capacity (state both numbers).
  - CONSIDER: busy-week collision (state the busy-week label), or an open gap (state the tag).
  - FOCUS: matched tags and the reuse count.
- Tests in `src/engine/run-engine.test.ts`: one test per reason kind above, plus "two opportunities do not share a `match` object" (`not.toBe`).
DONE WHEN:
- [ ] `npx vitest run src/engine/run-engine.test.ts` passes all new reason tests.
- [ ] Standing checks pass.
Commit only `run-engine.ts`, `run-engine.test.ts` (and `types.ts` / AGENTS.md line only if rule 10 applied).

### M2 - Next action vs reuse mismatch (investigate)
Observed in the app: "Recommended First Step" says Tennis Analytics App supports only the International Machine Learning Competition, yet Global Appathon is also FOCUS and also appears in the tennis REUSE list.
- Write a throwaway vitest or node script outside `src/` that runs `runEngine` on the demo profile and shipped dataset and prints: the FOCUS list, the tennis asset `supports`, and the `nextAction` output. Paste the raw output into `.task/REPORT-next-action.md`.
- Find the code that renders the "Supports:" line (in the Plan tab or a helper) and the code that computes next action.
- State the cause with evidence (quoted lines).
- If the engine output is correct and only the display prints too little (for example first element only, or filters wrongly): fix it in a pure view function with a test. If the cause is the next-action RULE itself: do NOT change it; report only.
DONE WHEN:
- [ ] `.task/REPORT-next-action.md` exists with raw output, quoted code lines and a stated cause.
- [ ] If a display fix was made: its test passes and standing checks pass; commit only its paths.
- [ ] If report only: no source change, nothing to commit.

### M3 - Plan tab detail
- New pure module `src/lib/plan-view.ts` (no React). Given the `runEngine` output it returns rows: `{ id, title, tier, deadline, effort_hours, reasons: string[], busy_week_note?: string }`, ordered as the Plan tab shows them.
- Tests in `src/lib/plan-view.test.ts`: FOCUS rows carry matched-tag reasons; a collision row carries the busy-week label; every SKIP row has at least one reason; row order is stable.
- Plan tab (React): under each FOCUS and CONSIDER row show deadline, `~Nh`, and the reasons in small text; the busy-week note on collision rows; each SKIP row shows title plus its first reason. Keep existing sections and styling. No new components library, no new dependency. If M2 found a display bug, keep that fix.
DONE WHEN:
- [ ] `npx vitest run src/lib/plan-view.test.ts` passes.
- [ ] Standing checks pass.
- [ ] Field-by-field diff of the row type against what `PlanTab` reads is listed in the report.
Commit only the milestone paths.

### M4 - REUSE: pursuable vs skipped
- New pure module `src/lib/reuse-view.ts`. For each asset: `pursuable` = supports whose tier is not SKIP; `skipped` = supports whose tier is SKIP, each with its first skip reason.
- Tests in `src/lib/reuse-view.test.ts` on the shipped dataset and demo profile: `pursuable` and `skipped` partition `asset.supports`; every `skipped` entry has tier SKIP; no SKIP entry appears in `pursuable`; each `skipped` entry has a reason.
- REUSE section (React): header count = `pursuable.length`; list pursuable titles; below it a muted line `Also matches, but skipped:` listing skipped titles with their reason. Hide the line when empty.
DONE WHEN:
- [ ] `npx vitest run src/lib/reuse-view.test.ts` passes.
- [ ] Standing checks pass.
Commit only the milestone paths.

### M5 - Guard test hardening (data is read-only)
Find the existing JSON guard test (`git ls-files | Select-String guard`) and extend it; do not delete existing assertions.
Assertions, over every entry in `src/data/opportunities.json`:
- URL starts with `https://`; no `example.org`, `.invalid`, `localhost`, `example.com`.
- ids unique; URLs unique.
- deadline matches `YYYY-MM-DD`.
- deadline >= `2026-10-03`, EXCEPT ids in a constant `KNOWN_EXPIRED` holding exactly: the Australian STEM Video Game Challenge entry and the 3M Young Scientist Challenge entry (read their ids from the JSON). Comment: `remove after the Friday replacement`. Also assert every id in `KNOWN_EXPIRED` really is expired at 2026-10-03, so the allowlist cannot go stale silently.
- every tag in `required_tags`, `helpful_tags` and `prerequisites` is in the AGENTS.md taxonomy (copy the list into the test; no invented tags).
- at least one file in `.research/` contains the entry's URL as text (note exists for each entry).
If any assertion fails because of DATA (for example a missing note): do NOT edit data, do NOT commit this test. Write the exact failing output to `.task/REPORT-guard.md` and mark M5 BLOCKED-BY-DATA.
DONE WHEN:
- [ ] The guard test file passes with `npx vitest run <that file>`, or M5 is BLOCKED-BY-DATA with the report written.
- [ ] Standing checks pass if committed.

### M6 - `loadFormData` normalizer under test
- Find where saved form data is loaded and normalized (`opportunity-os:profile`). If it is not already a pure module, extract it unchanged in behavior to `src/lib/form-data.ts` (no React imports); `App.tsx` imports it.
- Tests in `src/lib/form-data.test.ts`: valid round trip; `null`; non-object; project missing `tags`; `tags` not an array; busy week with only `end`; wrong types for grade and capacity; unknown tag strings. Expected values must match the current behavior; if a test shows the current behavior is wrong, report it and do not change behavior without a failing test first.
DONE WHEN:
- [ ] `npx vitest run src/lib/form-data.test.ts` passes.
- [ ] Standing checks pass.
Commit only the milestone paths.

### M7 - OPTIONAL (Proposed): what-if capacity slider prototype
Run only if M0..M6 are each PASS or BLOCKED and the run is still healthy.
- `git switch -c whatif-slider` from START_BRANCH.
- Pure function `src/lib/what-if.ts`: run the existing engine with an overridden `weekly_capacity_hours`; no engine rule changes.
- Test `src/lib/what-if.test.ts`: at capacities 4, 8, 10, 12, 20 the SKIP set at the higher capacity is a subset of the SKIP set at the lower capacity. If this property is false on the shipped data, report the counterexample and do not force it.
- Plan tab: a slider 4..20 that re-renders the plan. It must NOT overwrite the saved profile.
- Commit on the branch only. Do NOT merge. Final step: `git switch <START_BRANCH>` and confirm `git branch --show-current` equals START_BRANCH.
DONE WHEN:
- [ ] `npx vitest run src/lib/what-if.test.ts` passes (or the counterexample is reported).
- [ ] Standing checks pass on the branch.
- [ ] Working tree is on START_BRANCH.

## FINAL REPORT
Write `.task/OVERNIGHT-REPORT.md` (write tool) and print the same in chat, then STOP. Format:
- Goal
- Table: milestone | PASS / BLOCKED / BLOCKED-BY-DATA / SKIPPED | commit hash or "none" | tests added
- Per milestone: the DONE WHEN items with command, exit code, and the last 15 lines of raw `tsc` / `eslint` / `vitest` output
- Changed files (from `git diff --stat` per commit)
- Self-consistency diffs
- Assumptions and gaps (anything you chose without being sure)
- `git status --short` and `git branch --show-current` at the end

REMINDER (most important rule): a milestone is not done until every DONE WHEN command has been run and passed with its raw output quoted. Never commit on red. Never edit data or engine rules. Do not stop between milestones.
