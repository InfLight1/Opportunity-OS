# Design workflow (unique-frontend)

## Project summary
- **What:** Opportunity OS, a browser-only planner that narrows a pile of student opportunities into Focus / Consider / Not now, with a plain reason for every cut, a week-by-week plan, and a "reuse" view of projects that count for several opportunities.
- **Who:** ambitious high-school students with more opportunities than hours (plus hackathon judges viewing the demo).
- **Feel wanted:** calm, honest, trustworthy; "rules decide, with reasons" rather than a magic AI match.
- **Hard rules:** no scores, percentages or match meters (not even decorative); real data only; keep every feature, flow and real content; Vite + React + Tailwind v4 + shadcn (Base UI).

## Current site (Oct 11, 2026)
- Dark, near-black story intro (floating opportunity cards, 10 / 160 h / 10 h stats), then the planner.
- Works: the story hook, clear stats, plain-language reasons.
- Generic: default dark shadcn look, Geist font, blue button, same-looking boxed cards everywhere.
- Must not change: the story intro, planner, Ask why, What-if slider, red overloaded weeks, reuse diagram, Add your own.

## Tools
- Design skills `impeccable` and `design-taste-frontend`: installed.
- Inspiration Library: readable (24 labeled screenshots).

## Progress
- [x] Step 0: understand the project
- [x] Step 1: pick references: Night Route, Unfair Advantage, Greater Care, Quiet Lake, Cobalt Horizon (see design/references.md)
- [x] Step 2: build 10 versions (design/versions/; grid at index.html, full-size viewer at viewer.html; checked desktop + phone). Waiting for user to star 1-2 favorites and paste "Copy my picks".
- [x] Step 3: narrow and freeze (winner: Night Route v2b with images; frozen in DESIGN.md; moved into the React app, commit "UF1")
  - Round 1 picks: Night Route taste, Unfair Advantage impeccable (note: spread out hero competitions). Feedback + round 2 directions: design/feedback-round1.md
  - Round 2 built: design/versions/night-route-v2a, night-route-v2b, unfair-advantage-v2a, unfair-advantage-v2b. If any folder is missing or unfinished, rebuild it from its direction in feedback-round1.md, then add all 4 to viewer.html (regenerate from the skill's references/viewer.html template) and show the user.
  - Round 2 picks: Night Route v2b (fix: wider weeks, done as 2 rows of 5) and Unfair Advantage v2b (fix: deadline line uncrowded, one row above/below, empty months squeezed). Fixes applied in place. Waiting for the final pick between these two + asset decision (see chat: NR needs 1 hero city image; UA needs none).
  - UA v2b white softened to #E8E5DF. User then asked for a mix: design/versions/mix-night-unfair = Night Route v2b layout + Unfair Advantage v2b colors/type (built by a recolor script, see git history). User chose Night Route v2b (Oct 12).
- [x] Step 4: generate images (hero city, dawn skyline, share crop; in public/assets)
  - Safe point before images: commit 823455a. Images go only in design/versions/night-route-v2b-images/ (copy); night-route-v2b stays untouched, so reverting = use v2b.
  - Made: assets/hero-city.webp (hero), assets/dawn-horizon.webp ("Now plan your weeks." band, 2nd try; 1st had fake sign lettering), assets/og-share.jpg (share crop of hero). User approved (Oct 12).
- [x] Step 5: tweak bar: skipped by owner (Oct 12; design already settled from the prototype)
- [ ] Step 6: 21st.dev components (optional)
