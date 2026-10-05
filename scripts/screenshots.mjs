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
    const sel = (id) => `a.service[href*="${id}"]`;
    await shot("hover-medical-advisory-1440", {
      width: 1440, height: 1200, full: false, reducedMotion: "no-preference",
      prep: async (p) => {
        const box = await p.locator(`${sel("guardianadvisory")} .service__panel`).boundingBox();
        await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      },
    });
    await shot("hover-civil-tier-1440", {
      width: 1440, height: 1200, full: false, reducedMotion: "no-preference",
      prep: async (p) => {
        const box = await p.locator(`${sel("guardiancivil")} .service__tier`).boundingBox();
        await p.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7);
      },
    });
    for (const [name, presses] of [["focus-logo", 1], ["focus-qme", 2], ["focus-merlin", 3], ["focus-civil", 5]]) {
      await shot(`${name}-1440`, {
        width: 1440, height: 1200, full: false,
        prep: async (p) => { for (let i = 0; i < presses; i++) await p.keyboard.press("Tab"); },
      });
    }
    await shot("focus-merlin-390", {
      width: 390, height: 844, scale: 2, full: false,
      prep: async (p) => {
        for (let i = 0; i < 3; i++) await p.keyboard.press("Tab");
        await p.evaluate(() => document.activeElement.scrollIntoView({ block: "center" }));
      },
    });
  }
  if (!only || only === "details") {
    // 2× close-ups of the finishing details.
    const page = await browser.newPage({ viewport: { width: 1440, height: 1300 }, deviceScaleFactor: 2, reducedMotion: "no-preference" });
    await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    const around = async (sel, pad = 24) => {
      const b = await page.locator(sel).boundingBox();
      return { x: b.x - pad, y: b.y - pad, width: b.width + 2 * pad, height: b.height + 2 * pad };
    };
    // QME at rest (after the load sweep), then frozen mid-sweep.
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(out, `${prefix}-detail-qme-rest.png`), clip: await around("header .qme", 20) });
    await page.evaluate(() => {
      const a = document.getAnimations().find((x) => x.animationName === "metal-sweep");
      a.currentTime = 900 + 1500 * 0.42;
      a.pause();
    });
    await page.screenshot({ path: path.join(out, `${prefix}-detail-qme-sweep.png`), clip: await around("header .qme", 20) });
    // The pyramid and its connectors, at rest.
    await page.mouse.move(5, 5);
    const sel = await page.locator(".selector").boundingBox();
    await page.screenshot({ path: path.join(out, `${prefix}-detail-pyramid.png`), clip: { x: sel.x - 16, y: sel.y - 8, width: 720, height: sel.height + 16 } });
    // A service row's CTA on hover.
    await page.locator("a.service--middle .service__text").hover();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, `${prefix}-detail-row-hover.png`), clip: await around("a.service--middle .service__panel", 28) });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(`screenshots written to docs/screenshots/${prefix}-*.png`);
process.exit(0);
