// Turns the Vite client build into a fully static page.
//
// 1. Renders <App /> with the SSR bundle (dist-ssr/entry-server.js) and injects the
//    markup into dist/index.html.
// 2. Removes the client <script> (its only job was to make Vite bundle the CSS and
//    fonts) and deletes the resulting empty JS chunk — production ships no JavaScript.
// 3. Copies images emitted by the SSR build into dist/assets (same hashed names).
// 4. Preloads the latin font files used above the fold (Cinzel, Lora upright + italic).
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const distSsr = path.join(root, "dist-ssr");

const { render } = await import(pathToFileURL(path.join(distSsr, "entry-server.js")).href);
let html = readFileSync(path.join(dist, "index.html"), "utf8");

const markup = render();
if (!html.includes("<!--app-html-->")) throw new Error("Placeholder <!--app-html--> missing from dist/index.html");
html = html.replace("<!--app-html-->", markup);

// Strip module scripts and modulepreloads; delete the JS files they pointed at.
const scriptSrcs = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>\s*/g)];
for (const [tag, src] of scriptSrcs) {
  html = html.replace(tag, "");
  const file = path.join(dist, src.replace(/^\//, ""));
  if (existsSync(file)) rmSync(file);
}
html = html.replace(/<link rel="modulepreload"[^>]*>\s*/g, "");

// Images referenced by the SSR bundle (logos) → dist/assets.
const ssrAssets = path.join(distSsr, "assets");
if (existsSync(ssrAssets)) {
  for (const f of readdirSync(ssrAssets)) {
    if (!/\.(webp|png|svg|jpe?g|avif)$/.test(f)) continue;
    const target = path.join(dist, "assets", f);
    if (!existsSync(target)) copyFileSync(path.join(ssrAssets, f), target);
  }
}

// Preload the latin files the first view needs: Cinzel (headline, QME), Lora upright
// (supporting sentence) and Lora italic (the hero quotation).
const assetFiles = readdirSync(path.join(dist, "assets"));
const preloaded = [/^cinzel-latin-wght-normal-.*\.woff2$/, /^lora-latin-wght-normal-.*\.woff2$/, /^lora-latin-wght-italic-.*\.woff2$/]
  .map((re) => assetFiles.find((f) => re.test(f)))
  .filter(Boolean);
if (preloaded.length !== 3) throw new Error("Expected the Cinzel and Lora (upright, italic) latin files to preload");
html = html.replace(
  "<!--preload-fonts-->",
  preloaded.map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin>`).join("\n    "),
);

// Every referenced /assets/ file must exist.
const missing = [...html.matchAll(/\/assets\/[^"' )]+/g)]
  .map((m) => m[0])
  .filter((p) => !existsSync(path.join(dist, p)));
if (missing.length) throw new Error("Missing assets: " + missing.join(", "));
if (/<script/i.test(html)) throw new Error("A <script> tag survived prerendering");

writeFileSync(path.join(dist, "index.html"), html);
rmSync(distSsr, { recursive: true, force: true });
console.log(`prerendered dist/index.html (${(html.length / 1024).toFixed(1)} KB, no JS; preload: ${preloaded.join(", ")})`);
