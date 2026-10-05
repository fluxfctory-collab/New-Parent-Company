# The Guardian Group — gateway page · Handover

A one-page, static gateway for The Guardian Group. The three-tier pyramid is both the
central visual and the navigation: Civil Services at the apex, Medical Advisory in the
middle, Merlin at the foundation. Each tier, its connector and its copy form a single
link to that company's site. QME is a separate, quiet link in the header.

- Vite 8 + React 19 + TypeScript, **prerendered to static HTML**; production ships
  **no JavaScript** (the page has nothing interactive that needs it).
- Plain CSS with tokens; self-hosted Source Serif 4 + Inter (no font CDN).
- All copy comes from `src/content.ts`, verified against the client's `.docx`.
- Original logos only (alpha-trimmed derivatives; originals untouched in `_brief/`).
- Nothing is deployed or published.

## Run it

```bash
npm install            # Node 22+; installs exact pinned versions
npm run dev            # http://localhost:5173 — server-rendered, same markup as production
npm run build          # typecheck → client build (CSS, fonts) → SSR build → dist/index.html
npm run preview        # serves dist/ at http://localhost:4173
npm test               # build, then the Playwright + axe suite (38 checks)
npm run lint           # ESLint (flat config, typescript-eslint)
npm run typecheck      # tsc --noEmit
npm run check:manifest # every string in src/content.ts vs the .docx
npm run logos          # regenerate trimmed logos + favicons from _brief/
node scripts/screenshots.mjs final   # regenerate docs/screenshots/final-*.png (after a build)
node scripts/contact-sheet.mjs       # docs/screenshots/logo-contact-sheet.png
node scripts/check-urls.mjs          # HEAD-check the four destinations (needs open internet)
node scripts/contrast.mjs [#fg #bg]  # WCAG contrast for the token pairs, or one pair
```

Playwright is pinned to 1.56.1 to match the Chromium build pre-installed in this
environment (an `overrides` entry keeps `@axe-core/playwright` on the same core). Elsewhere,
run `npx playwright install chromium` once before `npm test`.

`dist/` is self-contained: `index.html` (≈ 15 KB, 2.4 KB gzipped), one stylesheet
(4 KB gzipped), fonts, logos, favicons. Host it on any static server.

### One-line switches

| What | Where | Values |
|---|---|---|
| QME placement | `src/App.tsx` → `qmePlacement` | `"header"` (current) · `"below-selector"` (screenshot: `docs/screenshots/alt-qme-below-selector-1440.png`) |
| Tier palette | `src/components/ServiceSelector.tsx` → `palette` prop default | `"c"` (current) · `"a"` · `"b"` |
| `between.la` fix | `src/content.ts` → `selector.closingLine` | change `in between.la` to `in between.` |

## Verification results (final build)

Run on 2026-10-05 in this environment: `npm run check:manifest && npm run typecheck && npm run lint && npm test`.

| # | Check | Result | How |
|---|---|---|---|
| — | Manifest vs `.docx` | **Pass** | 31 assertions; service strings are whole consecutive paragraphs inside "Card copy, as it appears". `meta.title` reported as a noted exception (see Phase 1). |
| 1 | Exact copy | **Pass** | Normalised `innerText` contains every manifest string; 7 alternate variants absent; 13 authoring labels absent; no element has a `text-transform`; U+2014 and U+2192 present as code points (3 arrows). One `h1`, the `h2`, three `h3`s, header/main/footer, two sections, `lang="en"`. |
| 2 | Links | **Pass** | Exactly `#top`, the three company URLs and the QME URL; service anchors map to their companies in Merlin → Medical Advisory → Civil Services DOM order; no nested links/buttons in a row; QME only in the header, not in the selector; no `target` attributes. |
| 3 | Click targets | **Pass** | Desktop (1440): clicking the computed centroid of each tier and the centre of each text row navigates to the right URL (outbound requests stubbed with `page.route`). Mobile (390): the centre of each row. Extra: the paper beside the apex is *not* a link — the hit area follows the triangle. |
| 4 | Keyboard | **Pass** | Tab order: parent logo → QME → Merlin → Medical Advisory → Civil Services → three footer links. Every stop has a 2 px solid `#875A2E` outline (desktop service rows draw it on the copy panel). Focus screenshots: `test-results/focus/` per run; curated ones in `docs/screenshots/final-focus-*.png`. |
| 5 | Accessible names | **Pass** | "Explore Merlin", "Guardian Medical Advisory Learn more", "Guardian Civil Services Learn more" (via `aria-labelledby`); each row's description = benefit + description (`aria-describedby`). |
| 6 | Overflow | **Pass** | `scrollWidth ≤ innerWidth` and no text box outside the viewport at 1440, 1280, 1024, 768, 390, 360, and 720 / 640 px at device scale 2 (200 % zoom). |
| 7 | Touch targets | **Pass** | Every link ≥ 44 × 44 at 390 and 360. |
| 8 | Reduced motion | **Pass** | `reducedMotion: 'reduce'`: zero running animations, every element at opacity 1, the arrow doesn't move on hover. With motion allowed: exactly 3 entrance animations, 1 iteration each, all finished by 400 ms, tiers end at opacity 1. |
| 9 | No JS | **Pass** | `javaScriptEnabled: false`: all copy and all links present. The built HTML contains no `<script>` at all. |
| 10 | First viewport | **Pass** | 1440 × 900: H2 top at 533 px, pyramid apex at 629 px. |
| 11 | Images | **Pass** | 5 logos load (WebP via `<picture>`, PNG fallback), all with `width`/`height` matching the rendered ratio (± 0.02), `decoding="async"`, header logo eager; cumulative layout shift < 0.01. |
| 12 | axe | **Pass** | 0 violations of any impact at 1440 and 390 (35 rules pass). axe lists 3 "needs review" contrast items: the aria-hidden `→` glyphs (non-text; their colour is `--bronze-ink`, 5.65 : 1). |
| 13a | Build / typecheck / lint | **Pass** | `vite build` + SSR + prerender; `tsc --noEmit`; ESLint — all clean. |
| 13b | Destination HEAD requests | **Not run** | This environment's egress policy denies all four hosts (the proxy answers 403 to CONNECT for `www.merlin.law`, `www.guardianadvisory.group`, `www.guardiancivil.services`, `www.theguardian.group`). That 403 is the sandbox, not the sites. Run `node scripts/check-urls.mjs` on an open network; it reports status codes and every redirect hop. No URL has been changed. |
| + | Pyramid geometry | **Pass** | At 1440, 1280 and 1024: three bands of equal height with no gaps, the same width and x (one continuous triangle); every connector exactly at its band's vertical middle; copy (and company names) share one left edge; at ≥ 1280 each connector meets its logo's vertical centre (± 1.5 px); desktop stacks the DOM order bottom-to-top. |

## Design decisions

**Palette — option C, "helmet split" (subtle).** All three options were built and compared
at 1440 (`docs/screenshots/final-palettes-side-by-side-1440.png`, individual shots
`final-palette-{a,b,c}-1440.png`).
- A (weighted foundation) is stable, but it makes the apex — the specialist tier — the
  palest and weakest-looking band, which argues against "Few warrant a specialist".
- B (ascending concentration) is the calmest and makes the right argument: concentration
  rises to a solid bronze apex.
- C keeps B's logic (tone deepens toward the apex) and adds the one device that is
  unmistakably this client's: the parent helmet's warm-bronze left / cool-graphite right
  split. The pyramid reads as part of the Guardian identity rather than a generic
  diagram, and the header logo and the pyramid now echo each other.
  A first, darker C was too heavy (it read as a chart), so it was redone in pale → mid →
  deep tones. Pale bands get 1 px strokes in their half's colour (`--bronze` 4.37 : 1,
  `--graphite-2` 4.30 : 1); the apex fills are ≥ 4.37 : 1 on their own. No gradients,
  no shadows. Risk: a viewer could read left/right as a meaningful split. B is a
  one-attribute switch if the client prefers the plainer reading.

**Type.** Source Serif 4 (optical sizing on) at 400 for the H1, H2 and closing line, 600 for
company names, 400 italic for the epigraph; Inter 400/500 for everything functional.
Benefit lines are Inter 500 in `--ink`. Compared by screenshot against Source Serif at
19 px (`final-benefit-inter-vs-serif-1440.png`): the serif version wraps Civil Services'
benefit onto two lines at the same column width (taller rows → steeper pyramid) and
blurs into the serif company name; Inter keeps the name → benefit step distinct. H1 is three balanced lines at
1024–1440 (`max-width: 14em`, `text-wrap: balance`); measures use `em` instead of `ch`
because `ch` resolves against whichever font has loaded and shifted the subhead's wrap
between captures.

**Logo normalisation.** Measured, not guessed: GUARDIAN cap-height is 35.2 % of the
trimmed sub-brand logos, MERLIN 36.8 % of the trimmed Merlin logo, so Merlin needs to be
*smaller* than the brief's 42–44 px starting value to avoid dominating. Final: Guardian
sub-brands 36 px / Merlin 38 px (≥ 1280), 32 / 34 px (1000–1279), 30 / 32 px (mobile);
parent 40 px header, 30 px mobile header, 28 / 26 px footer. Merlin's taller shield and
tiny tagline give it less mass per pixel, hence the +2 px. Contact sheet:
`docs/screenshots/logo-contact-sheet.png`.

**Pyramid geometry.** Each tier is its own inline SVG (`viewBox 0 0 600 100`,
`preserveAspectRatio="none"`, non-scaling strokes) using the brief's points; rows use
`grid-template-rows: repeat(3, minmax(var(--band-h), 1fr))`, which equalises all three to
the tallest content, so the slanted edges always meet. Seams: one 1.5 px paper line drawn
once by the band above. `--pyr-w` is computed from the content width with container-query
units so the copy column never drops below ≈ 470 px (the longest benefit line is 463 px):
width/height ≈ **1.08 at 1440, 1.05 at 1280, 0.86 at 1024, 0.82 at 1000** (client diagram:
1.12). Below ≈ 1250 px the copy can't get narrower without wrapping, so the pyramid gets
steeper rather than the text smaller. Hit areas follow the shapes: the anchor has
`pointer-events: none`; the painted polygons, the connector zone and the copy column
re-enable it.

**Row anatomy.** ≥ 1280: a logo column the connector runs into, logo centred on the
band's middle, copy centred beside it (the brief's "logo's vertical centre" option).
1000–1279: there isn't room for a logo column, so the logo sits in a fixed 119 px slot
on the company name's line and the copy spans below; connectors still sit at band
middle and meet the copy block's centre (the client diagram's own arrangement).

**DOM order.** Merlin → Medical Advisory → Civil Services everywhere (reading, tab and
screen-reader order follow "every case rests on the record"); desktop places them
bottom-to-top with `grid-row`.

**States.** Hover and `:focus-visible` share one treatment: tier one tone deeper,
connector turns bronze and reaches 8 px closer to the tier, a faint bronze-wash tint
behind the copy (drawn outside the box, so nothing moves), CTA underline at 4 px offset,
arrow 3 px right. Nothing is dimmed. Keyboard focus adds a 2 px `--bronze-ink` ring; on
desktop rows it surrounds the tint (offset 12 px, square corners) instead of the brief's
4 px, because a 4 px ring inside a tinted area read as a second box.

**Motion.** One moment: tiers settle in foundation → middle → apex (opacity + 6 px,
280 ms, 60 ms stagger, done by 400 ms). CSS only, so nothing depends on JS; reduced motion
removes it and the arrow travel, and shortens colour transitions to 80 ms.

**Mobile (< 1000 px).** Under the H2, a 140–180 px overview pyramid (decorative,
`aria-hidden`), then three full-width rows separated by hairlines, in DOM order. Each row
has a 32 px glyph — the pyramid as a hairline silhouette with that row's own tier
filled — next to its logo, so the row maps to its level in the overview. The breakpoint
is 1000 px rather than ≈ 960 because at 960 the composition's pyramid drops to 0.75.

**Removed before finishing.** A paper hairline down the pyramid's centre (an echo of the
gap between the helmet halves). It turned three levels into six tiles; without it, the
bands read first and the warm/cool split stays a quiet brand note.

### Other decisions recorded

- **QME accessible name**: visible text "QME"; `aria-label="QME (legacy site)"` (starts with
  the visible label). The label is not visible copy, but it is my wording — remove it if
  the client prefers no added words even for assistive tech.
- **Footer**: parent logo (plain image, not a link) + the three company names as a list.
  QME is not repeated there.
- **Header** is not sticky; no skip link (only two links precede the content).
- **Favicons**: helmet mark padded to a transparent square (`favicon.ico` 16+32,
  `favicon-32.png`, `favicon-512.png`). The 180 px `apple-touch-icon.png` sits on the
  page's paper colour instead of transparency, because iOS paints transparent touch
  icons on black.
- **Arrow glyph**: the Google-derived latin font subsets omit `→`; a 1.5 KB Inter subset
  with only that glyph is declared in the same family (`unicode-range: U+2192`), so the
  arrow renders in Inter everywhere.
- **Content-max** stays 1200 px; all tokens are the brief's values (palette tones are
  additions, each contrast-checked).

## Source issues for the client

1. **`between.la`** — the closing line ends "…somewhere in between.la". Kept verbatim, as
   instructed; no warning on the page. Proposed fix: "Every case rests on the record. Few
   warrant a specialist. Most sit somewhere in between." — a one-line change in
   `src/content.ts` (`selector.closingLine`). The manifest check will then flag the
   mismatch until the `.docx` is corrected too.
2. **QME placement conflict** — the document says "sits apart top right corner" and
   "Separate from the three cards button in the top right corner", then "The QME button
   stays where it is, separate and below." Current choice: top-right of the header ("stays
   where it is"). Alternative: `qmePlacement = "below-selector"` in `src/App.tsx` puts it
   under the closing line, outside the pyramid.
3. **Logo filenames are misleading** — "Medical Advisory **Bronze 2**" has a *white*
   wordmark (dark backgrounds only); "Medical Advisory **Bronze Inverted**" is the one for
   light backgrounds. Worth renaming at the source.
4. **Merlin has no light-on-dark variant** — the PNG is dark-on-transparent and the JPEG
   (`Final_logo_01-01.jpg - White_`, no extension) is on an opaque white box. That is why
   every logo on this page sits on paper. Request a reversed Merlin if a dark section is
   ever wanted.
5. **Destination redirects** — could not be checked from this environment (egress policy;
   see 13b). Run `node scripts/check-urls.mjs` and report any redirect to the client;
   don't change URLs because of one.
6. **Page title** — the document doesn't state one; "The Guardian Group" is used (organisation
   name). The meta description reuses the subhead verbatim.

## Screenshots (`docs/screenshots/`)

| File | What |
|---|---|
| `final-full-{1440,1280,1024,768,390,360}.png` | Full page at each test width (≤ 768 at 2×) |
| `final-first-viewport-1440x900.png` | First viewport rule |
| `final-zoom200-720.png`, `final-zoom200-640.png` | 200 % zoom emulation (device scale 2) |
| `final-hover-medical-advisory-1440.png`, `final-hover-civil-tier-1440.png` | Hover via copy, hover via tier |
| `final-focus-{logo,qme,merlin,civil}-1440.png`, `final-focus-merlin-390.png` | Keyboard focus |
| `final-palette-{a,b,c}-1440.png`, `final-palettes-side-by-side-1440.png` | Palette options |
| `final-benefit-inter-vs-serif-1440.png` | Benefit line: Inter 500 (chosen) vs Source Serif |
| `v1-*.png` | First build, same widths |
| `compare-v1-final-{1440,1024,390}.png` | v1 vs final side by side |
| `logo-contact-sheet.png` | Trimmed logos at display sizes on paper |
| `alt-qme-below-selector-1440.png` | The QME alternative placement |

## v1 → final (Phase 5 review)

Two review rounds against the brief's rubric; screenshots `compare-v1-final-*.png`.

| Found in v1 | Change |
|---|---|
| H1 broke into 4 lines at 1440 (`max-width: 19ch` too narrow for a 68 px serif) | `max-width: 14em` inside columns 1–8 → 3 balanced lines at 1000–1440 |
| Copy column only ≈ 425 px, so benefit lines wrapped, rows grew to ≈ 205 px and the pyramid became a spire (0.89 at 1440, 0.65 at 1024) | Pyramid width derived from the content width (container units) to keep the copy ≥ 470 px; tighter row padding; separate row anatomy for 1000–1279. Now 1.08 / 1.05 / 0.86 |
| Palette C (dark bronze/graphite blocks) dominated the page and read like a chart | Re-toned pale → mid → deep with per-half strokes; chosen after a side-by-side with A and B |
| Six-tile look from the centre hairline | Removed (the "one unnecessary detail") |
| Closing line wrapped under the pyramid | `max-width: 44em` → one line on desktop |
| Mobile glyphs: muted tiers filled `--rule`, darker than palette C's pale foundation, so Merlin's glyph didn't show its tier | Muted tiers are now an outline silhouette; the row's own tier is the only fill |
| 960–999 px was cramped (0.75) | Mobile layout below 1000 px |
| 1000–1279: company names started at different x (auto-width logo slot) | Fixed 119 px logo slot; covered by the geometry test |
| Focus ring picked up a 14 px rounded corner (outline radius = border-radius + offset) | Panel has no radius; global focus rule doesn't add one |
| Subhead wrap changed between captures (`ch` resolved before fonts loaded) | Measures in `em` |
| Epigraph broke after "is" at 1024 (three 56 px columns) | Columns 9–12 between 1000 and 1279; 10–12 from 1280 |

## Known limits

- Tested in Chromium only (Playwright); no Safari/Firefox runs were available here. The
  CSS uses container query units, `color-mix()`, `text-wrap: balance/pretty` and
  `:is()`, all supported by current Safari, Firefox and Chrome; `text-wrap` degrades to
  normal wrapping.
- Between 1000 and ≈ 1250 px the pyramid is steeper than the client diagram (down to 0.82).
- Destination URLs were not reachable from this environment (13b).

## File map

```
src/content.ts                  every visible string (single source of truth)
src/App.tsx                     page assembly + qmePlacement switch
src/components/                 Header, Hero, ServiceSelector (tiers, connectors, rows,
                                overview, glyphs), Footer, Logo, QmeLink
src/styles/tokens.css           tokens + tier palettes A/B/C
src/styles/global.css           layout, states, breakpoints, motion
src/styles/fonts.css            self-hosted fonts + the → glyph subset
src/assets/logos/               trimmed derivatives + generated logos.ts (sizes)
src/entry-server.tsx            renderToStaticMarkup(<App />)
src/entry-client.ts             CSS entry only; stripped from the build
scripts/prerender.mjs           injects markup, strips JS, preloads the serif
scripts/prepare-logos.mjs       alpha-threshold trim, margin, WebP/PNG, favicons
scripts/check-manifest.mjs      content.ts vs the .docx
scripts/{screenshots,contact-sheet,contrast,check-urls}.mjs
tests/site.spec.ts              Playwright + axe suite
_brief/                         the client's files, untouched
docs/screenshots/               review captures
```

---

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

## Phase 2 — Design plan (as written before building; see "v1 → final" for what changed)

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
