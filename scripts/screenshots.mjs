// Captures the review screenshots from the production build (run `npm run build` first).
//
//   node scripts/screenshots.mjs [prefix]      default prefix: "final"
//
// Writes to docs/screenshots/: full pages at every test width, the 1440×900 first
// viewport, hover and focus states, the three tier-palette options, and 200 % zoom
// emulations (720 / 640 px wide at device scale 2).
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "docs", "screenshots");
const prefix = process.argv[2] ?? "final";
const only = process.argv[3]; // optional filter, e.g. "full" | "states" | "palettes"
mkdirSync(out, { recursive: true });

const PORT = 4174;
const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "preview", "--port", String(PORT), "--strictPort"], { cwd: root, stdio: "pipe" });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("preview server did not start")), 20000);
  server.stdout.on("data", (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); resolve(); } });
});
const url = `http://localhost:${PORT}/`;

const browser = await chromium.launch();
const shot = async (name, { width, height = 900, scale = 1, full = true, reducedMotion = "reduce", prep } = {}) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion });
  // Block outbound navigation so nothing leaves localhost.
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  if (prep) await prep(page);
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(out, `${prefix}-${name}.png`), fullPage: full });
  await page.close();
};

try {
  if (!only || only === "full") {
    for (const w of [1440, 1280, 1024, 768, 390, 360]) await shot(`full-${w}`, { width: w, scale: w < 800 ? 2 : 1 });
    await shot("first-viewport-1440x900", { width: 1440, height: 900, full: false });
    await shot("zoom200-720", { width: 720, height: 450, scale: 2 });
    await shot("zoom200-640", { width: 640, height: 400, scale: 2 });
  }
  if (!only || only === "states") {
    const centreOf = async (p, sel) => {
      const b = await p.locator(sel).boundingBox();
      return [b.x + b.width / 2, b.y + b.height * 0.62];
    };
    await shot("hover-civil-tier-1440", {
      width: 1440, height: 1200, full: false, reducedMotion: "no-preference",
      prep: async (p) => {
        await p.evaluate(() => window.scrollTo(0, document.querySelector(".selector__title").offsetTop - 40));
        const [x, y] = await centreOf(p, ".tier-link--civil-services polygon");
        await p.mouse.move(x, y);
      },
    });
    await shot("hover-medical-advisory-callout-1440", {
      width: 1440, height: 1200, full: false, reducedMotion: "no-preference",
      prep: async (p) => {
        await p.evaluate(() => window.scrollTo(0, document.querySelector(".selector__title").offsetTop - 40));
        await p.locator(".callout--medical-advisory .callout__description").hover();
      },
    });
    for (const [name, presses] of [["focus-logo", 1], ["focus-qme", 2], ["focus-tier-civil", 3], ["focus-cta-merlin", 8]]) {
      await shot(`${name}-1440`, {
        width: 1440, height: 1100, full: false,
        prep: async (p) => {
          for (let i = 0; i < presses; i++) await p.keyboard.press("Tab");
          await p.evaluate(() => {
            const el = document.activeElement;
            if (el && el.getBoundingClientRect().top > 700) window.scrollBy(0, el.getBoundingClientRect().top - 420);
          });
        },
      });
    }
    await shot("focus-cta-390", {
      width: 390, height: 844, scale: 2, full: false,
      prep: async (p) => {
        for (let i = 0; i < 6; i++) await p.keyboard.press("Tab");
        await p.evaluate(() => document.activeElement.scrollIntoView({ block: "center" }));
      },
    });
  }
  if (!only || only === "details") {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1300 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
    await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, `${prefix}-detail-header-hero.png`), clip: { x: 0, y: 0, width: 1440, height: 720 } });
    const stage = await page.locator(".selector-section").boundingBox();
    await page.screenshot({ path: path.join(out, `${prefix}-detail-selector.png`), clip: { x: 0, y: stage.y, width: 1440, height: Math.min(1000, stage.height) } });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(`screenshots written to docs/screenshots/${prefix}-*.png`);
process.exit(0);
