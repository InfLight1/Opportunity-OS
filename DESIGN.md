# Opportunity OS design: Night Route

Frozen 2026-10-12. Chosen by the owner from 16 versions (`design/versions/`, viewer at `design/versions/viewer.html`).
Source version: `design/versions/night-route-v2b-images` (Night Route layout, "Clear planner" variation, with images).
Reference: `design/references/BeamsSection.webp` ("Night Route" in the shared Inspiration Library).

**Token source (single place to change the look):** `src/night-route.css` `:root` (`--nr-*`). `src/index.css` maps the shadcn names onto these tokens. Shared buttons: `src/components/ui/button-variants.ts`.

## Idea
A night city seen from above. Your plan is the route through it: one glowing blue line runs down the story, each section is a stop, the weeks are stops along a road, and orange marks deadlines, cuts and anything that can't fit.

## Palette
| Token | Hex | Use |
|---|---|---|
| `--nr-bg` | #06121F | page background (story) |
| `--nr-bg-2` | #081A2C | planner background, dialogs |
| `--nr-panel` | #0A1F35 | summary cells, what-if panel |
| `--nr-navy` | #0B2A4A | raised surfaces |
| `--nr-line` / `--nr-line-2` | rgba(150,190,235,.14 / .26) | hairlines, borders |
| `--nr-text` | #EEF4FB | main text |
| `--nr-muted` / `--nr-dim` | #B0C2D6 / #8DA2BA | secondary text |
| `--nr-blue` | #4FA3FF | the route, Focus, primary buttons, planned hours |
| `--nr-blue-hi` | #9FCBFF | eyebrows, second headline line, tags |
| `--nr-orange` | #FF7A3D | deadlines, cuts, locked reasons, over capacity, catches |
| `--nr-orange-hi` | #FFB48E | orange text on dark |

## Type
- Words: **Outfit** (300/400/500/600). Numbers and dates: **IBM Plex Mono** (400/500). Both from Google Fonts (`index.html`).
- Hero h1 clamp(2.4rem, 3.5vw, 3.5rem); section h2 clamp(2rem, 3.4vw, 2.9rem); card titles 1.02-1.38rem by tier; body 17px (16px on phones); smallest text 13.5px (mono), 15px (words).
- Sentence case everywhere. No tiny uppercase labels.

## Space, shape, depth
- Max width 1320px; side gutter clamp(16px, 4vw, 56px). Section padding clamp(48px, 6vw, 80px) in the planner, clamp(56px, 7vw, 96px) in the story.
- Radius: cards 12px, inputs 8px, buttons and pills fully round.
- Depth: soft dark shadows; blue glow only on Focus cards, committed items, the route and its stops; orange glow only on deadline stops.

## Layout rules
- Hero: full-bleed city photo; headline block left; the 10 opportunity chips scattered in a cluster to the right of the headline, level with it, never below it and never below the first screen (`src/lib/hero-layout.ts`; loosest scatter first, tighter only on small screens). Under 960px the chips become a two-column grid under the headline.
- Story: one route line down the left with a stop per section; the narrowing list as off-ramps (each cut dashed, struck through, orange reason); threads from the project to each opportunity; dawn skyline behind "Now plan your weeks."
- Planner: summary grid (4 cells + this week + next step); Focus as a lit 2-column grid with Consider and Not now in the side column; weeks as five stops per row (two on phones), never a side scroll; what-if panel above the weeks; threads; add-your-own form with a live result card.

## Images (generated, Higgsfield, 2026-10-12)
- `public/assets/hero-city.webp`: aerial night city, blue streets, one orange highway, dark left side.
- `public/assets/dawn-horizon.webp`: skyline at first light behind the hand-off (2nd try; the 1st had fake sign lettering).
- `public/assets/og-share.jpg`: share preview, a crop of the hero.
Everything else is CSS. No text is ever baked into an image.

## Motion
Hero copy rises in once; chips drift a few pixels; threads draw in on scroll (and appear anyway after 4 s); count-up stats. All off under reduced motion. Nothing waits invisible for a scroll event.

## Always / Never
- Always: real data only; every cut shows its reason; blue = your plan, orange = deadline / cut / can't fit; mono for numbers and dates; buttons in sentence case.
- Never: scores, percentages, match meters or fit bars (even decorative); a third accent color; text inside images; horizontal page scroll; hiding content until an animation fires.
