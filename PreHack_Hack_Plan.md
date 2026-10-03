# Opportunity OS - Hack Plan (condensed)

**Dublin HacX 2026 | solo | Sat Oct 3 | OFFICIAL START 11:00 (before that: light battery-only prep) | ends 22:30 | HARD SUBMIT 20:00 (assumed; confirm) | Status: prep.**
Keep this file at `.task/PLAN.md` (gitignored; the repo goes public).
Owner tags: **[M]** you | **[C]** cloud chat (web search) | **[CC]** Claude Code (primary builder: UI and new logic) | **[L]** local stack (only for a specific reason: CC budget exhausted, unattended run). Items marked PROPOSED are not decided.

## 0. State at hack-day start

- **Engine (done, tested):** eligibility, matching, tiering, collision, reuse (aligned to the matching rule, M-RE6), gaps, next-action, plan, template-renderer, `runEngine`, reason strings, plan-view, reuse-view, `loadFormData`. Overnight local run accepted Oct 2; branch `whatif-slider` may exist, unreviewed. C0 re-verifies everything.
- **Data:** 10 entries, page-verified Oct 1-2 (verbatim deadline and eligibility quotes in `.research/`). Two expired entries kept as funnel examples (Australian STEM 2026-09-09, 3M 2026-04-30; guard test allowlists them). Known: IMLC 6h due 2026-12-13, CAC 6h due 2026-10-26, Global Appathon 10h (tag-only match: needs a new App Inventor app), NASA 12h, Cosmo 24h, OpenCV AI 30h, K-State.
- **Demo profile:** grade 10, Dublin CA US, 10 h/week (profile input, deliberate [M] choice), real name kept (decided). Region set to `US`; K-State page check still open (open to US/online: keep; in-person Kansas: revert and keep the SKIP as a funnel example).
- **UI:** old three tabs (Profile, Opportunities, Plan); replaced by Story + Tool (Section 8).

## 1. Product

- **Purpose line:** "Decide where your limited hours go, and build once, reuse everywhere."
- **Pitch claim:** rule-based triage + reuse graph + deadline scheduler. Do NOT say "optimization".
- **Where's the AI:** "AI proposes and explains; rules decide, so every recommendation is explainable."
- **Limits line:** rule-based, reuse is tag-based inference, curated data, estimates labeled as estimates.
- **Avoid:** percentages, match meters, "hours saved by reuse" number (needs invented splits), free chat coach, LLM in the decision path, scroll-pinned animation.
- **Why reframed:** pitch said optimization but engine did per-item tiering; shared-hours wow moment was only illustrative; SKIP compared effort to one week; app was form-in/report-out.

| Judging category | Where it comes from |
|---|---|
| Technical execution | Deterministic engine + scheduler with property tests + vitest suite |
| Creativity | Portfolio/reuse thesis; story-to-planner experience |
| Polish | Story + Tool UI built with Claude Code, glow/reveal discipline |
| Presentation | 2-minute demo flow, rehearsed answers |

## 2. Decisions

**Standing:** Vite + React + TS + Tailwind v4 + shadcn (Nova preset, Base UI, `@/*` alias), browser-only SPA, no backend, localStorage only. Engine deterministic and pure (no React imports). No scores or percentages, ever. Supabase skipped. NL profile calibration cut (tags are attached per project via checkboxes; that is how the Evidence rule is satisfied). Local models: Qwen3.6 35B (builder), Gemma 4 26B (eval); never used to find or state deadlines.

| # | Decision | Status |
|---|---|---|
| 1 | One scrolling page, two modes: Story + Planner (default), Planner only (header "Skip intro" or `?mode=tool`); same Tool component | DECIDED |
| 2 | SKIP items are locked (not committable) | DECIDED |
| 3 | Rolling 7-day buckets from today, not calendar weeks | DECIDED |
| 4 | SKIP uses the runway rule (infeasible even alone); AGENTS.md first | DECIDED |
| 5 | `effort_hours` = incremental application effort, assuming the shared project exists; reuse never subtracts hours; a missing project shows as a gap | DECIDED |
| 6 | Overflow hours go into the deadline bucket and turn it red | DECIDED |
| 7 | Lowering the saved capacity auto-uncommits items that become locked, with a notice | DECIDED |
| 8 | Add-your-own renders as a finished card with a registration checklist (eligibility, location, deadline, missing fields), no JSON on screen; manual form is the fallback | DECIDED (LLM intake PROPOSED) |
| 9 | LLM starts as "Ask why"; hero briefing postponed until the LLM is confirmed working; templates are the backup | DECIDED |
| 10 | LLM runtime: you investigate NVIDIA Build; chain live -> cached demo answers -> templates | chain PROPOSED |
| 11 | Claude Code is the primary builder; data and `.research` stay human-verified | DECIDED |
| 12 | Animation: CSS + IntersectionObserver, staggered reveal on enter, no pinning, no new animation dependency | PROPOSED |
| 13 | Story: live numbers from the engine, hand-written copy | PROPOSED |
| 14 | LLM project tagging only as an optional extension after intake, same guards | PROPOSED |
| 15 | What-if slider is a non-destructive preview; auto-uncommit (7) applies only when saved capacity changes | PROPOSED |

## 3. Engine rules (locked; changes marked)

- **Eligibility (binary).** OUT if: grade_range excludes grade; deadline < today (deadline == today stays eligible); location incompatible (remote-ok or exact region string match); any prerequisite missing from assets.
- **Matching.** Survives if >=1 required_tag match OR >=2 helpful_tag matches. **Evidence rule:** a tag counts only if it is on an Asset (project), never a bare skill checkbox.
- **Tiering (no scores).** SKIP if ineligible, zero required matches, or ~~`effort_hours > weekly_capacity_hours`~~ **-> runway rule (Section 7)**. FOCUS if >=1 required match AND no busy-week collision AND (reuse_count >= 2 OR gap_count == 0). CONSIDER otherwise.
- **Time.** `weekly_capacity_hours`, `busy_weeks[{start,end,label}]`. Deadline in a busy week -> CONSIDER, never excluded. Weekly-load warning is additive, never demotes. Incomplete busy weeks (end-only) are filtered before collision checks.
- **Reuse.** `asset.supports[]` from tag overlap under the SAME rule as matching (>=1 required OR >=2 helpful, asset tags only), computed over eligible + matching opportunities only. Opp `reuse_count` = max asset-level `supports.length` among its matching assets. Graph, never a score.
- **Gaps.** gap = required_tag absent from all assets; shared_gap = gap on >=2 CONSIDER/FOCUS opportunities.
- **Next action.** Mechanical: asset appearing in most FOCUS supports/affects; tie-break earliest deadline. Never LLM. (Known mismatch with the REUSE display: see `.task/REPORT-next-action.md`.)

**Tags (locked; add to AGENTS.md first, never ad hoc).** Skill: `python` `computer-vision` `data-analysis` `web-dev` `ai-ml` `research-writing` `public-speaking` `leadership`. Experience: `technical-project` `competition-experience` `portfolio-github` `writing-sample`. Interest (helpful only): `ai-interest` `entrepreneurship` `stem-general` `social-impact`. Structural: `team-required`/`individual`; `submission-format:demo`/`:essay`/`:pitch`. `prerequisites` is `Tag[]`; never invent prerequisite strings; model ineligibility with `grade_range` or `location`.

**Demo narrative check:** tennis asset (`technical-project`, `computer-vision`, `python`, `portfolio-github`, `data-analysis`) must support 3+ eligible entries within capacity (test pinned to 2026-10-03). Entries requiring only `research-writing` will not match it.

## 4. Dataset rules (apply to every edit of `opportunities.json`)

1. Each entry has a `.research/NN-domain.md` note: URL, verbatim deadline sentence, verbatim eligibility sentence. "Approximately/typically/last year" is not a deadline.
2. No placeholder URLs (`example.org`, `.invalid`), no duplicate programs, one note per entry.
3. Deadline >= today; `grade_range` from the page, not a guess; map age groups to grade yourself.
4. 2-3 entries are real but ineligible so the funnel shows.
5. Deadline from the organiser's own page; blogs/aggregators are leads only.
6. Retag every entry from the organiser page's stated requirements (quote per tag in the note); taxonomy tags only; do not tune tags to pass a test; report tier changes.
7. Only a human or cloud AI with web search gathers data. Local models and Claude Code encode already-verified entries only.

## 5. Scheduler and runway (working spec; PROPOSED defaults marked)

- **Buckets:** bucket k = days [today+7k, today+7k+6]; real date in the app, pinned 2026-10-03 in tests.
- **Capacity:** `weekly_capacity_hours x (1 - busy_fraction)`, busy_fraction = busy days in bucket / 7 (PROPOSED prorated). Deadline bucket counts fully (known optimism; state it).
- **Runway SKIP:** `available_hours(opp)` = sum of capacity over buckets 0..deadline bucket; SKIP when `effort_hours > available_hours`. Same capacity function as the scheduler (single source of truth). FOCUS and collision rules unchanged.
- **Schedule:** pure function of the whole committed set, recomputed on every change (order independent). Process by deadline descending, ties by id. Each item fills its deadline bucket first, then earlier buckets, up to remaining capacity. Unplaced hours = overflow in the deadline bucket (load > capacity = red). Start-by = earliest bucket with hours. FOCUS and CONSIDER committable; SKIP locked.

| Edge case | Default |
|---|---|
| Deadline today | Only bucket 0 |
| Deadline in the past | Not committable |
| Deadline in busy period | Reduced capacity; tier already CONSIDER |
| Capacity 0 | Every commit overflows; "no hours available" |
| Fractional hours | Round to 0.5h |
| Uncommit | Recompute; no leftovers |
| Saved capacity lowered | Newly locked items auto-uncommitted with notice |
| What-if slider | Preview only: "dropped at this capacity", stored commits unchanged (PROPOSED) |
| Same-deadline ties | Stable by id |
| User item missing deadline/effort | Not schedulable; card prompts for the field |
| Deadline beyond window | Timeline extends to latest committed deadline, scrolls horizontally |

**Properties to test (seeded hand-rolled generator, no new dependency):** (1) placed + overflow = effort per item; (2) no bucket over capacity unless it carries overflow; (3) no hours before today or after deadline bucket; (4) order independence; (5) commit then uncommit restores the schedule; (6) raising capacity never increases total overload; (7) start-by = earliest bucket with hours.

**Worked examples (capacity 10, today = bucket 0):** *Overload:* A 8h + B 8h due bucket 0 -> 10 placed, 6 overflow, bucket 0 shows 16/10 red. *Spill:* A 6h, B 10h, C 6h due bucket 3, order A,B,C -> A: b3 6; B: b3 4, b2 6; C: b2 4, b1 2; result 10/10, 10/10, 2/10; start-by A=3, B=2, C=1. *Busy:* F 6h due fully busy bucket 2 -> b2 0, b1 6, start-by 1.

**Open check (C4, report only):** can any committable set make a red bucket at capacity 10 on the shipped data? CAC (6h, Oct 26) and IMLC (6h, Dec 13) never share buckets. If red is unreachable, drama comes from the what-if slider and add-your-own; say so honestly, do not tune data.

## 6. App layout v2 (replaces the three tabs)

**Story beats** (reveal on enter; counts live, copy hand-written). Essential: 0, 1, 3, 4. Story is a teaser; the Tool is the full version.

| # | Beat | Copy (draft) | Visual | Data |
|---|---|---|---|---|
| 0 | First screen | "Too many opportunities. Too little time." | Drifting cards, glowing counter, "Skip to planner", scroll cue | Live count, hours/week |
| 1 | Funnel | "Most of them aren't for you." | Cards drop out with exit reasons (grade, expired, region, no matching skill); counter ticks down | Live funnel |
| 2 | Collisions | "Deadlines don't wait for each other." | Compressed deadline dots | CUT FIRST; only if data clusters |
| 3 | Reuse | "One project. Several doors." | Project node, threads to pursuable opportunities with matched tags | Live reuse |
| 4 | Handoff | "Now plan your weeks." | Static week-bar preview, "Open the planner" | Static |
| Footer | Honesty | "Rule-based. Every reason shown. AI only explains and extracts." | Small text | Static |

**Tool (top to bottom):** header (mode link, profile drawer button) | this-week strip (hours committed vs capacity, next action) | opportunity cards (tier badge, lock with reason, reasons, Commit, Ask why) | weeks timeline (backward-fill, red overload with reason, start-by, scrolls to latest committed deadline) | reuse web (project node, threads to committed opportunities with matched tags; skipped matches dimmed with reason) | what-if capacity preview | add-your-own (pasted text or manual form -> finished card with registration checklist) | profile drawer (old form, demo profile preloaded, dev-jargon labels renamed).

**Pure modules (no React, tested):** `src/engine/buckets.ts`, `src/engine/schedule.ts`, `src/lib/commit-state.ts` (toggle, lock check, auto-uncommit notices, normalized load/save under key `opportunity-os:commits`), `src/lib/story-data.ts` (counts, exits with reasons, reuse fan). Existing: `run-engine.ts`, `plan-view.ts`, `reuse-view.ts`, `form-data.ts`. Behind the LLM gate: `intake-validate.ts` (schema, taxonomy, verbatim-quote check), `ask-why-check.ts` (titles must exist in the dataset, numbers must come from the input, banned words score/percent), `llm-provider.ts` (chain).

**LLM layer.** Ask why first, intake second. Prompt gets only structured engine facts; template text shows instantly, LLM text swaps in. Key in `.env.local` without a `VITE_` prefix; Vite dev proxy adds it server-side. Verify before relying on it: NVIDIA Build free-tier limits and expiry, models, browser access (CORS), latency, hackathon rule on hosted AI. **Gate:** 30 minutes; if one real call is not working end to end, ship templates + manual form and call the LLM layer a planned extension.

| Fallback | Then |
|---|---|
| Claude Code limit hits early | Tool only (default mode = tool), Story becomes a static hero |
| LLM fails at the gate | Ask why = template reason strings; add-your-own = manual form |
| Red week unreachable | Drama from what-if slider + add-your-own; say so |
| No deadline clustering | Cut Story beat 2 |

## 7. Features and out of scope

**In:** Story + Tool on one page (two modes); opportunity cards; weeks timeline; reuse web; this-week strip; profile drawer; add-your-own card; Ask why; what-if preview.
**Out:** accounts, backend, scraping, calendar integration, LLM in the decision path, mobile responsiveness, deployment, NL profile calibration, free chat coach, hours-saved number, scroll-pinned animation, hero LLM briefing (until confirmed).

## 8. History and lessons

| Day | Outcome |
|---|---|
| 1 (Sep 23) | Vite/React/TS, Tailwind v4, shadcn (Nova, Base UI), git, OpenCode smoke test; `@/*` alias fix; npm downgraded to v10 (npm/cli#9968) |
| 2 | Types, fixtures, vitest, AGENTS.md; Evidence rule; local 35B misreported clean tsc/tests |
| 3 | `eligibility.ts` (isEligible, filterEligibility, matchTags, passesMatching), 25 tests; eval output is unverified too |
| 4 | tier, collision, reuse, gaps, next-action, plan, template-renderer; 149 tests; runway bug fixed (`computeRunwayHours`); weekly-load warning; local model corrupted em dashes (ASCII in engine) |
| 5 | Three tabs, profile form + localStorage, demo profile, dark theme + glow; Playwright pass caught an `import type` runtime bug in `fixtures.ts` |
| 6 | Engine wired into `App.tsx` (B1 `7b3ed58`); first dataset (`996d0e3`) discarded: fabricated/duplicate/expired entries, invented prerequisites, unverified deadlines; 154/154 tests |
| 7 | M-RE1 `f3a5893` (`runEngine` extracted: supports over eligible+matching only, end-only busy weeks ignored); M-RE2 `8650f6f` (PlanTab + REUSE); M-RE3 `34506a0` (persistence, titles, `.task/` ignored); M-RE4 `db725c4` (validate loaded data); M-RE5 (normalize loaded data; fixed blank screen from stale save); M-RE6 (reuse rule tightened) |
| 8 | 10 verified entries incl. Appathon; capacity 8 -> 10; narrative test pinned 2026-10-03, green |
| Overnight | Local run: reason strings, next-action investigation, plan-view, reuse-view, guard tests, `loadFormData`, optional `whatif-slider` branch |
| 9 | Run accepted, click-through, deadline pass #2, real-name profile decision; rest moved to hack day |

**Lessons:** local models fabricate facts and misreport results, so require raw `tsc`/`eslint`/`vitest` output and read diffs; truncated output is not evidence; stage only a milestone's own paths; do not tune data, tags or engine to pass a test; stale localStorage once caused a blank screen (normalize on load); run a browser load-check after changing engine-type imports.

**Known issues -> handled by**

| Issue | Handled by |
|---|---|
| First Step supports line contradicts REUSE | This-week strip + reuse-view; read `.task/REPORT-next-action.md` |
| FOCUS "reuse count" includes skipped entries | Pursuable-only count (reuse-view) |
| Sparse tags (1-2 per competition) | Retag (dataset rule 6) |
| Region `US` vs `Dublin, CA, US` flips K-State | Page check (exact-string matching; region dropdown PROPOSED) |
| Expired entries visible; all type `competition` | Expired badge; 1-2 non-competition entries (cut first) |
| Dev jargon labels ("Evidence rule", "helpful_tags only") | Rename in profile drawer |
| SKIP compares to one week | Runway rule |

## 9. Working practices

- Commit after every green milestone; stage only that milestone's paths by name; read `git diff --stat` first.
- Read every diff. Nothing self-reported counts without raw `tsc`, `eslint`, `vitest` output. Check the browser yourself.
- One large, fully specified pass at a time; specs live in files (AGENTS.md, CLAUDE.md, DESIGN-BRIEF.md, `.task/CC-HANDOFF.md`), not chat history; no screenshot ping-pong; give feedback in one batch per pass.
- Claude Code budget: set a stop line on the usage meter; if it runs high, move pure-logic tasks to [L] (sequential, not parallel, to save RAM).
- Data and `.research` stay human-verified regardless of builder.
- Starting Claude Code before 11:00 may open the 5-hour usage window early (unverified how your plan counts); keep the prep docs work short and check the meter.
- Keep this plan out of the public repo. Hard hours: eat, take the real break.

## 10. Hack day schedule (time blocks)

Official start 11:00. Before then: battery only, light tasks (docs, verification, setup); no product code, no Ollama, Docker or Playwright, no long dev-server runs (a short `tsc`/`eslint`/`vitest` run is fine). Target submit 19:00; 20:00 is a wall (assumed, confirm). Data and logic before UI (freeze 12:30). Tool before Story (Tool is the proof and the fallback). If behind, slide the blocks and apply the cut order; never move 20:00.

**Claude Code milestones (own-path commits, raw checks quoted):**
C0 orientation, read-only -> `.task/CC-ORIENTATION.md` (architecture map, rule status vs AGENTS.md with quoted lines, every use of the SKIP rule and capacity, UI pieces to be replaced, raw baseline checks) | C1 AGENTS.md update (new types, runway SKIP, scheduler, commit state, LLM line) | C2 `buckets.ts` + runway SKIP + tests; list every changed expectation; rerun narrative test and report actual lists | C3 `schedule.ts` + tests (7 properties, 3 examples, edge table) | C4 fit report -> `.task/REPORT-schedule-fit.md` (tiers, available hours, start-by per entry at capacity 4, 8, 10, 12, 20; search for a red-bucket set) | C5 `commit-state.ts` + `story-data.ts` + tests | C6 `.task/DESIGN-BRIEF.md` (palette tokens: one accent, dark base, glow rules; type; spacing; Story and Tool layouts; per-component prop types; motion; reduced-motion fallback).

### Before 11:00 - Prep (battery, light)
- **AI:** [CC] C0 (read-only), then C1 and C6 (docs only; compute is in the cloud). [C] drafts retag proposals (taxonomy tags, each with a verbatim organiser-page quote + URL), final Story copy, demo script skeleton, Q&A list. (Optional, CUT FIRST) [C] researches replacements for the 2 expired entries + 1-2 non-competition entries with verbatim quotes.
- **You:** Claude Code setup (Section 11); save plan as `.task/PLAN.md`; `git tag pre-cc`; quit Ollama/Docker. K-State page check. Verify each retag quote on its organiser page. Read the AGENTS.md diff; approve the design brief and Story copy. NVIDIA Build: key into `.env.local`, note free-tier limits, browser access (CORS), hosted-AI rule. Check the AI-disclosure rule; confirm the hard-submit time. Plug in by 10:50.

### 11:00-11:20 Start and data
- **AI:** [CC] encodes only your verified retags (prompt contains your table), reruns narrative and guard tests, reports tier changes.
- **You:** plugged in; raw `tsc`/`eslint`/`vitest` baseline; confirm the K-State/region fix is applied; check the retag diff against your table.

### 11:20-12:20 Logic
- **AI:** [CC] C2, C3, C4, then C5 (own commits). If the usage meter is high, C5 -> [L].
- **You:** read each commit's raw checks; read the C4 report and decide where the red-week drama comes from.

### 12:20-12:30 DATA FREEZE
- **You:** raw checks, `git diff --stat`, commit, push. No data edits after this except bugfixes.

### 12:30-13:30 Pass 1 - Tool core
- **AI:** [CC] app shell, tokens, mode switch, header, this-week strip, opportunity cards (tier badge, lock with reason, Commit), weeks timeline from `schedule.ts`, persisted commits, profile drawer (labels renamed).
- **You:** browser check (commit, uncommit, refresh, locked card); one batch of feedback; read diff and raw checks; commit.

### 13:30-14:00 Lunch
- **AI:** [C] optional: README skeleton.
- **You:** real break.

### 14:00-15:00 Pass 2 - Web and states
- **AI:** [CC] reuse web (SVG, matched-tag labels, skipped matches dimmed), start-by, what-if preview, auto-uncommit notice, timeline horizon.
- **You:** browser check; overcommit to see a red week; read diff and checks; commit.

### 15:00-15:50 Pass 3 - Story
- **AI:** [CC] beats 0, 1, 3, 4 (beat 2 only if data clusters), reveal on enter, "Skip intro" link, honesty footer.
- **You:** scroll it on the demo machine; read diff and checks; commit.

### 15:50-16:40 Pass 4 - Add-your-own and Ask why (LLM gate)
- **AI:** [CC] manual add-your-own form -> finished card with registration checklist; Ask why with template text; then the 30-minute LLM gate (proxy, one real call, guards, provider chain; key already tested in prep).
- **You:** test with a real pasted blurb; decide at the gate (ship LLM or templates); read diff and checks; commit.

### 16:40-17:30 Polish
- **AI:** [CC] one bugfix/polish pass from your single batch of notes.
- **You:** README screenshots; `git status` clean; check no `.env*` or key is tracked.

### 17:30 CODE FREEZE (bugfixes only)

### 17:30-18:15 Rehearsal
- **AI:** [C] plays a skeptical judge, edits the script.
- **You:** three timed runs. Answers ready: tag-only matching; why deterministic; why capacity is 10; runway rule; "Appathon is a tag-only match"; K-State region; "where's the AI"; "who maintains the data". Map points to the four judging categories.

### 18:15-19:00 Publish
- **AI:** [C] drafts README (problem, screenshot, engine, why deterministic, limits, future expansion, AI-tool disclosure).
- **You:** final push; verify the repo is public, correct branch, `.task/` ignored, no `example.org`, no key.

### 19:00 SUBMIT (target) | 19:00-20:00 buffer (touch nothing) | **20:00 HARD SUBMIT** | 20:00-22:30 unknown: confirm with organisers (judging/demos/expo); be rested, not coding.

**Demo flow (2 min):** 0:00-0:30 scroll the Story (pile, funnel, reuse fan-out). 0:30-1:30 open the Tool: commit IMLC then CAC and watch weeks and web react; commit a third item and show the red week with its stated reason. 1:30-2:00 drag the what-if capacity or add an opportunity; limits line. Reuse claim stays on pursuable entries (IMLC, CAC).

**Cut order:** LLM live calls -> Story beat 2 -> add-your-own LLM intake (manual form stays) -> Pass 4 reduced to manual form only -> Story reduced to a static hero. If a pass overruns its slot, stop it at the slot end and carry the rest to polish. **Never cut:** data freeze, Pass 1, rehearsal, publish.

## 11. Claude Code setup (moving from OpenCode)

**Facts (Claude Code docs):** Claude Code reads `CLAUDE.md`, not `AGENTS.md`; the fix is a `CLAUDE.md` starting with the line `@AGENTS.md` (Windows symlinks need admin/Developer Mode, so use the import). First import shows an approval dialog; run `/context` to confirm CLAUDE.md is loaded. On native Windows it uses Git Bash if Git for Windows is installed, else PowerShell. OpenCode's global `AGENTS.md`, skills and MCPs are not read.

**Checklist**
1. **Create `CLAUDE.md`** in the repo root (draft below).
2. **Edit `AGENTS.md`** (C1 does it; shared with OpenCode, keep tool-neutral): remove "Never load Master Context", the `eval` skill lines (no such skill in Claude Code; replace with "read the diff and raw outputs"), the `.task/STATE.md` workflow (use `.task/CC-HANDOFF.md`), "Edit/write tool only", and "per the global Git checkpoints rule" (global file is not visible; git rules go in CLAUDE.md); replace "LLM (local 35B)" with the new LLM role; add new types and rules (Sections 3, 5).
3. **Permissions:** add `.claude/settings.json` (snippet below). Deny beats allow. Check with `/permissions`; if Claude Code uses PowerShell instead of Git Bash, confirm the rules apply by testing one denied command.
4. **Secrets:** put the NVIDIA key in `.env.local` (no `VITE_` prefix: Vite bundles only `VITE_` variables); confirm `.env.local` is gitignored (Vite's default template ignores `*.local`; verify). Also ignore `.claude/settings.local.json`.
5. **Skills and MCPs do not carry over** (`design-taste-frontend`, `extract-design-system`, `eval`, `grilling`, Playwright, SearXNG, shadcn MCP): design rules live in `DESIGN-BRIEF.md`; you check visuals in the browser.
6. **Leave OpenCode files alone** (`opencode.json`, global AGENTS.md); both tools can coexist.
7. **Free RAM:** `ollama stop <model>`, quit Docker; keep the local stack as fallback.
8. **Keep CLAUDE.md short** (loaded every session); pass the plan via "read only sections X" in each prompt, not an import.

**`CLAUDE.md` draft**
```text
@AGENTS.md

## Claude Code rules
- Windows. Use the active shell's syntax (PowerShell chains with `;`). Do not upgrade npm (pinned to v10 on purpose).
- Stack: Tailwind v4 (CSS config), shadcn Nova preset on Base UI (not Radix), `@/*` alias.
- Plan: .task/PLAN.md (read only the sections the prompt names). Handoff: .task/CC-HANDOFF.md (rewrite the whole file after each milestone: status, commit hash, raw checks, open questions).
- Never edit src/data/, .research/, opencode.json, .gitignore, package.json, except: a prompt that contains my verified data table may edit src/data/ and .research/.
- No scores, percentages or match meters, even decorative. No LLM in the decision path.
- New logic = pure modules (no React imports) with vitest tests; components only map data to JSX. Engine and tests stay ASCII; UI strings may use Unicode.
- Git: stage paths by name (never `git add -A` or `.`), read `git diff --stat` first, commit only when green, message "<id>: <summary>". Never push, reset --hard or clean; I push.
- After every milestone or pass run `npx tsc --noEmit`, `npx eslint src/`, `npx vitest run` (no skipped, no .only) and paste raw output (last 15 lines each). Your own "done" is not evidence.
- If a rule change breaks a test, change only the expectations the rule requires and list each in the handoff. Never edit data or tags to make a test pass.
- No new dependencies without asking (shadcn components are fine). No secrets in the repo.
- Do not touch loadFormData or the profile localStorage shape; commits use key opportunity-os:commits via commit-state.ts, normalized on load.
- If a usage warning appears, finish or revert the current milestone, update the handoff, stop.
```

**`.claude/settings.json` draft**
```json
{
  "permissions": {
    "allow": [
      "Bash(npx tsc *)", "Bash(npx eslint *)", "Bash(npx vitest *)",
      "Bash(git status*)", "Bash(git diff*)", "Bash(git log*)",
      "Bash(git add *)", "Bash(git commit *)"
    ],
    "deny": [
      "Bash(git push*)", "Bash(git reset --hard*)", "Bash(git clean*)",
      "Bash(git add -A*)", "Bash(git add .*)", "Bash(rm *)", "Read(.env*)"
    ]
  }
}
```

**Kickoff prompts (paste into Claude Code after CLAUDE.md exists)**

Prep, before 11:00 (docs only):
```text
You are joining Opportunity OS (Dublin HacX 2026, solo, hard submit 20:00). Read AGENTS.md, then .task/PLAN.md sections 3, 5, 6 and 10. Run C0 (read-only), then C1 (AGENTS.md update only), then C6 (design brief, docs only). Do not edit source code, data or tests yet. Follow CLAUDE.md. Stop after C6 and report. If blocked, write the question in .task/CC-HANDOFF.md.
```

At 11:00 (plugged in):
```text
Continue Opportunity OS. Read .task/CC-HANDOFF.md and AGENTS.md. Execute C2, C3, C4, C5 from .task/PLAN.md section 10 in order, one at a time, following CLAUDE.md. Own-path commits, raw checks quoted. Stop after C5 and report.
```

## 12. Risk ledger

| Risk | Mitigation |
|---|---|
| Hard submit 20:00 | Target 19:00; buffer 19:00-20:00; code freeze 17:30; push after each block |
| Claude Code usage limits (weekly ~80% left + 5-hour windows) | Few large passes; specs in files; stop line; Tool-only fallback with static hero |
| Reframe scope creep in 12 h | Logic first (C0-C5); Tool before Story; cut order |
| Red week unreachable on shipped data | C4 report; drama from slider and add-your-own; do not tune data |
| Runway rule breaks existing tests | AGENTS.md first; only required expectations change, each listed; report actual lists |
| Backward-fill pessimistic; deadline bucket counts fully | State both; show "start by", not a prediction |
| Timeline hides far deadlines | Horizon extends to latest committed deadline |
| Reuse looks like it should save hours | `effort_hours` is incremental; no savings number; missing project = gap |
| Story and Tool duplicate each other | Story is a teaser; Tool is the full version |
| Scripted Story copy overstates data | Live numbers; cut beat 2 if no clustering |
| LLM fails, slow or hallucinates | Optional by design; post-checks and quote check; templates/manual form; 30-min gate; template first, swap after |
| NVIDIA key leaks / limits / CORS / hackathon AI rule unknown | `.env.local` + proxy; check `git status` and bundle before push; cached demo answers; verify limits early |
| Claude Code edits outside scope or fabricates data | CLAUDE.md scope rules; deny rules; data only from your verified table; diff read per pass |
| Fabricated or stale dataset | Human-verified quotes; guard test (https, no placeholders, deadline >= today except allowlist, tags in taxonomy, note per URL) |
| Deadlines expire during the event | Prefer entries due after Oct 10; final check before freeze |
| Self-reported "done" wrong | Raw output always; read diffs; browser check |
| Stale/malformed localStorage blank screen | Normalize on load (`form-data.ts`, `commit-state.ts`); test with a seeded bad save |
| Region matching is exact string | Page check; data-only fix; region dropdown PROPOSED |
| Capacity tuned to data | 10 h is a stated profile input, not an engine rule |
| Appathon reuse is tag-only | Keep reuse claim on IMLC and CAC; say so if asked |
| Real name in public repo | Decided to keep; plan file stays out of the repo |
| Browser-only runtime failures missed by tsc/lint/vitest | Open the app after any engine-type import change |
| RAM pressure | Quit Ollama/Docker; one dev server; close extra Chrome tabs |
| Official start 11:00; battery-only before | Prep limited to docs, verification, setup; no product code or heavy local tools until plugged in |
| Hard-submit time unconfirmed (20:00 assumed) | Confirm in prep; plan keeps 19:00 target and 1 h buffer |
