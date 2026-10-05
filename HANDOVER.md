# The Guardian Group — gateway page · Handover

A one-page, static gateway for The Guardian Group, built to the **selected design**: a
light ivory header with the original logo, a dark charcoal hero with soft reflected light
behind the headline, and an ivory section where the supplied three-tier pyramid sits
between the three companies — Guardian Medical Advisory to the left (middle tier),
Guardian Civil Services upper right (top tier), Merlin lower right (foundation). Each tier
is a link; each company also has its own text link; fine bronze connectors with endpoint
dots tie tier to company.

- Vite 8 + React 19 + TypeScript, **prerendered to static HTML**; production ships
  **no JavaScript** (hover associations use CSS `:has()`).
- Two self-hosted font families: **Lora** for all text, **Cinzel** only for the QME label.
- All copy comes from `src/content.ts`, verified against the client's `.docx`.
- Original logos only (trimmed derivatives; originals untouched in `_brief/`). The
  supplied pyramid artwork is used as-is (`public/images/guardian-pyramid.png`).
- Nothing is deployed or published.

## Run it

```bash
npm install            # Node 22+; installs exact pinned versions
npm run dev            # http://localhost:5173 — server-rendered, same markup as production
npm run build          # typecheck → client build (CSS, fonts) → SSR build → dist/index.html
npm run preview        # serves dist/ at http://localhost:4173
npm test               # build, then the Playwright + axe suite (45 checks)
npm run lint           # ESLint (flat config, typescript-eslint)
npm run typecheck      # tsc --noEmit
npm run check:manifest # every string in src/content.ts vs the .docx
npm run logos          # regenerate trimmed logos + favicons from _brief/
node scripts/prepare-pyramid.mjs     # WebP sizes of the pyramid + its measured tier outlines
node scripts/screenshots.mjs final [full|states|details]  # docs/screenshots/final-*.png
node scripts/compare.mjs a.png b.png out.png "left" "right" # labelled side-by-side
node scripts/check-urls.mjs          # HEAD-check the four destinations (needs open internet)
node scripts/contrast.mjs [#fg #bg]  # WCAG contrast for token pairs, or one pair
node scripts/font-fallbacks.mjs      # the metric overrides used in fonts.css
```

Playwright is pinned to 1.56.1 to match the Chromium build pre-installed in this
environment (an `overrides` entry keeps `@axe-core/playwright` on the same core). Elsewhere,
run `npx playwright install chromium` once before `npm test`.

### One-line switches

| What | Where | Values |
|---|---|---|
| QME placement | `src/App.tsx` → `qmePlacement` | `"header"` (current) · `"below-selector"` |
| `between.la` fix | `src/content.ts` → `selector.closingLine` | `in between.la` → `in between.` — **still kept as supplied; flagged for editorial correction** |

## Selected design — what was built

**Inputs.** The brief's two assets were a full-page mockup and `guardian-pyramid.png`.
**Only the pyramid arrived** (delivered to this session as a 1312 × 1199 WebP with a real
alpha channel; stored losslessly as `public/images/guardian-pyramid.png`). **The full-page
mockup was not attached**, so the layout follows the brief's written description of it
(sequence, asymmetric placement, connectors with dots, colours). Compare against the
mockup when it's available; the composition is driven by a handful of variables
(`--pyr-w`, `--reach`, `--callout-w` in `global.css`).

### Header (light)

`#F7F4EE`, a 1 px bronze bottom rule (`rgb(184 145 90 / .55)`), the original parent logo
at 50 px (38 px mobile), unfiltered and at its natural ratio. Height 96 px desktop / 74 px
mobile. QME: outlined in bronze, charcoal Cinzel lettering, champagne fill on hover/focus.

### Hero (dark, atmospheric)

- Charcoal gradient `#1D2326 → #252B2D`, centred copy. Headline Lora 400, fluid
  `clamp(2.25rem, 1.05rem + 3.6vw, 4.25rem)` — 68 px at 1440, 63 px at 1280 — line-height
  1.1. At ≥ 1100 px it is set as **two editorial lines**, "For the litigation teams who rely
  on / medical insight and testimony.", so the emphasised phrase opens line 2; narrower
  screens wrap naturally (`text-wrap: balance`). The visible text is unchanged.
- "medical insight" in a champagne-to-bronze gradient (darkest stop 5.53 : 1 on the hero),
  with one narrow highlight passing across once on entry.
- Background layers (all `aria-hidden`, `pointer-events: none`): a broad champagne/bronze
  radial glow behind the emphasised phrase (the only looping animation — a 16 s
  transform/opacity drift); a dimmer light field (warm corners, darker edges, a soft shade
  under the header); seven widely spaced contour loops at 5 % opacity; fine grain at 3 %.
- Supporting sentence, a short gold divider, the quotation in Lora italic and a quieter
  attribution. "Services —" is kept on one line so no line ever starts with the dash.
- Reduced motion: no drift, no glint; the static composition is identical otherwise.

### Selector (ivory)

- Centred heading with a short bronze rule; `#F7F3EC` surface.
- **Pyramid**: the supplied image, never cropped or stretched (`height: auto`,
  `object-fit: contain`; tested at 1440, 1024 and 390), 490 px wide at 1440, 440 px at
  1200, centred 420/340 px on tablet/mobile. WebP sizes 640/980/1312 with the PNG as
  fallback; width/height reserved. A faint elliptical ground shadow, no box behind it.
- **Tier links**: three native SVG `<a>` elements over the image, each a polygon that
  traces its tier's outer gold frame in **normalized image coordinates** (measured from the
  alpha channel by `scripts/prepare-pyramid.mjs`; transparent padding included). The gaps
  between tiers and the padding are not links (tested). Names: "Guardian Civil Services —
  top tier of the pyramid", etc. Focus draws a charcoal ring along the tier's own outline.
- **Descriptions**: original logo as the `h3` (alt = company name), benefit line, description,
  and a text link ("Learn more →" / "Explore Merlin →", dark gold `#71502C`, 6.58 : 1;
  accessible names "Learn more Guardian Civil Services" etc.). No nested links.
- **Desktop (≥ 1200)**: Medical Advisory left (right-aligned), Civil Services upper right,
  Merlin lower right. Each description's logo is centred on its tier's mid-height; the
  connector runs from 10 px off the tier's edge to 12 px short of the description, with 5 px
  bronze dots at both ends (all tested to ±1.5 px at 1440, 1280 and 1200).
- **Association**: pointing at or focusing a tier deepens its connector (dots grow
  slightly) and thickens its description's link underline with a 4 px arrow move; pointing
  at or focusing a description lights its tier and connector. 220 ms transitions; nothing
  scales or bounces.
- **Tablet (960–1199)**: pyramid centred, the three descriptions in a row below
  (Civil Services, Medical Advisory, Merlin); connectors hidden. **Mobile (< 960)**: one
  open column in the same top-to-bottom order with fine dividers.
- The explanatory statement sits centred beneath, clear of all descriptions.

### Footer

Ivory, a bronze top rule matching the header's, the parent logo, and the three links in the
supplied order: Merlin, Guardian Medical Advisory, Guardian Civil Services. Stacks on mobile.

### Content note

The DOM/reading/focus order is now **top tier first** (Civil Services → Medical Advisory →
Merlin), as the brief asks for mobile; the services array in `content.ts` was reordered to
match (strings unchanged; the manifest check still passes).

## Verification results (this build)

Run on 2026-10-05: `npm run check:manifest && npm run typecheck && npm run lint && npm test` → **45 passed**.

| Area | Result | What was checked |
|---|---|---|
| Manifest vs `.docx` | **Pass** | 31 assertions. |
| Exact copy | **Pass** | All strings verbatim (headline reads as one sentence; only "medical insight" set apart); alternate variants and authoring labels absent; no `text-transform`; em dash and arrows exact. |
| Semantics | **Pass** | header / main (2 sections) / footer, one `h1`, `h2`, three `h3`s named by the logos' alt text, `lang="en"`. |
| Destinations | **Pass** | Exactly `#top`, the three company URLs and `https://www.theguardian.group/`; each company has a tier link, a text link and a footer link to its own URL; QME only in the header; no nested links; no `target`. |
| Activation | **Pass** | At 1440 and 390: clicking inside each tier and each text link navigates to the right site (stubbed). Gaps between tiers, the paper beside the apex and the transparent padding are not links. Tier polygons match the artwork's tiers within 1.5 px at 1440, 1024 and 390. |
| Keyboard | **Pass** | Order: logo → QME → three tiers (top → bottom) → three text links → three footer links; tiers show a 2.5 px charcoal ring on their outline, everything else a 2 px solid outline. |
| Accessible names | **Pass** | Tier links, text links, QME, logo; the pyramid image is decorative (`alt=""`). |
| Overflow | **Pass** | 1440, 1280, 1200, 1024, 768, 390, 360 and 200 % zoom (720 px @2×): no horizontal scroll, nothing clipped. |
| Touch targets | **Pass** | Every link ≥ 44 × 44 at 390 and 360. |
| Motion | **Pass** | Reduced motion: zero animations, all content at full opacity, no arrow travel. Otherwise exactly two animations: the glow's drift (16 s, transform + opacity, on `.hero__glow`) and the one-time glint. Hero layers are `aria-hidden` with `pointer-events: none`. |
| No JS | **Pass** | Copy and links present with JS disabled; no `<script>` in the build. |
| Header | **Pass** | 96 px at 1440, 74 px at 390; `#F7F4EE`; bronze rule; logo unfiltered; QME bronze border, charcoal Cinzel text. |
| Images | **Pass** | 6 images load with reserved dimensions and unchanged aspect ratios; pyramid `object-fit: contain`; layout shift < 0.01; the supplied PNG is served at `/images/guardian-pyramid.png`. |
| axe | **Pass** | No serious or critical violations at 1440, 1024, 390. |
| Composition | **Pass** | Desktop placement, connector heights/ends, logo-on-connector alignment, statement clearance; tablet/mobile: connectors hidden, pyramid centred, descriptions below in top-to-bottom order; hover/focus associations in both directions. |
| Typography | **Pass** | Lora everywhere except the Cinzel QME label; only Cinzel/Lora files (+ the one-glyph arrow supplement) download; all faces `font-display: swap`; Lora upright + italic preloaded; headline two lines at 1440 and 1280 at 58–72 px with line 2 starting "medical insight"; with fonts delayed 1.5 s the heading moves < 2 px and layout shift < 0.01. |
| Contrast | **Pass** | Text link 6.58 : 1, descriptions and statement 6.20, footer 7.47, QME 13.82; on the hero's lighter end (`#252B2D`): headline 12.54, supporting sentence 8.12, quotation 10.10, attribution 5.77, "medical insight" darkest stop 5.53. |
| Destination HEAD requests | **Not run** | This environment's egress policy blocks all four hosts (proxy `403` on CONNECT). Run `node scripts/check-urls.mjs` on an open network. No URL changed. |

Browsers: Chromium only (Playwright). The CSS relies on `:has()`, container query units,
`translate`/`scale` properties, `background-clip: text` (with a solid-colour fallback) and
`text-wrap`, all supported by current Safari, Firefox and Chrome.

## Screenshots (`docs/screenshots/`)

| File | What |
|---|---|
| `compare-before-after-1440.png`, `compare-before-after-first-viewport-1440.png` | Before (previous pass) / after (selected design), desktop |
| `compare-before-after-390.png` | Before / after, mobile |
| `final-full-{1440,1280,1024,768,390,360}.png` | Final full pages (≤ 768 at 2×) |
| `final-first-viewport-1440x900.png`, `final-zoom200-720.png` | First view; 200 % zoom |
| `final-detail-header-hero.png`, `final-detail-glint.png`, `final-detail-selector.png` | 2× close-ups: header→hero transition, the glint on "medical insight", the selector |
| `final-hover-civil-tier-1440.png`, `final-hover-medical-advisory-callout-1440.png` | Hover via tier; hover via description |
| `final-focus-{qme,tier-civil,cta-merlin}-1440.png`, `final-focus-cta-390.png` | Keyboard focus |
| `prev-*.png` | The previous pass's design (baseline for the comparisons) |
| `logo-contact-sheet.png` | Trimmed logos at their display sizes |

## Source issues for the client

1. **`between.la`** — "…Most sit somewhere in between.la" appears in the supplied source
   and is kept as supplied; it looks like a typo for "…in between." (one-line change in
   `src/content.ts`; the manifest check will flag it until the `.docx` is corrected too).
2. **Missing mockup** — the selected full-page mockup was referenced but not attached;
   only the pyramid image was received.
3. **QME placement** — the original document says both "top right" and "separate and
   below"; it is in the header, as this brief specifies.
4. **Logo filenames** — "Medical Advisory Bronze 2" is the white-wordmark (dark background)
   version; "Bronze Inverted" is for light backgrounds.
5. **Merlin has no light-on-dark logo variant** — every logo sits on a light surface (the
   dark hero carries no logos).
6. **Destination redirects** — not checkable from here; run `node scripts/check-urls.mjs`.

## File map

```
src/content.ts                       every visible string (single source of truth), top tier first
src/App.tsx                          page assembly + qmePlacement switch
src/components/Header.tsx            light header, original logo, QME
src/components/Hero.tsx              charcoal hero, background layers, two-line headline
src/components/ServiceSelector.tsx   heading, pyramid image, tier links, connectors, descriptions
src/components/pyramidGeometry.ts    measured tier outlines → normalized polygons + anchors
src/components/Footer.tsx            ivory footer, three links in the supplied order
src/styles/tokens.css                colours (contrast-measured), type, layout tokens
src/styles/global.css                layout, hero atmosphere, composition, states, breakpoints
src/styles/fonts.css                 Lora + Cinzel, the → glyph supplement, metric fallbacks
public/images/guardian-pyramid*.*    the supplied pyramid (PNG) + WebP sizes
scripts/prepare-pyramid.mjs          pyramid WebP sizes + tier outline measurement
tests/site.spec.ts                   Playwright + axe suite (45 checks)
_brief/                              the client's original files, untouched
```

---

# History

The sections below record the two earlier passes. Where they describe the hero, palette,
pyramid drawing or row layout, the selected design above supersedes them.

## Previous pass: visual refinement (Cinzel/Lora, metallic gold, drawn pyramid)

Commit `dfa4121`. Its verification table and screenshots were replaced by this build's.

Brief: *Guardian Group Visual Refinement Prompt* — adopt the Guardian Civil Services
reference's typography and gold, refine the composition, keep scope and copy exact.

**Reference inspection.** `guardiancivil.services` (and its stylesheet
`…/elementor/css/post-7.css`) could not be opened from this environment: the egress policy
blocks the host for the sandbox and for the fetch tool, and archive.org is unreachable too.
The design therefore follows the reference details stated in the brief — Cinzel as the
primary heading family, `#B8915A` as the accent, Lora in components, Georgia in body
settings, a metallic submit button with a narrow diagonal highlight sweep. Nothing was
copied from the reference's layout.

#### Typography

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

#### Gold system

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

#### Composition

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

#### Refinement round (after reviewing the first updated screenshots, `r1-*`)

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

## First pass records (original build, commit `2621897`)

The sections below document the original inspection and plan. Where they describe tokens,
fonts or the pyramid palette, the refinement pass above supersedes them.

### Phase 1 — Inspection findings

Checked with my own tools (Node + sharp pixel scans, a python dump of
`word/document.xml`, and rendered previews of every logo on `#FAF9F6` and `#303942`).

#### Document

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

#### Diagram (`image1.png`)

Apex-up triangle, three equal-height bands (Civil Services top, Medical Advisory middle,
Merlin base); measured base ≈ 544 px vs height ≈ 486 px → width ≈ 1.12 × height.
Grey connectors start 13–22 px beyond each band's right edge and end at a shared
left-aligned text column. Composition used; its wording and blue palette are not.

#### Logos — inventory confirmed visually

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

#### Colours sampled (9×9 opaque-pixel averages) vs the brief

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

#### Font coverage (found during setup)

The self-hosted latin subsets of Inter and Source Serif 4 (Fontsource, Google subsets)
do **not** contain U+2192 `→`, which is part of every CTA. Left alone, the arrow would
render in whatever system font the visitor has. Fix: a 1.5 KB Inter 4.1 file subset to that
single glyph (`src/assets/fonts/inter-arrow-wght.woff2`, OFL licence alongside), declared
as part of the `Inter Variable` family with `unicode-range: U+2192`.

### Phase 2 — Design plan (as written before the first build)

#### Tokens

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

#### Type roles

- **Source Serif 4** (variable, `opsz` axis on, 400/600): H1, H2, company names (600),
  epigraph quote.
- **Inter** (variable, 400/500): subhead, benefit, description, CTA, QME, footer.
- Benefit line: start in Inter 500 at ~17 px, `--ink`; compare with serif by screenshot.

#### Wireframes

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

#### Generic-page tells checked and excluded

No eyebrow labels, no 01/02/03 markers, no cards or soft shadows, no gradients
(option C uses two flat halves, not a blend), no glass/blur/blobs, no stock imagery,
no 3D, no single accented headline word, no pill shapes (radii 0–2 px), no sticky header,
no hero buttons. The `→` stays because it is client copy.

#### Review against the brief (revisions made to this plan)

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
