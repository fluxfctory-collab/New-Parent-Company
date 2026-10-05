// Derives web-ready logo files from the untouched originals in _brief/.
//
//   node scripts/prepare-logos.mjs
//
// For each logo: find the artwork box with an alpha threshold (alpha > 8 — the
// 1920×1080 sub-brand files carry stray alpha-1/2 pixels across the whole canvas,
// so a plain trim returns the full canvas), add a safety margin of 1.5 % of the
// artwork height, check that ≥ 99.9 % of the original alpha mass survives, then
// export lossless WebP at 2× and 3× the largest display height plus a PNG fallback.
// Also writes the favicon set from the parent helmet mark, and
// src/assets/logos/logos.ts with the exact intrinsic sizes for width/height attributes.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BRIEF = path.join(root, "_brief");
const OUT = path.join(root, "src", "assets", "logos");
const PUBLIC = path.join(root, "public");
const ALPHA_THRESHOLD = 8;
const MARGIN_RATIO = 0.015;
const MIN_MASS_RETAINED = 0.999;

/** Largest CSS height each logo is displayed at (see src/styles/global.css). */
const LOGOS = [
  { key: "parent", file: "logo Update 2 background expanded (2).png", maxDisplayHeight: 40, alt: "The Guardian Group" },
  { key: "merlin", file: "Final_logo_01-01.png", maxDisplayHeight: 38 },
  { key: "medicalAdvisory", file: "Medical Advisory Bronze Inverted - Transparent (1).png", maxDisplayHeight: 36 },
  { key: "civilServices", file: "Civil Services Gray.White-Transparent.png", maxDisplayHeight: 36 },
];

async function readRaw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Inclusive bbox of pixels with alpha > threshold, plus alpha-mass totals. */
function artworkBox({ data, width, height }, threshold) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1, total = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      total += a;
      if (a > threshold) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, x1, y1, total };
}

function massInside({ data, width }, { left, top, w, h }) {
  let sum = 0;
  for (let y = top; y < top + h; y++) {
    for (let x = left; x < left + w; x++) sum += data[(y * width + x) * 4 + 3];
  }
  return sum;
}

function expand(box, margin, width, height) {
  const left = Math.max(0, box.x0 - margin);
  const top = Math.max(0, box.y0 - margin);
  const right = Math.min(width - 1, box.x1 + margin);
  const bottom = Math.min(height - 1, box.y1 + margin);
  return { left, top, w: right - left + 1, h: bottom - top + 1 };
}

mkdirSync(OUT, { recursive: true });
mkdirSync(PUBLIC, { recursive: true });

const manifest = {};
let failed = false;

for (const logo of LOGOS) {
  const src = path.join(BRIEF, logo.file);
  const raw = await readRaw(src);
  const box = artworkBox(raw, ALPHA_THRESHOLD);
  const artH = box.y1 - box.y0 + 1;
  const margin = Math.ceil(artH * MARGIN_RATIO);
  const crop = expand(box, margin, raw.width, raw.height);
  const retained = massInside(raw, crop) / box.total;
  if (retained < MIN_MASS_RETAINED) failed = true;

  const trimmed = sharp(src).extract({ left: crop.left, top: crop.top, width: crop.w, height: crop.h });
  const trimmedBuf = await trimmed.png().toBuffer();
  const files = {};
  for (const scale of [2, 3]) {
    const h = logo.maxDisplayHeight * scale;
    const w = Math.round((h * crop.w) / crop.h);
    const resized = sharp(trimmedBuf).resize({ width: w, height: h, fit: "fill", kernel: "lanczos3" });
    const webp = `${logo.key}@${scale}x.webp`;
    await resized.clone().webp({ lossless: true, effort: 6 }).toFile(path.join(OUT, webp));
    files[`webp${scale}x`] = webp;
    if (scale === 2) {
      const png = `${logo.key}@2x.png`;
      await resized.clone().png({ compressionLevel: 9, palette: false }).toFile(path.join(OUT, png));
      files.png = png;
    }
  }
  manifest[logo.key] = { ...files, width: crop.w, height: crop.h, ratio: crop.w / crop.h };
  console.log(
    `${logo.key.padEnd(16)} source ${raw.width}×${raw.height}` +
      `  artwork (${box.x0},${box.y0})–(${box.x1},${box.y1}) ${box.x1 - box.x0 + 1}×${artH}` +
      `  margin ${margin}px → crop ${crop.w}×${crop.h} (ratio ${(crop.w / crop.h).toFixed(3)})` +
      `  alpha mass retained ${(retained * 100).toFixed(4)} %${retained < MIN_MASS_RETAINED ? "  ✗ BELOW 99.9 %" : ""}`,
  );
}

// ── Favicons: the parent helmet mark alone, padded to a transparent square ─────────────
{
  const src = path.join(BRIEF, LOGOS[0].file);
  const helmet = { left: 128, top: 128, width: 854, height: 1012 }; // (128,128)–(982,1140) exclusive
  const raw = await readRaw(src);
  // Confirm the helmet box is separated from the wordmark by fully transparent columns.
  let gap = 0;
  for (let x = helmet.left + helmet.width; x < helmet.left + helmet.width + 40; x++) {
    let colAlpha = 0;
    for (let y = 0; y < raw.height; y++) colAlpha += raw.data[(y * raw.width + x) * 4 + 3];
    if (colAlpha === 0) gap++;
  }
  const side = Math.round(helmet.height * 1.08); // ≈ 4 % breathing room top and bottom
  const mark = await sharp(src).extract(helmet).png().toBuffer();
  const square = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, left: Math.round((side - helmet.width) / 2), top: Math.round((side - helmet.height) / 2) }])
    .png()
    .toBuffer();
  const sizes = { "favicon-32.png": 32, "favicon-512.png": 512 };
  const pngs = {};
  for (const [name, size] of Object.entries(sizes)) {
    pngs[size] = await sharp(square).resize(size, size, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toBuffer();
    writeFileSync(path.join(PUBLIC, name), pngs[size]);
  }
  // iOS paints transparent touch icons on black, so this one sits on the page's paper colour.
  await sharp(square)
    .resize(152, 152, { kernel: "lanczos3" })
    .extend({ top: 14, bottom: 14, left: 14, right: 14, background: "#FAF9F6" })
    .flatten({ background: "#FAF9F6" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, "apple-touch-icon.png"));
  // favicon.ico with embedded 16 px and 32 px PNG images.
  const p16 = await sharp(square).resize(16, 16, { kernel: "lanczos3" }).png().toBuffer();
  const images = [[16, p16], [32, pngs[32]]];
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(([size, buf], i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size, e);
    header.writeUInt8(size, e + 1);
    header.writeUInt8(0, e + 2);
    header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(buf.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  writeFileSync(path.join(PUBLIC, "favicon.ico"), Buffer.concat([header, ...images.map(([, b]) => b)]));
  console.log(
    `favicons        helmet box ${helmet.width}×${helmet.height} → ${side}² square; ${gap}/40 transparent columns right of the box` +
      " → favicon.ico (16+32), favicon-32.png, favicon-512.png, apple-touch-icon.png (180, on paper)",
  );
}

// ── Typed module with URLs and intrinsic sizes ─────────────────────────────────────────
const lines = [
  "// Generated by scripts/prepare-logos.mjs — do not edit by hand.",
  "// width/height are the trimmed artwork (incl. safety margin) in source pixels;",
  "// components scale them to a display height while keeping the exact ratio.",
  "",
];
for (const [key, m] of Object.entries(manifest)) {
  lines.push(`import ${key}Webp2x from "./${m.webp2x}";`);
  lines.push(`import ${key}Webp3x from "./${m.webp3x}";`);
  lines.push(`import ${key}Png from "./${m.png}";`);
}
lines.push("", "export const logos = {");
for (const [key, m] of Object.entries(manifest)) {
  lines.push(
    `  ${key}: { webp2x: ${key}Webp2x, webp3x: ${key}Webp3x, png: ${key}Png, width: ${m.width}, height: ${m.height} },`,
  );
}
lines.push("} as const;", "", "export type LogoKey = keyof typeof logos;", "");
writeFileSync(path.join(OUT, "logos.ts"), lines.join("\n"));
console.log("wrote src/assets/logos/logos.ts");

if (failed) {
  console.error("Alpha mass check failed for at least one logo.");
  process.exit(1);
}
