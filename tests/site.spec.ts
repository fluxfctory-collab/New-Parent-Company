import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";

/*
 * Verification suite for the gateway page (brief §10, Phase 6). Outbound navigation
 * is intercepted, so nothing here depends on the network.
 */

const SERVICE_URLS = content.services.map((s) => s.href);
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

test.describe("1 · exact copy", () => {
  test("every manifest string is on the page, verbatim", async ({ page }) => {
    await open(page);
    const text = normalise(await page.locator("body").innerText());
    for (const s of COPY) expect(text, `missing: ${s}`).toContain(s);
    expect(await page.title()).toBe(content.meta.title);
    expect(await page.locator('meta[name="description"]').getAttribute("content")).toBe(content.meta.description);
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
    expect(html).toContain("Medical Intelligence Services — record analysis");
    expect((html.match(/→/g) ?? []).length).toBe(3);
  });

  test("one h1, selector h2, company names as h3; landmarks and lang", async ({ page }) => {
    await open(page);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(content.hero.headline);
    await expect(page.locator("h2")).toHaveText([content.selector.heading]);
    await expect(page.locator("h3")).toHaveText(content.services.map((s) => s.name));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("body > header, body > main, body > footer")).toHaveCount(3);
    await expect(page.locator("main > section")).toHaveCount(2);
  });
});

test.describe("2 · links", () => {
  test("exactly the expected destinations, same-tab", async ({ page }) => {
    await open(page);
    const hrefs = await page.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(new Set(hrefs)).toEqual(new Set(["#top", content.qme.href, ...SERVICE_URLS]));
    await expect(page.locator("a[target]")).toHaveCount(0);
  });

  test("service anchors map to their companies, foundation-first in the DOM", async ({ page }) => {
    await open(page);
    const services = page.locator(".selector a.service");
    await expect(services).toHaveCount(3);
    expect(await services.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(SERVICE_URLS);
    for (const s of content.services) {
      const a = page.locator(`.selector a.service[href="${s.href}"]`);
      await expect(a.locator("h3")).toHaveText(s.name);
      await expect(a.locator(".service__cta")).toHaveText(s.cta);
      // The CTA is a span inside the one anchor — no nested interactive elements.
      await expect(a.locator("a, button")).toHaveCount(0);
    }
  });

  test("QME goes to the legacy site and sits outside the selector", async ({ page }) => {
    await open(page);
    const qme = page.locator(`a[href="${content.qme.href}"]`);
    await expect(qme).toHaveCount(1);
    await expect(qme).toHaveText(content.qme.label);
    await expect(page.locator(`.selector a[href="${content.qme.href}"], .selector-overview a`)).toHaveCount(0);
    await expect(page.locator(`header a[href="${content.qme.href}"]`)).toHaveCount(1);
  });
});

test.describe("3 · click targets", () => {
  // Centroids inside a 600×100 band: triangle → 2/3 down; trapezoids from the area formula.
  const CENTROID_Y: Record<string, number> = { apex: 2 / 3, middle: 1 - 800 / 1800, foundation: 1 - 1400 / 3000 };

  for (const s of content.services) {
    test(`desktop: tier centroid and text row both open ${s.href}`, async ({ page }) => {
      await open(page, 1440, 1300);
      const row = page.locator(`a.service--${s.tier}`);
      const tier = await row.locator(".service__tier").boundingBox();
      if (!tier) throw new Error("no tier box");
      await page.mouse.click(tier.x + tier.width / 2, tier.y + tier.height * CENTROID_Y[s.tier]);
      await page.waitForURL(s.href);
      await page.goto("/");
      const text = await row.locator(".service__text").boundingBox();
      if (!text) throw new Error("no text box");
      await page.mouse.click(text.x + text.width / 2, text.y + text.height / 2);
      await page.waitForURL(s.href);
    });

    test(`mobile 390: row centre opens ${s.href}`, async ({ page }) => {
      await open(page, 390, 844);
      const row = page.locator(`a.service--${s.tier}`);
      await row.scrollIntoViewIfNeeded();
      const box = await row.boundingBox();
      if (!box) throw new Error("no row box");
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForURL(s.href);
    });
  }

  test("desktop: the paper beside the apex is not a link (hit area follows the shape)", async ({ page }) => {
    await open(page, 1440, 1300);
    const tier = await page.locator("a.service--apex .service__tier").boundingBox();
    if (!tier) throw new Error("no tier box");
    const hit = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.getAttribute("href") ?? null,
      [tier.x + tier.width * 0.1, tier.y + tier.height * 0.5],
    );
    expect(hit).toBeNull();
  });
});

test.describe("4 · keyboard", () => {
  test("tab order and a visible focus indicator on every stop", async ({ page }) => {
    await open(page, 1440, 1300);
    mkdirSync("test-results/focus", { recursive: true });
    const expected = ["#top", content.qme.href, ...SERVICE_URLS, ...SERVICE_URLS];
    for (const [i, href] of expected.entries()) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const ring = el.matches(".service") && getComputedStyle(el).outlineStyle === "none"
          ? (el.querySelector(".service__panel") as HTMLElement)
          : el;
        const cs = getComputedStyle(ring);
        return { href: el.getAttribute("href"), style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), color: cs.outlineColor };
      });
      expect(info.href, `tab stop ${i + 1}`).toBe(href);
      expect(info.style, `outline style at stop ${i + 1}`).toBe("solid");
      expect(info.width, `outline width at stop ${i + 1}`).toBeGreaterThanOrEqual(2);
      expect(info.color).toBe("rgb(135, 90, 46)"); // --bronze-ink
      await page.screenshot({ path: `test-results/focus/stop-${i + 1}.png` });
    }
  });
});

test.describe("5 · accessible names", () => {
  test("each service link is named by its CTA and company", async ({ page }) => {
    await open(page);
    await expect(page.locator("a.service--foundation")).toHaveAccessibleName("Explore Merlin");
    await expect(page.locator("a.service--middle")).toHaveAccessibleName("Guardian Medical Advisory Learn more");
    await expect(page.locator("a.service--apex")).toHaveAccessibleName("Guardian Civil Services Learn more");
    for (const s of content.services) {
      await expect(page.locator(`a.service--${s.tier}`)).toHaveAccessibleDescription(`${s.benefit} ${s.description}`);
    }
    await expect(page.getByRole("link", { name: /^QME/ })).toHaveCount(1);
    await expect(page.getByRole("link", { name: content.meta.title })).toHaveCount(1);
  });
});

test.describe("6 · overflow", () => {
  const sizes = [
    { width: 1440, height: 900, scale: 1 },
    { width: 1280, height: 800, scale: 1 },
    { width: 1024, height: 768, scale: 1 },
    { width: 768, height: 1024, scale: 1 },
    { width: 390, height: 844, scale: 1 },
    { width: 360, height: 740, scale: 1 },
    { width: 720, height: 450, scale: 2 }, // 1440×900 at 200 % zoom
    { width: 640, height: 400, scale: 2 }, // 1280×800 at 200 % zoom
  ];
  for (const { width, height, scale } of sizes) {
    test(`no horizontal scroll at ${width}×${height} @${scale}x`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
      const page = await context.newPage();
      await interceptOutbound(page);
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      expect(sw).toBeLessThanOrEqual(iw);
      // Nothing is clipped: every text block sits inside the viewport.
      const outside = await page.evaluate(() =>
        [...document.querySelectorAll("h1, h2, h3, p, figcaption, a")]
          .filter((el) => { const r = el.getBoundingClientRect(); return r.left < -0.5 || r.right > window.innerWidth + 0.5; })
          .map((el) => el.textContent?.slice(0, 40)),
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

test.describe("8 · reduced motion", () => {
  test("no running animations and everything at full opacity", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await interceptOutbound(page);
    await page.goto("/");
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
    expect(running).toBe(0);
    const faded = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((el) => parseFloat(getComputedStyle(el).opacity) < 1)
        .map((el) => el.tagName),
    );
    expect(faded).toEqual([]);
    // Hover moves nothing: the arrow keeps its place.
    await page.locator("a.service--middle .service__text").hover();
    const transform = await page.locator("a.service--middle .service__arrow").evaluate((el) => getComputedStyle(el).transform);
    expect(transform).toBe("none");
    await context.close();
  });

  test("with motion allowed, the entrance runs once and ends at full opacity", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await interceptOutbound(page);
    await page.goto("/");
    const animations = await page.evaluate(() =>
      document.getAnimations().map((a) => {
        const t = a.effect?.getComputedTiming();
        return { iterations: t?.iterations, end: Number(t?.endTime) };
      }),
    );
    expect(animations.length).toBe(3);
    for (const a of animations) {
      expect(a.iterations).toBe(1);
      expect(a.end).toBeLessThanOrEqual(400);
    }
    await page.waitForTimeout(500);
    const opacities = await page.locator(".service__tier svg").evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
    expect(opacities).toEqual(["1", "1", "1"]);
    await context.close();
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

test.describe("10 · first viewport", () => {
  test("at 1440×900 the selector heading and the apex are above the fold", async ({ page }) => {
    await open(page, 1440, 900);
    const h2 = await page.locator("h2").boundingBox();
    const apex = await page.locator("a.service--apex .service__tier").boundingBox();
    expect(h2!.y).toBeLessThan(900);
    expect(apex!.y).toBeLessThan(900);
  });
});

test.describe("11 · images", () => {
  test("logos load, carry width/height, keep their ratio and cause no layout shift", async ({ page }) => {
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
        w: img.getAttribute("width"),
        h: img.getAttribute("height"),
        attrRatio: Number(img.getAttribute("width")) / Number(img.getAttribute("height")),
        renderRatio: img.getBoundingClientRect().width / img.getBoundingClientRect().height,
        decoding: img.getAttribute("decoding"),
        loading: img.getAttribute("loading"),
      })),
    );
    expect(imgs.length).toBe(5);
    for (const img of imgs) {
      expect(img.ok, img.src).toBe(true);
      expect(img.w && img.h, img.src).toBeTruthy();
      expect(Math.abs(img.attrRatio - img.renderRatio)).toBeLessThan(0.02);
      expect(img.decoding).toBe("async");
      expect(img.src).toMatch(/\.webp$/);
    }
    expect(imgs[0].loading).not.toBe("lazy"); // header logo
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThan(0.01);
  });
});

test.describe("12 · axe", () => {
  for (const width of [1440, 390]) {
    test(`no serious or critical violations at ${width}`, async ({ page }) => {
      await open(page, width, 900);
      const results = await new AxeBuilder({ page }).analyze();
      const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});

test.describe("pyramid geometry", () => {
  for (const width of [1440, 1280, 1024]) {
    test(`equal bands, continuous edges, aligned copy at ${width}`, async ({ page }) => {
      await open(page, width, 1000);
      const g = await page.evaluate(() => {
        const rows = ["apex", "middle", "foundation"].map((t) => {
          const a = document.querySelector(`a.service--${t}`)!;
          const tier = a.querySelector(".service__tier")!.getBoundingClientRect();
          const line = getComputedStyle(a.querySelector(".service__connector")!, "::before");
          const conn = a.querySelector(".service__connector")!.getBoundingClientRect();
          const logo = a.querySelector(".service__logo img")!.getBoundingClientRect();
          const copy = a.querySelector(".service__benefit")!.getBoundingClientRect();
          const name = a.querySelector(".service__name")!.getBoundingClientRect();
          return {
            top: tier.top, bottom: tier.bottom, width: tier.width, left: tier.left,
            lineY: conn.top + parseFloat(line.top), lineRight: conn.right,
            logoMid: logo.top + logo.height / 2, logoLeft: logo.left, copyLeft: copy.left, nameLeft: name.left,
          };
        });
        return rows;
      });
      const [apex, middle, foundation] = g;
      // Equal heights, no gaps, same width and x: one continuous triangle.
      expect(Math.abs(apex.bottom - apex.top - (middle.bottom - middle.top))).toBeLessThan(0.5);
      expect(Math.abs(middle.bottom - middle.top - (foundation.bottom - foundation.top))).toBeLessThan(0.5);
      expect(Math.abs(apex.bottom - middle.top)).toBeLessThan(0.5);
      expect(Math.abs(middle.bottom - foundation.top)).toBeLessThan(0.5);
      expect(new Set(g.map((r) => Math.round(r.width))).size).toBe(1);
      expect(new Set(g.map((r) => Math.round(r.left))).size).toBe(1);
      const ratio = apex.width / (foundation.bottom - apex.top);
      expect(ratio).toBeGreaterThan(width >= 1280 ? 1.0 : 0.82);
      // Connectors at each band's vertical middle; copy columns share one left edge.
      for (const r of g) expect(Math.abs(r.lineY - (r.top + r.bottom) / 2)).toBeLessThan(1);
      expect(new Set(g.map((r) => Math.round(r.copyLeft))).size).toBe(1);
      expect(new Set(g.map((r) => Math.round(r.nameLeft))).size).toBe(1);
      if (width >= 1280) {
        // Logo column: the connector runs into the logo's vertical centre.
        for (const r of g) expect(Math.abs(r.lineY - r.logoMid)).toBeLessThan(1.5);
        expect(new Set(g.map((r) => Math.round(r.logoLeft))).size).toBe(1);
      }
    });
  }

  test("desktop stacks the DOM order bottom-to-top", async ({ page }) => {
    await open(page, 1440, 1000);
    const ys = await page.locator("a.service").evaluateAll((as) => as.map((a) => a.getBoundingClientRect().top));
    expect(ys[0]).toBeGreaterThan(ys[1]);
    expect(ys[1]).toBeGreaterThan(ys[2]);
  });
});
