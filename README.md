# Opportunity OS

**Too many opportunities. Too little time.**
A planner for students juggling more competitions, programs and challenges than they have hours. It narrows a curated list down to what you can actually do, shows *why* for every decision, plans your weeks backward from each deadline, and finds the work you can reuse across several applications.

![Opportunity OS: the first screen](docs/screenshots/story-hero.png)

Ten opportunities on the list add up to about **160 h of work**. A student has about **10 h a week**. Opportunity OS answers the real question: *which ones, and when?*

---

## What it does

| | |
|---|---|
| **Narrows the list, with reasons** | Every opportunity lands in **Focus**, **Consider** or **Not now**. Locked ones say exactly why: "Grade 12 only", "Closed Sep 9", "Manhattan, KS, US only", "Needs 30 h, 29 h available by Oct 26". |
| **Plans your weeks** | Commit to what fits. Hours fill each deadline's week first, then earlier weeks. Any week with more planned than it can hold turns red, with a sentence naming what lands there. Busy periods (exams, travel) reduce that week's hours. |
| **Finds reusable work** | One project can open several doors. A thread diagram links your projects to the opportunities they qualify you for, labelled with the matching skills. |
| **What if?** | Drag a slider to preview a different weekly budget. It shows what could no longer be done in time and which weeks would overflow, without changing anything until you save. |
| **Add your own** | Found something not on the list? Fill in a short form; the same rules check it and show a registration checklist (grades, location, deadline, hours, missing fields). |
| **Ask why** | A plain-language explanation for any card. The rule-based text appears instantly; an optional AI rewrite swaps in only if it passes a fact check. |

![The Story: ten opportunities narrow to five, each exit with its reason](docs/screenshots/story-funnel.png)

![The planner](docs/screenshots/planner.png)

![A week over capacity, previewed at 4 h a week](docs/screenshots/weeks-red.png)

---

## Rules decide. AI only explains.

Every tier, schedule and reason comes from deterministic, tested rules. There are no scores, percentages or "match meters" anywhere: just facts you can check.

- **Eligibility** (pass/fail): grade range, deadline not passed, location, prerequisites.
- **Evidence over claims**: a skill only counts if one of your *projects* shows it, not because you ticked a box.
- **Matching**: tag-based only (a fixed vocabulary), no fuzzy or AI matching.
- **Runway**: an opportunity is *Not now* if it needs more hours than you have before its deadline, even if it were your only commitment.
- **Focus vs Consider**: Focus needs a project match, no deadline inside a busy period, and either nothing missing or a project that also counts for other opportunities.
- **Scheduler**: a pure function of everything you've committed. It is order-independent and property-tested (hours are conserved, nothing lands before today or after a deadline, raising capacity never adds overload, and more).

The AI (Google Gemini, optional) has exactly one job here: rephrase one card's facts in plain language. It never decides anything. Before any AI sentence is shown, a pure checker rejects it if it:

- names an opportunity that isn't in the list,
- uses a number that isn't in the facts it was given (digits *or* spelled-out words),
- mentions scores, percentages or match meters, or echoes raw field names.

If the live call fails, times out (8 s) or is rejected, the app falls back to cached answers, then to the rule-based text. The demo never depends on the network.

![Ask why: a checked AI explanation over the exact rule text](docs/screenshots/ask-why.png)

---

## Run it

Requirements: Node 20.19+ or 22.12+ (what Vite 8 needs) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

- `/` opens the Story (the narrative intro) above the planner.
- `/?mode=tool` opens the planner only.
- A demo profile is preloaded. Change it with **Profile** in the header.

### Optional: live AI explanations

Create `.env.local` in the project root (it is gitignored):

```bash
GEMINI_API_KEY=your-key
GEMINI_MODEL=your-model-name
```

The Vite dev server proxies `/api/llm/generate` to Gemini and adds the key **server-side**. The key never reaches the browser or the built bundle. Without a key, Ask why uses cached answers and the rule-based text.

### Checks

```bash
npx tsc -b         # type check
npx eslint src/    # lint
npx vitest run     # 330 tests
npm run build      # production build
```

---

## How it's built

- **Vite + React 19 + TypeScript**, **Tailwind CSS v4**, shadcn/ui components on Base UI, lucide icons, Geist font.
- Browser-only, no backend, no accounts. Your profile, commitments and added opportunities live in `localStorage`.
- `src/engine/`: the rules (eligibility, matching, tiers, reuse, gaps, buckets, scheduler). Pure functions, no UI imports.
- `src/lib/`: view models and checks (cards, timeline, reuse diagram, what-if, Ask why prompt and guard, provider chain, add-your-own draft). Also pure and tested.
- `src/components/`: React components that only map those models to the page.
- `src/data/opportunities.json`: the curated list. Each entry was checked against its organiser's page. The notes and verbatim quotes are in `.research/`.

Accessibility: keyboard focus rings, real buttons with pressed states, dialogs that trap focus, a text alternative for the diagram, status announcements for overloaded weeks, high-contrast dark palette, and full support for reduced motion (all animation off, final states shown).

---

## Limits (honestly)

- **Ten curated opportunities.** It's a hand-checked dataset, not a live feed. No scraping.
- **Effort hours are estimates**, and they assume the shared project already exists. Reuse never subtracts hours.
- **Location is an exact match** against your profile region ("Dublin, CA, US"), or open if the entry is online.
- **The deadline week counts in full**, which is slightly optimistic.
- **Cached AI answers** match the demo profile on the demo day. Anything else uses the live call or the rule text.
- Desktop and laptop layouts only (designed at 1440x900, works at 1280x800).

## Built with AI assistance

This project was built during the Dublin HacX hackathon with AI coding assistants (Claude Code), working from a written plan and engine rules set by the author. The data, its sources, and every product decision were reviewed by the author. Inside the app, Google Gemini is used only for the optional "Ask why" rephrasing described above.

## License

[MIT](LICENSE) © 2026 Rudra
