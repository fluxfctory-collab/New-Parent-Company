import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";
import { PYRAMID } from "../src/components/pyramidGeometry";

/*
 * Verification suite for the gateway page. Outbound navigation is intercepted, so nothing
 * here depends on the network.
 */

const SERVICE_URLS = content.services.map((s) => s.href); // apex-first: CS, MA, Merlin
const IDS = content.services.map((s) => s.id);
const EXTERNAL = new RegExp(
  "^https://www\\.(merlin\\.law|guardianadvisory\\.group|guardiancivil\\.services|theguardian\\.group)/",
);

/** Stub the four destinations; block everything else that isn't localhost. */
async function interceptOutbound(page: Page) {
  await page.route(EXTERNAL, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>stub</title>" }),
  );
  await page.route(/^https?:\/\/(?!localhost)/, (route) => {
    if (EXTERNAL.test(route.request().url())) return route.fallback();
    return route.abort();
  });
}

async function open(page: Page, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await interceptOutbound(page);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
}

const normalise = (s: string) => s.replace(/\s+/g, " ").trim();

const COPY = [
  content.hero.headline,
  content.hero.subhead,
  content.hero.epigraph.quote,
  content.hero.epigraph.attribution,
  content.selector.heading,
  content.selector.closingLine,
  content.qme.label,
  ...content.services.flatMap((s) => [s.name, s.benefit, s.description, s.cta]),
];

const ALTERNATE_VARIANTS = [
  "Specialists who hold up under challenge",
  "Lower-cost generalist opinion on causation",
  "Board-certified experts for trial cases",
  "Medical record intelligence underneath every case",
  "Match the level of medical support",
  "Board-certified specialists for trial cases and evaluations",
  "Lower-cost generalist opinion for matters that settle",
];

const AUTHORING_LABELS = [
  "Headline",
  "Subhead",
  "The epigraph",
  "The cards",
  "Card copy, as it appears",
  "The QME button",
  "The pyramid",
  "Using it on the page",
  "Goes to",
  "Line under the name",
  "One line of detail",
  "Heading above it",
  "Line beneath it",
];

/** Measured tier outlines (pixels of the 1254 × 1254 artwork), as in pyramidGeometry.ts. */
const OUTLINE_PX = {
  "civil-services": { top: 67, bottom: 571, left: 321.4, right: 918.6 },
  "medical-advisory": { top: 583, bottom: 877, left: 161, right: 1084.9 },
  merlin: { top: 889, bottom: 1190, left: -5.6, right: 1256 },
} as const;

test.describe("1 · exact copy", () => {
  test("every manifest string is on the page, verbatim", async ({ page }) => {
    await open(page);
    const text = normalise(await page.locator("body").innerText());
    for (const s of COPY) expect(text, `missing: ${s}`).toContain(s);
    expect(await page.title()).toBe(content.meta.title);
    expect(await page.locator('meta[name="description"]').getAttribute("content")).toBe(content.meta.description);
    // The headline reads as one sentence, with only "medical insight" set apart.
    expect(normalise(await page.locator("h1").innerText())).toBe(content.hero.headline);
    await expect(page.locator(".hero__em")).toHaveText("medical insight");
  });

  test("alternate wordings and authoring labels are absent", async ({ page }) => {
    await open(page);
    const text = await page.locator("body").innerText();
    for (const s of ALTERNATE_VARIANTS) expect(text, `alternate variant present: ${s}`).not.toContain(s);
    for (const s of AUTHORING_LABELS) expect(text, `authoring label present: ${s}`).not.toContain(s);
  });

  test("no text-transform anywhere; em dash and arrow are the exact code points", async ({ page }) => {
    await open(page);
    const transformed = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((el) => getComputedStyle(el).textTransform !== "none")
        .map((el) => el.outerHTML.slice(0, 80)),
    );
    expect(transformed).toEqual([]);
    const html = await page.content();
    expect(html).toContain("— Francis Bacon");
    expect(html).toContain("Services —</span> record analysis");
    expect((html.match(/→/g) ?? []).length).toBe(3);
  });

  test("semantics: one h1, the h2, a logo heading per company; landmarks and lang", async ({ page }) => {
    await open(page);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h2")).toHaveText([content.selector.heading]);
    const h3 = page.getByRole("heading", { level: 3 });
    await expect(h3).toHaveCount(3);
    for (const [i, s] of content.services.entries()) await expect(h3.nth(i)).toHaveAccessibleName(s.name);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("body > header, body > main, body > footer")).toHaveCount(3);
    await expect(page.locator("main > section")).toHaveCount(2);
  });
});

test.describe("2 · links and destinations", () => {
  test("exactly the expected destinations, same-tab", async ({ page }) => {
    await open(page);
    const hrefs = await page.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(new Set(hrefs)).toEqual(new Set(["#top", content.qme.href, ...SERVICE_URLS]));
    await expect(page.locator("a[target]")).toHaveCount(0);
  });

  test("each company has a tier link, a text link and a footer link to its own site", async ({ page }) => {
    await open(page);
    for (const s of content.services) {
      await expect(page.locator(`.tier-link--${s.id}`)).toHaveAttribute("href", s.href);
      await expect(page.locator(`.callout--${s.id} .callout__cta`)).toHaveAttribute("href", s.href);
      await expect(page.locator(".site-footer a", { hasText: s.name })).toHaveAttribute("href", s.href);
    }
    // No nested links anywhere.
    await expect(page.locator("a a")).toHaveCount(0);
    // Footer order as supplied.
    await expect(page.locator(".site-footer__links a")).toHaveText(["Merlin", "Guardian Medical Advisory", "Guardian Civil Services"]);
  });

  test("QME goes to the legacy site, sits in the header and nowhere in the selector", async ({ page }) => {
    await open(page);
    const qme = page.locator(`a[href="${content.qme.href}"]`);
    await expect(qme).toHaveCount(1);
    await expect(qme).toHaveText(content.qme.label);
    await expect(page.locator(`header a[href="${content.qme.href}"]`)).toHaveCount(1);
    await expect(page.locator(`.selector-section a[href="${content.qme.href}"]`)).toHaveCount(0);
  });
});

test.describe("3 · activation", () => {
  // Points well inside each tier's outline (triangle: 2/3 down; trapezoids: 55 % down).
  const inside = (id: keyof typeof OUTLINE_PX) => {
    const o = OUTLINE_PX[id];
    const t = id === "civil-services" ? 2 / 3 : 0.55;
    return { x: 0.5, y: (o.top + (o.bottom - o.top) * t) / PYRAMID.height };
  };

  for (const width of [1440, 390]) {
    for (const s of content.services) {
      test(`${width}: the ${s.tier} tier and the text link both open ${s.href}`, async ({ page }) => {
        await open(page, width, 1000);
        const img = page.locator(".pyramid__image");
        await img.scrollIntoViewIfNeeded();
        const box = (await img.boundingBox())!;
        const c = inside(s.id);
        await page.mouse.click(box.x + box.width * c.x, box.y + box.height * c.y);
        await page.waitForURL(s.href);
        await page.goto("/");
        const cta = page.locator(`.callout--${s.id} .callout__cta`);
        await cta.scrollIntoViewIfNeeded();
        await cta.click();
        await page.waitForURL(s.href);
      });
    }
  }

  test("the gaps between tiers and the transparent padding are not links", async ({ page }) => {
    await open(page, 1440, 1100);
    const img = page.locator(".pyramid__image");
    await img.scrollIntoViewIfNeeded();
    const box = (await img.boundingBox())!;
    const probes = [
      [0.5, (571 + 583) / 2 / PYRAMID.height], // gap apex / middle
      [0.5, (877 + 889) / 2 / PYRAMID.height], // gap middle / foundation
      [0.2, 0.25], // beside the apex
      [0.5, 0.02], // padding above the tip
    ];
    for (const [fx, fy] of probes) {
      const hit = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.getAttribute("href") ?? null,
        [box.x + box.width * fx, box.y + box.height * fy],
      );
      expect(hit, `probe ${fx},${fy}`).toBeNull();
    }
  });

  test("tier hit regions sit exactly on the artwork's tiers at every size", async ({ page }) => {
    for (const width of [1440, 1024, 390]) {
      await open(page, width, 1000);
      const img = (await page.locator(".pyramid__image").boundingBox())!;
      expect(Math.abs(img.width / img.height - PYRAMID.width / PYRAMID.height)).toBeLessThan(0.005); // never stretched
      for (const id of IDS) {
        const poly = (await page.locator(`.tier-link--${id} polygon`).boundingBox())!;
        const o = OUTLINE_PX[id];
        const sx = img.width / PYRAMID.width;
        const sy = img.height / PYRAMID.height;
        expect(Math.abs(poly.x - (img.x + o.left * sx))).toBeLessThan(1.5);
        expect(Math.abs(poly.x + poly.width - (img.x + o.right * sx))).toBeLessThan(1.5);
        expect(Math.abs(poly.y - (img.y + o.top * sy))).toBeLessThan(1.5);
        expect(Math.abs(poly.y + poly.height - (img.y + o.bottom * sy))).toBeLessThan(1.5);
      }
    }
  });
});

test.describe("4 · keyboard", () => {
  test("tab order and a visible focus indicator on every stop", async ({ page }) => {
    await open(page, 1440, 1300);
    mkdirSync("test-results/focus", { recursive: true });
    const footer = ["https://www.merlin.law/", "https://www.guardianadvisory.group/", "https://www.guardiancivil.services/"];
    const expected = ["#top", content.qme.href, ...SERVICE_URLS, ...SERVICE_URLS, ...footer];
    for (const [i, href] of expected.entries()) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as Element;
        const isTier = el.matches(".tier-link");
        const target = isTier ? el.querySelector("polygon")! : el;
        const cs = getComputedStyle(target);
        return {
          href: el.getAttribute("href"),
          kind: isTier ? "tier" : "link",
          outline: cs.outlineStyle,
          outlineWidth: parseFloat(cs.outlineWidth),
          stroke: cs.stroke,
          strokeWidth: parseFloat(cs.strokeWidth),
        };
      });
      expect(info.href, `tab stop ${i + 1}`).toBe(href);
      if (info.kind === "tier") {
        // The ring follows the tier's outline: a charcoal stroke on its polygon.
        expect(info.stroke).toBe("rgb(29, 35, 38)");
        expect(info.strokeWidth).toBeGreaterThanOrEqual(2);
      } else {
        expect(info.outline, `outline at stop ${i + 1}`).toBe("solid");
        expect(info.outlineWidth).toBeGreaterThanOrEqual(2);
      }
      await page.screenshot({ path: `test-results/focus/stop-${i + 1}.png` });
    }
  });
});

test.describe("5 · accessible names", () => {
  test("tier links, text links and logos are named for their companies", async ({ page }) => {
    await open(page);
    await expect(page.locator(".tier-link--civil-services")).toHaveAccessibleName("Guardian Civil Services — top tier of the pyramid");
    await expect(page.locator(".tier-link--medical-advisory")).toHaveAccessibleName("Guardian Medical Advisory — middle tier of the pyramid");
    await expect(page.locator(".tier-link--merlin")).toHaveAccessibleName("Merlin — foundation tier of the pyramid");
    await expect(page.locator(".callout--civil-services .callout__cta")).toHaveAccessibleName("Learn more Guardian Civil Services");
    await expect(page.locator(".callout--medical-advisory .callout__cta")).toHaveAccessibleName("Learn more Guardian Medical Advisory");
    await expect(page.locator(".callout--merlin .callout__cta")).toHaveAccessibleName("Explore Merlin");
    await expect(page.getByRole("link", { name: /^QME/ })).toHaveCount(1);
    await expect(page.getByRole("link", { name: content.meta.title })).toHaveCount(1);
    // The pyramid image itself is decorative: its meaning is in the links and the text.
    await expect(page.locator(".pyramid__image")).toHaveAttribute("alt", "");
  });
});

test.describe("6 · overflow", () => {
  const sizes = [
    { width: 1440, height: 900, scale: 1 },
    { width: 1280, height: 800, scale: 1 },
    { width: 1200, height: 800, scale: 1 },
    { width: 1024, height: 768, scale: 1 },
    { width: 768, height: 1024, scale: 1 },
    { width: 390, height: 844, scale: 1 },
    { width: 360, height: 740, scale: 1 },
    { width: 720, height: 450, scale: 2 }, // 1440×900 at 200 % zoom
  ];
  for (const { width, height, scale } of sizes) {
    test(`no horizontal scroll or clipping at ${width}×${height} @${scale}x`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
      const page = await context.newPage();
      await interceptOutbound(page);
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      expect(sw).toBeLessThanOrEqual(iw);
      const outside = await page.evaluate(() =>
        [...document.querySelectorAll("h1, h2, h3, p, figcaption, a, img")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.left < -0.5 || r.right > window.innerWidth + 0.5);
          })
          .map((el) => el.outerHTML.slice(0, 60)),
      );
      expect(outside).toEqual([]);
      await context.close();
    });
  }
});

test.describe("7 · touch targets", () => {
  for (const width of [390, 360]) {
    test(`every link is at least 44×44 at ${width}`, async ({ page }) => {
      await open(page, width, 800);
      const small = await page.locator("a").evaluateAll((as) =>
        as
          .map((a) => ({ href: a.getAttribute("href"), r: a.getBoundingClientRect() }))
          .filter(({ r }) => r.width < 44 || r.height < 44)
          .map(({ href, r }) => `${href} ${r.width.toFixed(0)}×${r.height.toFixed(0)}`),
      );
      expect(small).toEqual([]);
    });
  }
});

test.describe("8 · motion", () => {
  test("reduced motion: nothing animates and all content is fully visible", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await interceptOutbound(page);
    await page.goto("/");
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    const faded = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((el) => !el.closest("[aria-hidden='true']")) // decorative layers and connectors
        .filter((el) => parseFloat(getComputedStyle(el).opacity) < 1)
        .map((el) => el.tagName),
    );
    expect(faded).toEqual([]);
    await page.locator(".callout--medical-advisory .callout__cta").hover();
    expect(await page.locator(".callout--medical-advisory .callout__arrow").evaluate((el) => getComputedStyle(el).transform)).toBe("none");
    await context.close();
  });

  test("motion allowed: only the one-time glint on “medical insight”; the hero background is still", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await interceptOutbound(page);
    await page.goto("/");
    const anims = await page.evaluate(() =>
      document.getAnimations().map((a) => {
        const effect = a.effect as KeyframeEffect;
        const t = effect.getComputedTiming();
        const props = new Set(
          effect.getKeyframes().flatMap((k) => Object.keys(k).filter((p) => !["offset", "computedOffset", "easing", "composite"].includes(p))),
        );
        return {
          name: (a as CSSAnimation).animationName,
          target: (effect.target as Element).className,
          iterations: t.iterations,
          duration: Number(t.duration),
          props: [...props],
        };
      }),
    );
    const glint = anims.filter((a) => a.name === "em-glint");
    expect(glint).toHaveLength(1);
    expect(glint[0].target).toContain("hero__em");
    expect(glint[0].iterations).toBe(1);
    expect(anims).toHaveLength(1); // nothing else moves, nothing loops
    await context.close();
  });

  test("hero background layers are decorative and never intercept the pointer", async ({ page }) => {
    await open(page);
    const layers = await page.locator(".hero__atmosphere, .hero__atmosphere > *").evaluateAll((els) =>
      els.map((el) => ({ pe: getComputedStyle(el).pointerEvents, hidden: !!el.closest("[aria-hidden='true']") })),
    );
    expect(layers.length).toBe(4); // wrapper, plates (SVG), shade, grain
    for (const l of layers) expect(l).toEqual({ pe: "none", hidden: true });
  });
});

test.describe("9 · no JavaScript", () => {
  test("all copy and links are present with JS disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    const text = normalise(await page.locator("body").innerText());
    for (const s of COPY) expect(text).toContain(s);
    for (const href of [...SERVICE_URLS, content.qme.href]) {
      expect(await page.locator(`a[href="${href}"]`).count()).toBeGreaterThan(0);
    }
    await context.close();
  });

  test("the built page ships no script", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).not.toMatch(/<script/i);
  });
});

test.describe("10 · header", () => {
  test("light header: ivory, bronze rule, unfiltered original logo, outlined QME", async ({ page }) => {
    for (const [width, min, max] of [[1440, 88, 104], [390, 70, 80]] as const) {
      await open(page, width, 900);
      const header = page.locator(".site-header");
      const box = (await header.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(min);
      expect(box.height).toBeLessThanOrEqual(max);
      const s = await header.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderBottomColor }));
      expect(s.bg).toBe("rgb(247, 244, 238)");
      expect(s.border).toBe("rgba(184, 145, 90, 0.55)");
      expect(await page.locator(".site-header__logo img").evaluate((img) => getComputedStyle(img).filter)).toBe("none");
      const qme = await page.locator("header .qme").evaluate((el) => ({
        border: getComputedStyle(el).borderTopColor,
        color: getComputedStyle(el).color,
        font: getComputedStyle(el).fontFamily,
      }));
      expect(qme.border).toBe("rgb(184, 145, 90)");
      expect(qme.color).toBe("rgb(36, 38, 41)");
      expect(qme.font).toMatch(/^"Cinzel Variable"/);
    }
  });
});

test.describe("11 · images", () => {
  test("logos and the pyramid load, keep their proportions and cause no layout shift", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await open(page, 1440, 900);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState("networkidle");
    const imgs = await page.locator("img").evaluateAll((els) =>
      (els as HTMLImageElement[]).map((img) => ({
        src: img.currentSrc,
        ok: img.complete && img.naturalWidth > 0,
        attrRatio: Number(img.getAttribute("width")) / Number(img.getAttribute("height")),
        naturalRatio: img.naturalWidth / img.naturalHeight,
        renderRatio: img.getBoundingClientRect().width / img.getBoundingClientRect().height,
        fit: getComputedStyle(img).objectFit,
      })),
    );
    expect(imgs.length).toBe(6); // header + three company logos + footer + pyramid
    for (const img of imgs) {
      expect(img.ok, img.src).toBe(true);
      expect(Math.abs(img.attrRatio - img.renderRatio), img.src).toBeLessThan(0.02);
      expect(Math.abs(img.naturalRatio - img.renderRatio), img.src).toBeLessThan(0.02);
      expect(img.src).toMatch(/\.webp$/);
    }
    expect(imgs.find((i) => i.src.includes("guardian-pyramid"))!.fit).toBe("contain");
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThan(0.01);
  });

  test("the supplied pyramid file is served as-is", async ({ request }) => {
    const res = await request.get("/images/guardian-pyramid.png");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("12 · axe", () => {
  for (const width of [1440, 1024, 390]) {
    test(`no serious or critical violations at ${width}`, async ({ page }) => {
      await open(page, width, 900);
      const results = await new AxeBuilder({ page }).analyze();
      const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});

test.describe("selector composition", () => {
  test("desktop: Medical Advisory left, Civil Services upper right, Merlin lower right; connectors exact", async ({ page }) => {
    for (const width of [1440, 1280, 1200]) {
      await open(page, width, 1100);
      const g = await page.evaluate(() => {
        const img = document.querySelector(".pyramid__image")!.getBoundingClientRect();
        const rect = (sel: string) => document.querySelector(sel)!.getBoundingClientRect();
        return {
          img: { x: img.x, y: img.y, w: img.width, h: img.height },
          statementTop: rect(".selector__statement").top,
          rows: ["civil-services", "medical-advisory", "merlin"].map((id) => {
            const c = rect(`.connector--${id}`);
            const callout = rect(`.callout--${id}`);
            const logo = rect(`.callout--${id} .callout__logo img`);
            return {
              id,
              display: getComputedStyle(document.querySelector(`.connector--${id}`)!).display,
              c: { l: c.left, r: c.right, y: c.top + c.height / 2 },
              callout: { l: callout.left, r: callout.right, t: callout.top, b: callout.bottom },
              logoMid: logo.top + logo.height / 2,
            };
          }),
        };
      });
      const [cs, ma, me] = g.rows;
      // Placement around the pyramid.
      expect(ma.callout.r).toBeLessThan(g.img.x);
      expect(cs.callout.l).toBeGreaterThan(g.img.x + g.img.w);
      expect(me.callout.l).toBeGreaterThan(g.img.x + g.img.w);
      expect(cs.callout.b).toBeLessThan(me.callout.t);
      // Connector heights = tier mid-heights = logo centres.
      const mid = (top: number, bottom: number) => g.img.y + ((top + bottom) / 2 / PYRAMID.height) * g.img.h;
      const expectedY = IDS.map((id) => mid(OUTLINE_PX[id].top, OUTLINE_PX[id].bottom));
      g.rows.forEach((r, i) => {
        expect(r.display).toBe("block");
        expect(Math.abs(r.c.y - expectedY[i]), `${r.id} connector height`).toBeLessThan(1.5);
        expect(Math.abs(r.logoMid - r.c.y), `${r.id} logo on connector`).toBeLessThan(1.5);
      });
      // Connector ends: 10 px off the tier's edge, 12 px short of the description.
      const sx = g.img.w / PYRAMID.width;
      const edge = (x0: number, x1: number) => g.img.x + ((x0 + x1) / 2) * sx; // edge x at mid-height
      expect(Math.abs(cs.c.l - (edge(627, 918.6) + 10))).toBeLessThan(1.5); // tip → bottom-right corner
      expect(Math.abs(me.c.l - (edge(1091.4, 1256) + 10))).toBeLessThan(1.5);
      expect(Math.abs(ma.c.r - (edge(328.5, 161) - 10))).toBeLessThan(1.5);
      expect(Math.abs(cs.c.r - (cs.callout.l - 12))).toBeLessThan(1.5);
      expect(Math.abs(me.c.r - (me.callout.l - 12))).toBeLessThan(1.5);
      expect(Math.abs(ma.c.l - (ma.callout.r + 12))).toBeLessThan(1.5);
      // The statement clears every description.
      for (const r of g.rows) expect(g.statementTop).toBeGreaterThan(r.callout.b + 24);
    }
  });

  test("tablet and mobile: connectors hidden, descriptions below the pyramid, top tier first", async ({ page }) => {
    for (const width of [1024, 768, 390]) {
      await open(page, width, 1000);
      const r = await page.evaluate(() => {
        const img = document.querySelector(".pyramid__image")!.getBoundingClientRect();
        return {
          imgBottom: img.bottom,
          imgCentre: img.left + img.width / 2,
          vw: document.documentElement.clientWidth,
          connectors: [...document.querySelectorAll(".connector")].map((c) => getComputedStyle(c).display),
          callouts: [...document.querySelectorAll(".callout")].map((c) => {
            const b = c.getBoundingClientRect();
            return { id: [...c.classList].find((k) => /^callout--(?!left|right)/.test(k))!.slice(9), top: b.top };
          }),
        };
      });
      expect(new Set(r.connectors)).toEqual(new Set(["none"]));
      expect(Math.abs(r.imgCentre - r.vw / 2)).toBeLessThan(2);
      for (const c of r.callouts) expect(c.top).toBeGreaterThan(r.imgBottom);
      expect(r.callouts.map((c) => c.id)).toEqual(IDS);
      if (width < 960) {
        expect(r.callouts[0].top).toBeLessThan(r.callouts[1].top);
        expect(r.callouts[1].top).toBeLessThan(r.callouts[2].top);
      }
    }
  });

  test("hover and focus associate a tier, its connector and its description", async ({ page }) => {
    await open(page, 1440, 1100);
    const state = (id: string) =>
      page.evaluate(
        (id) => ({
          connector: getComputedStyle(document.querySelector(`.connector--${id}`)!).backgroundColor,
          underline: getComputedStyle(document.querySelector(`.callout--${id} .callout__cta-label`)!).backgroundSize,
          tierFill: getComputedStyle(document.querySelector(`.tier-link--${id} polygon`)!).fill,
        }),
        id,
      );
    const rest = await state("civil-services");
    expect(rest.connector).toBe("rgb(184, 145, 90)");
    expect(rest.underline).toBe("100% 1px");
    const img = page.locator(".pyramid__image");
    await img.scrollIntoViewIfNeeded();
    const box = (await img.boundingBox())!;
    // Pointing at the tier lights its connector and its description's link.
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3);
    await page.waitForTimeout(350);
    const viaTier = await state("civil-services");
    expect(viaTier.connector).toBe("rgb(138, 100, 56)");
    expect(viaTier.underline).toBe("100% 2px");
    // Pointing at a description lights its tier and its connector.
    await page.locator(".callout--medical-advisory .callout__description").hover();
    await page.waitForTimeout(350);
    const viaText = await state("medical-advisory");
    expect(viaText.connector).toBe("rgb(138, 100, 56)");
    expect(viaText.tierFill).not.toBe(rest.tierFill);
    // Keyboard focus on a text link does the same.
    await page.mouse.move(5, 5);
    await page.locator(".callout--merlin .callout__cta").focus();
    await page.waitForTimeout(350);
    expect((await state("merlin")).connector).toBe("rgb(138, 100, 56)");
  });
});

test.describe("13 · typography and font loading", () => {
  test("two families: Cinzel for the headings and QME, Lora for all other text; all swap", async ({ page }) => {
    const fontFiles: string[] = [];
    page.on("request", (r) => {
      if (r.url().endsWith(".woff2")) fontFiles.push(r.url().split("/").pop()!);
    });
    await open(page, 1440, 900);
    const fam = await page.evaluate(() => {
      const first = (sel: string) => getComputedStyle(document.querySelector(sel)!).fontFamily.split(",")[0].replace(/"/g, "").trim();
      return {
        lora: [".hero__subhead", ".epigraph__quote p", ".callout__benefit", ".callout__description", ".callout__cta", ".selector__statement", ".site-footer__links a"].map(first),
        cinzel: ["h1", "h2", ".qme"].map(first),
        headingWeights: ["h1", "h2"].map((sel) => Number(getComputedStyle(document.querySelector(sel)!).fontWeight)),
        quoteStyle: getComputedStyle(document.querySelector(".epigraph__quote p")!).fontStyle,
      };
    });
    expect(new Set(fam.lora)).toEqual(new Set(["Lora Variable"]));
    expect(new Set(fam.cinzel)).toEqual(new Set(["Cinzel Variable"]));
    for (const w of fam.headingWeights) expect(w).toBeGreaterThan(500); // a step above regular
    for (const w of fam.headingWeights) expect(w).toBeLessThan(650);
    expect(fam.quoteStyle).toBe("italic");
    expect(fontFiles.length).toBeGreaterThan(0);
    for (const f of fontFiles) expect(f).toMatch(/^(cinzel|lora)-|^inter-arrow-/);
    const displays = await page.evaluate(() => {
      const out: string[] = [];
      for (const sheet of [...document.styleSheets]) {
        for (const rule of [...sheet.cssRules]) {
          if (rule instanceof CSSFontFaceRule && rule.style.getPropertyValue("src").includes("url(")) out.push(rule.style.getPropertyValue("font-display"));
        }
      }
      return out;
    });
    expect(new Set(displays)).toEqual(new Set(["swap"]));
    const preloads = await page.locator('link[rel="preload"][as="font"]').evaluateAll((ls) => ls.map((l) => l.getAttribute("href")));
    expect(preloads.some((h) => /cinzel-latin-wght-normal/.test(h ?? ""))).toBe(true);
    expect(preloads.some((h) => /lora-latin-wght-normal/.test(h ?? ""))).toBe(true);
    expect(preloads.some((h) => /lora-latin-wght-italic/.test(h ?? ""))).toBe(true);
  });

  test("wide desktop headline: two lines, 48–58 px, the second starting with “medical insight”", async ({ page }) => {
    for (const width of [1440, 1280]) {
      await open(page, width, 900);
      const lines = await page.locator(".hero__line").evaluateAll((els) => els.map((el) => el.getClientRects().length));
      expect(lines).toEqual([1, 1]);
      const second = await page.locator(".hero__line").nth(1).innerText();
      expect(second.startsWith("medical insight")).toBe(true);
      const size = await page.locator("h1").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(size).toBeGreaterThanOrEqual(48);
      expect(size).toBeLessThanOrEqual(58);
      const h1 = (await page.locator("h1").boundingBox())!;
      expect(Math.round(h1.height / (size * 1.18))).toBe(2);
    }
  });

  test("text shows at once in metric-matched fallbacks; the swap barely moves the layout", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await interceptOutbound(page);
    await page.route(/\.woff2$/, async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    const early = await page.evaluate(() => ({
      h1Height: document.querySelector("h1")!.getBoundingClientRect().height,
      h2Top: document.querySelector("h2")!.getBoundingClientRect().top,
      loraReady: document.fonts.check("16px 'Lora Variable'"),
    }));
    expect(early.loraReady).toBe(false);
    expect(early.h1Height).toBeGreaterThan(0);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const h2Top = await page.evaluate(() => document.querySelector("h2")!.getBoundingClientRect().top);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    test.info().annotations.push({ type: "font-swap CLS", description: cls.toFixed(4) });
    expect(Math.abs(h2Top - early.h2Top)).toBeLessThan(2);
    expect(cls).toBeLessThan(0.01);
  });
});

test.describe("14 · contrast", () => {
  test("text and gold accents meet WCAG AA on the ivory surfaces", async ({ page }) => {
    await open(page, 1440, 900);
    const ratios = await page.evaluate(() => {
      const rgb = (c: string) => c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number);
      const lum = ([r, g, b]: number[]) =>
        [r, g, b]
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      const ratio = (fg: number[], bg: number[]) => {
        const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
        return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
      };
      const color = (sel: string) => rgb(getComputedStyle(document.querySelector(sel)!).color);
      const ivory = [247, 243, 236];
      return {
        cta: ratio(color(".callout__cta"), ivory),
        description: ratio(color(".callout__description"), ivory),
        statement: ratio(color(".selector__statement"), ivory),
        footer: ratio(color(".site-footer__links a"), ivory),
        qme: ratio(color(".qme"), [247, 244, 238]),
      };
    });
    for (const [k, v] of Object.entries(ratios)) expect(v, k).toBeGreaterThanOrEqual(4.5);
  });

  test("hero text meets AA against the lightest pixel of the plates behind it", async ({ page }) => {
    const lum = ([r, g, b]: readonly number[]) =>
      [r, g, b]
        .map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (fg: readonly number[], bgLum: number) => {
      const [a, b] = [lum(fg), bgLum].sort((x, y) => y - x);
      return (a + 0.05) / (b + 0.05);
    };
    const darkestEmphasis = [200, 160, 106]; // #C8A06A, the far end of the "medical insight" gradient
    const targets = {
      headline: "h1 .hero__line:first-child",
      emphasis: ".hero__em",
      subhead: ".hero__subhead",
      quote: ".epigraph__quote p",
      cite: ".epigraph__attribution",
    } as const;
    for (const width of [1440, 1024, 390]) {
      await open(page, width, 1000);
      const found: Record<string, { box: { x: number; y: number; width: number; height: number }; color: number[] }> = {};
      for (const [k, sel] of Object.entries(targets)) {
        const el = page.locator(sel).first();
        const color = await el.evaluate((n) => getComputedStyle(n).color.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number));
        found[k] = { box: (await el.boundingBox())!, color: k === "emphasis" ? darkestEmphasis : color };
      }
      // Hide the words (layout unchanged) and read the background they sit on.
      await page.addStyleTag({ content: ".hero__inner { visibility: hidden !important; }" });
      for (const [k, { box, color }] of Object.entries(found)) {
        const png = await page.screenshot({ clip: box, animations: "disabled" });
        const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
        let lightest = 0;
        for (let i = 0; i < data.length; i += info.channels) lightest = Math.max(lightest, lum([data[i], data[i + 1], data[i + 2]]));
        const r = ratio(color, lightest);
        test.info().annotations.push({ type: `hero contrast ${width} ${k}`, description: r.toFixed(2) });
        expect(r, `${k} at ${width}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
