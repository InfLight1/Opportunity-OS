@AGENTS.md

## Claude Code rules
- Windows. Use the active shell's syntax (PowerShell chains with `;`). Do not upgrade npm (pinned to v10 on purpose).
- Stack: Tailwind v4 (CSS config), shadcn Nova preset on Base UI (not Radix), `@/*` alias.
- Plan: .task/PLAN.md (read only the sections the prompt names). Handoff: .task/CC-HANDOFF.md (rewrite the whole file after each milestone: status, commit hash, raw checks, open questions).
- Never edit src/data/, .research/, opencode.json, .gitignore, package.json, except: a prompt that contains my verified data table may edit src/data/ and .research/.
- No scores, percentages or match meters, even decorative. No LLM in the decision path.
- New logic = pure modules (no React imports) with vitest tests; components only map data to JSX. Engine and tests stay ASCII; UI strings may use Unicode.
- Git: stage paths by name (never `git add -A` or `.`), read `git diff --stat` first, commit only when green, message "<id>: <summary>". Never push, reset --hard or clean; I push.
- After every milestone or pass run `npx tsc -b`, `npx eslint src/`, `npx vitest run` (no skipped, no .only) and paste raw output (last 15 lines each). Your own "done" is not evidence.
- If a rule change breaks a test, change only the expectations the rule requires and list each in the handoff. Never edit data or tags to make a test pass.
- No new dependencies without asking (shadcn components are fine). No secrets in the repo.
- Do not touch loadFormData or the profile localStorage shape; commits use key opportunity-os:commits via commit-state.ts, normalized on load.
- Exception (C1b, approved): the canonical loadFormData is src/form-data.ts (tested); App.tsx imports it. C1b fixed its const reassignment; key opportunity-os:profile and the shape are unchanged.
- If a usage warning appears, finish or revert the current milestone, update the handoff, stop.
