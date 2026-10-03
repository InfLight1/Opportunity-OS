# Opportunity OS

### Too many opportunities. Too little time.

**A planner that tells students which opportunities are worth their limited hours, and exactly why.**

![Opportunity OS: ten opportunities, 160 hours of work, 10 hours a week](docs/screenshots/story-hero.png)

> **10** opportunities on the list · **160 h** of estimated work · **10 h** a week to spend.
> That's about 16 weeks of work for one week's worth of time. Opportunity OS answers the question every ambitious student faces: **which ones, and when?**

---

## The problem

High-school students are flooded with competitions, hackathons, science fairs and programs. Every one looks like a door worth opening. But:

- **Most aren't actually open to you.** Wrong grade, wrong region, deadline already passed, or a requirement you can't show yet. You find out after hours of reading.
- **Deadlines collide with real life.** Midterms don't move for the App Challenge.
- **Nobody tells you why.** Recommendation tools hand you a match score and no reasoning, so you can't trust them or argue with them.
- **The same work could count twice.** One good project can qualify you for several opportunities, but nothing shows you that.

The result: students either over-commit and burn out, or freeze and apply to nothing.

## Our solution

Opportunity OS turns a pile of opportunities into a plan you can trust:

1. **It cuts the list, with a reason for every cut.** Each opportunity lands in **Focus**, **Consider** or **Not now**. Locked ones say exactly why: *"Grade 12 only"*, *"Closed Sep 9"*, *"Manhattan, KS, US only"*, *"Needs 30 h, 29 h available by Oct 26"*.
2. **It plans your weeks backward from each deadline.** Commit to what fits and see when to start. Exam weeks get fewer hours. A week with more planned than it can hold turns red, with a sentence naming what lands there.
3. **It finds work you can reuse.** One project, several doors: a thread diagram shows which of your projects qualifies you for which opportunities.
4. **It explains itself in plain language.** *Ask why* on any card gives the reasoning. Rules decide; AI only rephrases, under a strict fact check.

![The Story: ten opportunities narrow to five, each exit with its reason](docs/screenshots/story-funnel.png)

---

## Try it in 2 minutes (judge's path)

```bash
npm install
npm run dev     # open http://localhost:5173
```

1. **Watch the first screen.** The pile of 10 opportunities, the 160 h vs 10 h problem. Scroll: half of them drop out, each with its reason.
2. **Open the planner.** A demo student profile is preloaded (grade 10, one computer-vision project, Midterms Oct 20-27, 10 h a week).
3. **Commit** to *International Machine Learning Competition* and *Congressional App Challenge*. See the weeks fill in and "start by" dates appear.
4. **Ask why** on the App Challenge. It's *Consider*, not *Focus*, because it's due during Midterms.
5. **Drag "What if" to 4 h a week.** A week turns red and the app names exactly what overflows. Nothing is saved until you press Save.
6. **Add your own** opportunity in the form at the bottom. The same rules check it and show a registration checklist.

`/?mode=tool` skips the intro and opens the planner directly.

![The planner](docs/screenshots/planner.png)

---

## Why it stands out

| Criterion | What we built |
|---|---|
| **Technical execution** | A deterministic rules engine and a backward-filling scheduler as pure TypeScript functions. **330 automated tests**, including property tests: hours are always conserved, nothing is scheduled before today or after a deadline, order never matters, and more capacity never creates more overload. |
| **Innovation** | **Rules decide, AI only explains.** No black-box matching. The AI rephrases one card's facts, and a checker rejects any sentence that invents a title, a number, or a "score". |
| **Impact** | Built for the real student problem of too many options and not enough hours. It answers *which* and *when*, not just *what*. Every decision comes with a reason a student, parent or counsellor can check. |
| **Completeness** | Works end to end, offline, with no account and no backend. If the AI is down or slow, it falls back to saved answers, then to the rule text. The demo never depends on Wi-Fi. |
| **Design & UX** | Calm dark interface; one accent colour; red reserved for overloaded weeks. Keyboard accessible, screen-reader text for the diagram, and full reduced-motion support. |

![A week over capacity, previewed at 4 h a week](docs/screenshots/weeks-red.png)

---

## How it works

**Rules, not scores.** There are no percentages or match meters anywhere, just facts you can check.

- **Eligibility** (pass/fail): grade range, deadline not passed, location, prerequisites.
- **Evidence over claims:** a skill only counts if one of your *projects* shows it, not because you ticked a box.
- **Matching:** a fixed vocabulary of tags (python, data analysis, technical project, ...). No fuzzy or AI matching.
- **Runway:** if an opportunity needs more hours than you have before its deadline, even as your only commitment, it's *Not now*.
- **Focus vs Consider:** Focus means your project matches, the deadline isn't in a busy week, and either nothing is missing or the same project also counts elsewhere.
- **Scheduler:** fills each deadline's week first, then earlier weeks, and flags any week over capacity, naming the cause.

**AI with guardrails (optional).** *Ask why* sends Google Gemini only the structured facts for one card. Before any sentence is shown, a pure checker rejects it if it:

- names an opportunity that isn't in the list,
- uses a number that isn't in the facts it was given (written as digits *or* words),
- mentions scores, percentages or match meters, or leaks raw field names.

The chain is: live answer (8 s limit) → saved answer → rule text. The rule text is always one click away under *Exact rule details*.

![Ask why: a checked AI explanation over the exact rule text](docs/screenshots/ask-why.png)

---

## The hackathon story

**Inspiration.** We kept seeing the same thing: talented students with a list of twenty "great opportunities" and no idea which to do first. Every existing tool either just lists them or scores them with a number nobody can explain.

**How we built it.** We wrote the rules down *before* the code, so every behaviour has a written rule and a test. Engine first (eligibility, matching, tiers, reuse), then the week scheduler, then the interface, then AI last, behind a fact check. The ten opportunities were hand-checked against each organiser's own page; the verbatim quotes are in `.research/`.

**Challenges we ran into.**
- **Honest drama.** On real data at 10 h a week, no combination of opportunities overloads a week. Instead of fudging the data to get a red week for the demo, we built a *what-if* slider and say so on screen: *"At 10 h a week, no combination of what you can commit overloads a week. Drag lower to see where it breaks."*
- **The AI that thought too much.** Our model spent its entire output budget "thinking" and returned no answer at all. We added a strict timeout, dropped the hidden reasoning, and made sure the panel always lands on an answer.
- **Catching the AI being sneaky.** The fact checker caught the model writing numbers as words ("twenty-nine hours") and echoing internal field names. Both are now blocked.

**Accomplishments we're proud of.** 330 passing tests. A scheduler with property-based tests. Zero scores anywhere in the product. A demo that still works with the network unplugged.

**What we learned.** Explaining a decision is harder, and more valuable, than making one. And "rules decide, AI explains" is a design you can actually trust.

**What's next.**
- Paste an opportunity's web page and have AI fill in the form (with a verbatim-quote check for deadlines).
- A larger, community-verified opportunity list.
- Calendar export of your weekly plan.
- Mobile layout.

---

## Run it

Requirements: Node 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npx vitest run     # 330 tests
npm run build      # production build
```

**Optional live AI:** create `.env.local` (gitignored) with:

```bash
GEMINI_API_KEY=your-key
GEMINI_MODEL=your-model-name
```

The Vite dev server proxies `/api/llm/generate` and adds the key **server-side**; it never reaches the browser or the bundle. Without a key, *Ask why* uses saved answers and the rule text.

## Built with

Vite · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · lucide icons · Geist · Vitest · Google Gemini (optional).

```
src/engine/      rules: eligibility, matching, tiers, reuse, gaps, weeks, scheduler (pure, tested)
src/lib/         view models, Ask why prompt + fact check, AI fallback chain, add-your-own draft (pure, tested)
src/components/  React UI that only displays what the pure modules compute
src/data/        the 10 hand-checked opportunities (+ saved AI answers)
.research/       sources and verbatim quotes for every opportunity
```

## Honest limits

- **Ten curated opportunities**, hand-checked rather than live-scraped.
- **Effort hours are estimates.**
- **Location is an exact match** with your profile region, unless the opportunity is online.
- **The week a deadline falls in counts in full**, which is slightly optimistic.
- **Desktop and laptop layouts only.**

## Built with AI assistance

Built at Dublin HacX with AI coding assistants (Claude Code), working from a written plan and rules set by the author. The data, its sources and every product decision were reviewed by the author. Inside the app, Google Gemini is used only for the optional *Ask why* rephrasing.

## License

[MIT](LICENSE) © 2026 Rudra
