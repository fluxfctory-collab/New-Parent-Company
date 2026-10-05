# The Guardian Group — gateway page · Handover

A one-page, static gateway for The Guardian Group. The three-level pyramid is both the
central visual and the navigation: Guardian Civil Services at the apex, Guardian Medical
Advisory in the middle, Merlin at the foundation. Each level, its connector and its copy
form a single link to that company's site. QME is a separate brushed-gold control in the
header.

- Vite 8 + React 19 + TypeScript, **prerendered to static HTML**; production ships
  **no JavaScript**.
- Plain CSS with tokens. Two self-hosted webfont families: **Cinzel** (display) and
  **Lora** (text). No font CDN.
- All copy comes from `src/content.ts`, verified against the client's `.docx`.
- Original logos only (alpha-trimmed derivatives; originals untouched in `_brief/`).
- Nothing is deployed or published.

This document covers two passes: the original build (commit `2621897`) and the **visual
refinement pass** (typography, metallic gold, pyramid, rows) described first below.

## Run it

```bash
npm install            # Node 22+; installs exact pinned versions
npm run dev            # http://localhost:5173 — server-rendered, same markup as production
npm run build          # typecheck → client build (CSS, fonts) → SSR build → dist/index.html
npm run preview        # serves dist/ at http://localhost:4173
npm test               # build, then the Playwright + axe suite (43 checks)
npm run lint           # ESLint (flat config, typescript-eslint)
npm run typecheck      # tsc --noEmit
npm run check:manifest # every string in src/content.ts vs the .docx
npm run logos          # regenerate trimmed logos + favicons from _brief/
node scripts/screenshots.mjs final [full|states|details]  # docs/screenshots/final-*.png (after a build)
node scripts/compare.mjs a.png b.png out.png "left" "right" # labelled side-by-side
node scripts/contact-sheet.mjs       # docs/screenshots/logo-contact-sheet.png
node scripts/check-urls.mjs          # HEAD-check the four destinations (needs open internet)
node scripts/contrast.mjs [#fg #bg]  # WCAG contrast for the token pairs, or one pair
node scripts/font-fallbacks.mjs      # the metric overrides used in fonts.css
```

Playwright is pinned to 1.56.1 to match the Chromium build pre-installed in this
environment (an `overrides` entry keeps `@axe-core/playwright` on the same core). Elsewhere,
run `npx playwright install chromium` once before `npm test`.

`dist/` is self-contained: `index.html` (≈ 27 KB, 3 KB gzipped — the inline SVG pyramid
and gradients), one stylesheet (5.4 KB gzipped), fonts, logos, favicons. A first visit
downloads Cinzel latin (26 KB), Lora latin (38 KB, + 41 KB italic for the epigraph) and the
1.5 KB arrow glyph. Host `dist/` on any static server.

### One-line switches

| What | Where | Values |
|---|---|---|
| QME placement | `src/App.tsx` → `qmePlacement` | `"header"` (current) · `"below-selector"` (re-verified in this pass; `docs/screenshots/alt-qme-below-selector-1440.png`) |
| `between.la` fix | `src/content.ts` → `selector.closingLine` | change `in between.la` to `in between.` — still a content-review item; not changed in the styling pass |
| Pyramid size vs rows | `src/styles/global.css` → `--k` | `0.82` (≥ 1280) · `0.74` (1000–1279): the pyramid's height as a share of the three rows |

## Visual refinement pass — what changed

Brief: *Guardian Group Visual Refinement Prompt* — adopt the Guardian Civil Services
reference's typography and gold, refine the composition, keep scope and copy exact.

**Reference inspection.** `guardiancivil.services` (and its stylesheet
`…/elementor/css/post-7.css`) could not be opened from this environment: the egress policy
blocks the host for the sandbox and for the fetch tool, and archive.org is unreachable too.
The design therefore follows the reference details stated in the brief — Cinzel as the
primary heading family, `#B8915A` as the accent, Lora in components, Georgia in body
settings, a metallic submit button with a narrow diagonal highlight sweep. Nothing was
copied from the reference's layout.

### Typography

| Role | Family / weight | Size (desktop → mobile) | Notes |
|---|---|---|---|
| Hero | Cinzel 400 | 54 px at 1440 → 31 px at 360 | `clamp(1.9375rem, 1.12rem + 2.6vw, 3.4rem)`, line-height 1.16, tracking +0.004em, `text-wrap: balance` → 3 lines at 1000–1440, 4 at 360–390 |
| Section heading | Cinzel 400 | 35 px at 1440 → 26 px | one line on desktop |
| Company names | Cinzel 500 | 24 → 20 px | tracking +0.02em; long names wrap naturally |
| QME | Cinzel 600 | 14 px | tracking 0.16em (3 letters only) |
| Subhead, benefit (500), description, closing line, CTAs (600), footer | Lora | 15–20 px | line-height 1.5–1.6 |
| Epigraph | Lora italic | 21 → 18 px | attribution Lora 14 px in `--ink-2` (quieter than before) |

Cinzel's lower-case letters are small capitals by design, so the hero and headings read as
capitals while the DOM text keeps its exact mixed case — no `text-transform` anywhere
(tested). Only two families are loaded. **The `→` in the CTAs exists in neither Cinzel nor
Lora** (checked in every subset, including Lora's math/symbols files), so the existing
1.5 KB one-glyph file (Inter 4.1, OFL) is declared *inside the Lora family* with
`unicode-range: U+2192`; no text is set in a third family. Liberation Serif's arrow was
also considered; its OFL reserves the "Liberation" name for derivatives, and the Inter
glyph renders indistinguishably at CTA sizes.

**Stable font loading.** Both latin files every visit needs (Cinzel, Lora) are preloaded;
all faces use `font-display: swap`; and the fallbacks are metric-matched from Capsize data
(`size-adjust`, `ascent-/descent-/line-gap-override` on local Georgia, then Times New
Roman / Liberation Serif). Measured with fonts delayed by 1.5 s: the section heading moves
**0 px** when the fonts arrive (layout shift 0.0000 at 1440, 0.0001 at 390). The same test
with a plain `serif` fallback moves it **63 px** (layout shift 0.033 at 1440, 0.084 at 390).

### Gold system

| Token | Hex | On `#FAF8F4` | Use |
|---|---|---|---|
| `--paper` | `#FAF8F4` | — | canvas (plus a barely visible champagne warmth, top right) |
| `--ink` | `#242629` | 14.30 : 1 | headings, benefit lines |
| `--ink-2` | `#565B61` | 6.46 : 1 | descriptions, subhead, attribution |
| `--ink-3` | `#4A4F55` | 7.79 : 1 | footer links |
| `--gold-dark` | `#71502C` | 6.86 : 1 | CTA text, QME border, focus rings |
| `--gold-deep` | `#9C7845` | 3.82 : 1 | pyramid edges where they must read on paper |
| `--gold` | `#B8915A` | 2.74 : 1 | reference accent — decorative only |
| `--gold-mid` / `--gold-champagne` / `--gold-reflect` | `#C49C61` / `#E8D2A8` / `#FFF1CE` | — | metal midtones and highlights |

- **Brushed metal** (`--metal-surface`, QME): darker edges, warm midtones, one narrow
  reflective band just above the lettering; no alternating stripes. Charcoal lettering on
  every gradient stop under the text is ≥ 7.26 : 1.
- **Metal hairline** (`--metal-line`: epigraph rule, CTA underline, connector on hover):
  dark ends and a single soft glint. The glint stays well darker than the canvas. A first
  version used `#FFF1CE` and made 1 px rules look broken ("— —").
- **Sweep**: a narrow, soft, diagonal white-to-transparent highlight in clipped
  pseudo-elements (`overflow: hidden`, `pointer-events: none`), animating only
  `transform`/`opacity`. It runs **once** about 0.9 s after load and again on QME
  hover/focus. Nothing else on the page shimmers and nothing loops. With reduced motion
  there is no sweep and the static gold is unchanged.

### Composition

- **Header.** Parent logo 40 → **46 px** (34 px mobile), re-exported at 2×/3× of the new
  size. Derivative trim margin reduced from 1.5 % to 0.6 % of the artwork height (alpha mass
  retained ≥ 99.9999 %). QME stays top right as a brushed-gold plate: 1 px `#71502C`
  border, inner highlight line, and its light shifts on hover as if the metal tilted.
- **Hero.** Three balanced Cinzel lines; the introduction stays compact. At 1440 × 900 the
  section heading is at y = 496 and the pyramid apex at y = 621 (before: 533 / 629).
  **Epigraph** now sits on a deliberate axis: its left edge is the same vertical line where
  the company names start below, and its last line shares the subhead's baseline. One
  44 px gold rule, Lora italic, quieter attribution.
- **Pyramid.** The vertical two-colour split is gone: **exactly three horizontal levels**,
  one coherent surface each (warm stone `#ECE6DB` → warm grey `#B9B6AE` → deep slate
  `#3B4048`, deepening toward the specialist apex). A faint left-to-right light falloff is
  shared by all three, so it adds depth without implying extra bands. Fine metallic gold
  edging runs as one continuous gradient across the levels (the gradient's user space
  spans the whole pyramid), brightest at the capstone and deepening toward the base.
  Seams are single gold lines, each drawn once.
  **Footprint**: at 1440, 480 × 453 px (before 550 × 510): 12.7 % narrower, 11 % shorter,
  ≈ 22 % less area. **Proportion** (width : height): 1.06 at 1440, 1.03 at 1280–1100,
  0.90 at 1024, 0.86 at 1000.
- **How the levels and connectors stay exact.** The pyramid's height is `--k` × the three
  rows' height (0.82 ≥ 1280, 0.74 at 1000–1279), centred on them; each level is positioned
  against the selector, so the triangle stays continuous whatever height the copy takes.
  Each connector sits at its row's vertical middle, so it lands on its own level, and it
  starts at the level's right edge, computed in CSS as `(0.5 + 0.5·t) × width` with
  `t = ((row + 0.5)/3 − (1 − k)/2)/k`. It starts 2 px underneath the level, so the join is
  always clean. At ≥ 1280 every connector meets its logo's vertical centre. All of this is
  asserted by the geometry tests at 1440, 1280 and 1024.
- **Interaction.** Hovering or focusing a level *or* its row does four things together: the
  level deepens one tone and gains a full gold ring, the connector turns metallic gold, a
  faint champagne wash appears behind the copy, and the CTA underline thickens while its
  arrow moves 4 px. Nothing is dimmed; every company stays fully visible at rest.
- **Rows.** Logos enlarged and optically normalised: Guardian sub-brands **44 px** /
  Merlin **46 px** at ≥ 1280 (were 36 / 38), 34 / 36 at 1000–1279, 36 / 38 on mobile.
  Merlin keeps +2 px because its MERLIN caps are proportionally larger but its shield
  and tagline carry less mass. At ≥ 1280 the logos form a column the connectors run into,
  with names, benefits, descriptions and CTAs on one shared left edge. At 1000–1279 the
  logo heads the copy (stacked); a first try put it beside the Cinzel name, which repeated
  the same wordmark twice on one line.
- **CTAs.** "Explore Merlin →" / "Learn more →" are Lora 600 in dark gold (6.86 : 1) with a
  fine metallic underline that thickens to 2 px on hover/focus, plus a 4 px arrow move.
  Visible wording unchanged; the two "Learn more" links keep company-specific accessible
  names.
- **Footer.** Logo 28 → 32 px; links in Lora 15 px `--ink-3` (7.79 : 1); 32 px spacing; link
  text baseline set on the logo's GUARDIAN baseline (measured 1.2 px off, now aligned);
  one hairline separator, consistent with the header.
- **Mobile (< 1000 px).** Compact overview pyramid (150–190 px, same surfaces and gold),
  then foundation-first rows with a 34 px glyph (the row's own level lit), larger logos,
  Cinzel names, full Lora copy. QME stays visible in the header; all links ≥ 44 × 44.

### Refinement round (after reviewing the first updated screenshots, `r1-*`)

| Seen in r1 | Change |
|---|---|
| 1 px gold rules looked broken ("— —"): the hairline glint was near-white | Hairline gradient's brightest stop is now `#DDBE88` |
| QME's reflective band sat below the lettering | Band moved just above the lettering; it slides down on hover/focus |
| 1000–1279: logo beside the Cinzel name repeated the wordmark | Logo stacked above the name; pyramid ratio kept at 0.90 by `--k` 0.74 and a wider pyramid where room allows |
| 360: "For the litigation" was 0.3 px too wide at 32 px → 5-line headline starting "FOR THE" | Hero floor 31 px → 4 lines at 360 |
| Headline → subhead and heading → pyramid gaps a little loose | Hero row gap 28 → 20 px; selector top margin 48 → 33 px at 1440 |
| Hover wash read slightly like a card | Wash alpha 0.22 → 0.17 |
| Footer links 1.2 px above the wordmark baseline | 2 px top padding on the link boxes |

Comparisons: `compare-r1-final-1440.png`, `compare-r1-final-360.png`.

## Verification results (final build)

Run on 2026-10-05 in this environment: `npm run check:manifest && npm run typecheck && npm run lint && npm test` → **43 passed**.

| # | Check | Result | How |
|---|---|---|---|
| — | Manifest vs `.docx` | **Pass** | 31 assertions; `meta.title` reported as a noted exception (see Phase 1). |
| 1 | Exact copy | **Pass** | Every manifest string present verbatim; 7 alternate variants and 13 authoring labels absent; no `text-transform` on any element; U+2014 and U+2192 as code points (3 arrows); one `h1`, the `h2`, three `h3`s, landmarks, `lang="en"`. |
| 2 | Links / destinations | **Pass** | Exactly `#top`, `https://www.merlin.law/`, `https://www.guardianadvisory.group/`, `https://www.guardiancivil.services/`, `https://www.theguardian.group/`; service anchors map to their companies; no nested links/buttons; QME outside the selector; no `target`. |
| 3 | Row and level activation | **Pass** | Desktop: clicking each level's centroid and each copy row opens the right URL (outbound requests stubbed); mobile: each row. The paper beside the apex is not a link. Clicking QME through the sweep overlay navigates. |
| 4 | Keyboard + visible focus | **Pass** | Tab order logo → QME → Merlin → Medical Advisory → Civil Services → footer links; every stop shows a 2 px solid `#71502C` ring (desktop rows: around the hover wash). |
| 5 | Accessible names | **Pass** | "Explore Merlin", "Guardian Medical Advisory Learn more", "Guardian Civil Services Learn more"; descriptions via `aria-describedby`. |
| 6 | No horizontal overflow | **Pass** | 1440, 1280, 1024, 768, 390, 360 and 720 / 640 px at 2× (200 % zoom). |
| 7 | Touch targets | **Pass** | Every link ≥ 44 × 44 at 390 and 360. |
| 8 | Reduced motion | **Pass** | `reduce`: zero running animations, everything at full opacity (except the hover-only gold ring), no arrow travel, QME keeps its static gradient, sweep absent. Motion allowed: 3 entrance animations (≤ 400 ms) + exactly 1 QME sweep, all single-iteration; QME sweep replays on hover and focus; overlays never take pointer events. |
| 9 | No JS | **Pass** | All copy and links present with JS disabled; the built HTML has no `<script>`. |
| 10 | First viewport | **Pass** | 1440 × 900: heading at 496 px, apex at 621 px. |
| 11 | Images | **Pass** | 5 logos load (WebP, PNG fallback) with matching `width`/`height`; layout shift < 0.01. |
| 12 | axe | **Pass** | No serious or critical violations at 1440 and 390. |
| 13 | Fonts | **Pass** | Display elements resolve to Cinzel, text elements to Lora (epigraph italic); every font file downloaded is Cinzel, Lora, or the one-glyph arrow supplement; every webfont face is `font-display: swap`; both latin files preloaded. **Font-swap stability:** with fonts delayed 1.5 s the text is on screen immediately, the heading moves < 2 px (measured 0) and layout shift < 0.01 (measured 0.0000). |
| 14 | Contrast | **Pass** | CTA ≥ 6.8 : 1; description, subhead, attribution, closing line, footer links, headline all ≥ 4.5 : 1 against the canvas. |
| + | Pyramid geometry | **Pass** | At 1440, 1280, 1024: three equal, contiguous levels with one width and x; pyramid centred on the rows; ratio > 1.0 (≥ 1280) / > 0.85 (1024); each connector at its row's middle, inside its own level, starting at the computed edge (± 1.5 px); copy and names share one left edge; logos centred on connectors at ≥ 1280. Hover lights level ring, connector, underline and arrow together. |
| — | Build / typecheck / lint | **Pass** | `vite build` + SSR + prerender; `tsc --noEmit`; ESLint. |
| — | Destination HEAD requests | **Not run** | Still blocked by this environment's egress policy: the proxy answers `403` to CONNECT for all four hosts (`curl: CONNECT tunnel failed, response 403`). That is the sandbox, not the sites. `node scripts/check-urls.mjs` reports status codes and every redirect hop on an open network. No URL changed. |
| — | Reference site | **Not inspected live** | Blocked as above (and archive.org unreachable); see "Reference inspection". |

Browsers: Chromium only (Playwright). The CSS also relies on container query units,
`color-mix()`, `size-adjust`/metric overrides, `text-wrap` and `:is()`, all supported in
current Safari, Firefox and Chrome; `text-wrap` degrades to normal wrapping.

## Screenshots (`docs/screenshots/`)

| File | What |
|---|---|
| `compare-before-after-1440.png`, `compare-before-after-first-viewport-1440.png` | **Before / after, desktop** |
| `compare-before-after-390.png` | **Before / after, mobile** |
| `compare-r1-final-1440.png`, `compare-r1-final-360.png` | The refinement round (first updated → final) |
| `final-full-{1440,1280,1024,768,390,360}.png` | Final full pages (≤ 768 at 2×) |
| `final-first-viewport-1440x900.png`, `final-zoom200-720.png` | First view; 200 % zoom reflow |
| `final-detail-qme-rest.png`, `final-detail-qme-sweep.png` | QME brushed gold at rest and mid-sweep (2×) |
| `final-detail-pyramid.png`, `final-detail-row-hover.png` | Pyramid edges/joins; a row on hover (2×) |
| `final-hover-*.png`, `final-focus-*.png` | Hover via copy and via level; keyboard focus |
| `before-*.png` | The previous design (baseline for this pass) |
| `r1-full-{1440,1024,360}.png` | First updated screenshots of this pass |
| `logo-contact-sheet.png` | Trimmed logos at every display size |
| `alt-qme-below-selector-1440.png` | The QME alternative placement |

## Design decisions still in force from the first pass

- **DOM order** Merlin → Medical Advisory → Civil Services everywhere; desktop stacks them
  bottom-to-top with `grid-row`.
- **Hit areas follow the shapes**: anchors have `pointer-events: none`; the painted
  polygons, connector zone and copy column re-enable it.
- **Motion**: one entrance moment (levels settle foundation → apex, ≤ 400 ms), CSS only.
- **QME accessible name** `"QME (legacy site)"` (starts with the visible label) — my
  wording, removable.
- **Footer** logo is an image, not a link; QME is not repeated there. No sticky header.
- **Favicons** from the helmet mark; the 180 px touch icon sits on the canvas colour
  because iOS paints transparent touch icons on black.

Superseded by this pass: the bronze/graphite "helmet split" palette (and its A/B
alternatives), Source Serif 4 + Inter, the 1.5 % logo margin, the band-equals-row pyramid
model, and the bronze focus colour.

## Source issues for the client

1. **`between.la`** — the closing line ends "…somewhere in between.la". Kept verbatim (also
   in this styling pass); proposed fix "…somewhere in between." is a one-line change in
   `src/content.ts`. The manifest check will flag it until the `.docx` is corrected too.
2. **QME placement conflict** — "top right corner" (twice) vs "stays where it is, separate
   and below". Current: header top right. Alternative: `qmePlacement = "below-selector"`.
3. **Logo filenames are misleading** — "Medical Advisory **Bronze 2**" is the white-wordmark
   (dark background) version; "**Bronze Inverted**" is for light backgrounds.
4. **Merlin has no light-on-dark variant**, which is why every logo sits on the light canvas.
5. **Destination redirects** — not checkable from here; run `node scripts/check-urls.mjs`.
6. **Page title** — not stated in the document; "The Guardian Group" is used.

## File map

```
src/content.ts                  every visible string (single source of truth)
src/App.tsx                     page assembly + qmePlacement switch
src/components/                 Header, Hero, ServiceSelector (levels, connectors, rows,
                                overview, glyphs), Footer, Logo, QmeLink
src/styles/tokens.css           colour, gold/metal, type and layout tokens
src/styles/global.css           layout, pyramid geometry, states, breakpoints, motion
src/styles/fonts.css            Cinzel + Lora, the → glyph supplement, metric fallbacks
src/assets/logos/               trimmed derivatives + generated logos.ts (sizes)
src/entry-server.tsx            renderToStaticMarkup(<App />)
src/entry-client.ts             CSS entry only; stripped from the build
scripts/prerender.mjs           injects markup, strips JS, preloads Cinzel + Lora
scripts/prepare-logos.mjs       alpha-threshold trim, margin, WebP/PNG, favicons
scripts/check-manifest.mjs      content.ts vs the .docx
scripts/{screenshots,compare,contact-sheet,contrast,check-urls}.mjs
tests/site.spec.ts              Playwright + axe suite (43 checks)
_brief/                         the client's files, untouched
docs/screenshots/               review captures
```

---

# First pass records (original build, commit `2621897`)

The sections below document the original inspection and plan. Where they describe tokens,
fonts or the pyramid palette, the refinement pass above supersedes them.

## Phase 1 — Inspection findings

Checked with my own tools (Node + sharp pixel scans, a python dump of
`word/document.xml`, and rendered previews of every logo on `#FAF9F6` and `#303942`).

### Document

- Structure confirmed exactly as described: Headline / Subhead labels → "The epigraph" →
  "The cards" (layout note + table with **alternate** wording) → "Card copy, as it appears"
  (**canonical**) → "The QME button" → "The pyramid" (one image, `word/media/image1.png`,
  1512×748) → "Using it on the page" (heading + closing line).
- The document has no hyperlinks; destinations are written as bare hostnames
  (`merlin.law`, `guardianadvisory.group`, `guardiancivil.services`,
  `www.theguardian.group`). The `https://www.` URLs come from the brief.
- `scripts/check-manifest.mjs` passes: every string in `src/content.ts` is found verbatim,
  and each service's name → benefit → description → CTA appear as consecutive whole
  paragraphs inside "Card copy, as it appears".
- **Difference from the brief:** `meta.title` ("The Guardian Group") does not occur in the
  document text — the organisation is only named through the filename and the logo. It is
  the company's name rather than copy, so the check reports it as a noted exception
  instead of failing.

### Diagram (`image1.png`)

Apex-up triangle, three equal-height bands (Civil Services top, Medical Advisory middle,
Merlin base); measured base ≈ 544 px vs height ≈ 486 px → width ≈ 1.12 × height.
Grey connectors start 13–22 px beyond each band's right edge and end at a shared
left-aligned text column. Composition used; its wording and blue palette are not.

### Logos — inventory confirmed visually

All roles in the brief's table are correct, including the two misleading names:
"Medical Advisory **Bronze 2**" has a **white** wordmark (dark backgrounds only) and
"Medical Advisory **Bronze Inverted**" is the light-background version.

Alpha-threshold bounding boxes (alpha > 8, inclusive pixel coordinates):

| File | Naive bbox (alpha > 0) | Artwork bbox (alpha > 8) |
|---|---|---|
| Civil Services Gray.White | whole canvas | 486,376 → 1576,662 |
| Medical Advisory Bronze Inverted | whole canvas | 486,376 → 1577,663 |
| Medical Advisory Bronze 2 | whole canvas | 486,376 → 1577,662 |
| Final_logo_01-01.png (Merlin) | 173,84 → 2782,903 | same |
| logo Update 2 … (parent) | 128,128 → 4201,1139 | same |

The stray near-invisible pixels are real: a naive trim keeps the whole 1920×1080 canvas.

### Colours sampled (9×9 opaque-pixel averages) vs the brief

| Sample | Brief | Measured |
|---|---|---|
| Parent helmet, bronze half | `#885828` | `#A96E42` mid-gradient (darker toward the base) |
| Medical Advisory helmet bronze / sub-line | `#885828` | `#89592C` / `#845224` ✔ |
| Merlin shield highlight | `#C88058`–`#D89858` | `#D99D5A` ✔ |
| Parent GUARDIAN / helmet graphite | `#787880` → `#404048` | `#7C7A82` → `#434244` ✔ |
| Civil Services wordmark | `#384040` | `#3F4044` (close) |
| Merlin wordmark | `#384040` | `#37383A` ✔ |
| Medical Advisory navy wordmark | `#081828` | `#0D1B2A` (close) |

No change to the token set was needed; the brief's tokens sit inside these ranges.

### Font coverage (found during setup)

The self-hosted latin subsets of Inter and Source Serif 4 (Fontsource, Google subsets)
do **not** contain U+2192 `→`, which is part of every CTA. Left alone, the arrow would
render in whatever system font the visitor has. Fix: a 1.5 KB Inter 4.1 file subset to that
single glyph (`src/assets/fonts/inter-arrow-wght.woff2`, OFL licence alongside), declared
as part of the `Inter Variable` family with `unicode-range: U+2192`.

## Phase 2 — Design plan (as written before the first build)

### Tokens

As specified in the brief (`src/styles/tokens.css`); contrast measured with
`node scripts/contrast.mjs` (WCAG 2.x formula):

| Pair | Ratio | Use |
|---|---|---|
| `--ink #23262B` / paper | 14.42 | headline, names, benefit lines |
| `--ink-2 #5D646C` / paper | 5.69 | descriptions, closing line |
| `--bronze-ink #875A2E` / paper | 5.65 | CTAs, attribution |
| `--bronze-ink` / `--bronze-wash` | 4.89 | CTA on hover tint |
| `--bronze #9B6B3F` / paper | 4.37 | rules, strokes, fills only — never small text |
| `--slate #303942` / paper | 11.15 | tier fill (option A) |
| `--graphite-2 #74767E` / paper | 4.30 | tier fill / stroke |
| `--rule-strong #C9BFAF` / paper | 1.73 | QME outline (decorative — the text label identifies the control) |

Tier fills below 3 : 1 get a `--bronze` or `--graphite-2` stroke (both > 4.3 : 1).

### Type roles

- **Source Serif 4** (variable, `opsz` axis on, 400/600): H1, H2, company names (600),
  epigraph quote.
- **Inter** (variable, 400/500): subhead, benefit, description, CTA, QME, footer.
- Benefit line: start in Inter 500 at ~17 px, `--ink`; compare with serif by screenshot.

### Wireframes

Desktop (≥ 1024; 1200 max content):

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ [GUARDIAN GROUP logo]                                                [ QME ]  │ 88px
├───────────────────────────────────────────────────────────────────────────────┤
│ For the litigation teams who rely                                             │
│ on medical insight and testimony.                         ──── (bronze rule)  │ H1 cols 1–8
│ Medical Intelligence Services — record analysis,          Knowledge itself    │ epigraph
│ physician reports, and expert testimony.                  is power.           │ cols 10–12
│                                                           — Francis Bacon     │
│ Match the medicine to the matter.                                             │ H2
│                                                                               │
│            /\  ─────────────  [logo]  Guardian Civil Services                 │ row 1 (apex)
│           /  \                        benefit / description / Learn more →    │
│          /────\  ──────────── [logo]  Guardian Medical Advisory               │ row 2
│         /      \                      benefit / description / Learn more →    │
│        /────────\  ────────── [logo]  Merlin                                  │ row 3 (base)
│       /          \                    benefit / description / Explore Merlin →│
│ Every case rests on the record. Few warrant a specialist. Most sit … between.la│
├───────────────────────────────────────────────────────────────────────────────┤
│ [logo small]                 Merlin   Guardian Medical Advisory   Guardian …  │
└───────────────────────────────────────────────────────────────────────────────┘
```

Each row (tier + connector + copy) is one `<a>`; DOM order Merlin → Medical Advisory →
Civil Services, placed bottom-to-top with `grid-row`.

Mobile (< breakpoint, found by screenshot, ≈ 960):

```
┌──────────────────────────────┐
│ [logo]               [ QME ] │ 64px
├──────────────────────────────┤
│ For the litigation teams     │
│ who rely on medical insight  │
│ and testimony.               │
│ Medical Intelligence …       │
│ ──                           │
│ Knowledge itself is power.   │
│ — Francis Bacon              │
│                              │
│ Match the medicine to the    │
│ matter.                      │
│      /\                      │  compact overview, aria-hidden
│     /──\                     │
│    /────\                    │
│ ──────────────────────────── │
│ ▱ [logo]                     │  tier glyph (foundation shape)
│ Merlin                       │
│ benefit / description        │
│ Explore Merlin →             │
│ ──────────────────────────── │
│ ▱ Guardian Medical Advisory …│
│ ──────────────────────────── │
│ △ Guardian Civil Services …  │
│ ──────────────────────────── │
│ Every case rests on …        │
├──────────────────────────────┤
│ [logo]  links (stacked)      │
└──────────────────────────────┘
```

### Generic-page tells checked and excluded

No eyebrow labels, no 01/02/03 markers, no cards or soft shadows, no gradients
(option C uses two flat halves, not a blend), no glass/blur/blobs, no stock imagery,
no 3D, no single accented headline word, no pill shapes (radii 0–2 px), no sticky header,
no hero buttons. The `→` stays because it is client copy.

### Review against the brief (revisions made to this plan)

1. First draft put the logo above each company name. That stacks five items into a
   164 px band and pushes the connector away from the band's middle. Revised: on desktop
   the logo gets its own narrow column between the connector and the copy, vertically
   centred on the connector (the brief's "logo's vertical centre" alignment option); the
   copy block is vertically centred in the band. Stacked anatomy kept as a fallback for the
   narrowest desktop widths if screenshots show the copy column is too tight.
2. First draft had QME in the footer as well. Removed: one legacy link is enough and the
   tab order in the brief ends with the company links.
3. Footer logo is a plain image (not a link) so the tab sequence stays
   logo → QME → three services → footer links.
