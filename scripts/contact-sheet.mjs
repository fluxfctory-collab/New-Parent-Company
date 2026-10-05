// Renders every trimmed logo at its planned display size on the page's paper colour,
// plus a few candidate sizes for Merlin, and screenshots it with Playwright.
//   node scripts/contact-sheet.mjs  → docs/screenshots/logo-contact-sheet.png
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "src/assets/logos");
const data = (f) => `data:image/webp;base64,${readFileSync(path.join(dir, f)).toString("base64")}`;
const dims = {
  parent: [4088, 1026], merlin: [2620, 830], medicalAdvisory: [1096, 292], civilServices: [1095, 291],
};
const img = (key, h, label) => {
  const w = Math.round((h * dims[key][0]) / dims[key][1]);
  return `<figure><div class="frame"><img src="${data(`${key}@3x.webp`)}" width="${w}" height="${h}" alt=""></div><figcaption>${label ?? key} · ${h}px tall · ${w}px wide</figcaption></figure>`;
};
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:32px;background:#FAF8F4;font:13px/1.4 system-ui,sans-serif;color:#5D646C}
h2{font:600 14px system-ui;color:#23262B;margin:28px 0 12px}
.row{display:flex;gap:40px;align-items:center;flex-wrap:wrap}
figure{margin:0}.frame{outline:1px dashed #DDD7CD;display:inline-block;line-height:0}
figcaption{margin-top:6px}
.line{display:flex;align-items:center;gap:48px;padding:16px 0;border-top:1px solid #DDD7CD;border-bottom:1px solid #DDD7CD}
.line .base{height:1px;background:#9B6B3F}
</style>
<h2>Header + footer — parent logo (light surface)</h2>
<div class="row">${img("parent", 46, "parent, header desktop")}${img("parent", 34, "parent, header mobile")}${img("parent", 32, "parent, footer")}</div>
<h2>Service rows ≥ 1280 px — side by side (dashed box = trimmed image incl. 0.6 % margin)</h2>
<div class="line">${img("merlin", 46, "Merlin")}${img("medicalAdvisory", 44, "Medical Advisory")}${img("civilServices", 44, "Civil Services")}</div>
<h2>1000–1279 px rows</h2>
<div class="line">${img("merlin", 36, "Merlin")}${img("medicalAdvisory", 34, "Medical Advisory")}${img("civilServices", 34, "Civil Services")}</div>
<h2>Mobile sizes</h2>
<div class="line">${img("merlin", 38, "Merlin")}${img("medicalAdvisory", 36, "Medical Advisory")}${img("civilServices", 36, "Civil Services")}</div>
`;
const scratch = path.join(root, "docs/screenshots");
mkdirSync(scratch, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.screenshot({ path: path.join(scratch, "logo-contact-sheet.png"), fullPage: true });
await browser.close();
console.log("wrote docs/screenshots/logo-contact-sheet.png");
