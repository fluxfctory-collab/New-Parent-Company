// Derives web sizes of the supplied hero background ("_brief/Hero background.webp",
// 1840 × 854). The artwork is never redrawn or recoloured here: the darkening that keeps
// the hero text legible is a CSS overlay (.hero__shade in global.css).
//
//   node scripts/prepare-hero.mjs
//
// Writes public/images/hero-background-{1840,1280}.webp (the 1840 file is the supplied
// one, byte for byte) and hero-background-narrow-960.webp: for portrait screens, the two
// banks of glass panels moved closer together (the plain wall between them is shortened,
// the seam feathered), so a phone still sees the panels at both edges instead of only
// the empty middle of the wall.
import { copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "_brief/Hero background.webp");
const out = (name) => path.join(root, "public/images", name);
const { width, height } = await sharp(SRC).metadata();

copyFileSync(SRC, out(`hero-background-${width}.webp`));
await sharp(SRC).resize({ width: 1280 }).webp({ quality: 82, effort: 6 }).toFile(out("hero-background-1280.webp"));

// Narrow version: keep `side` px from each edge, crossfade over `feather` px in the middle.
const side = 620;
const feather = 140;
const narrowW = side * 2 - feather;
const { data } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const px = Buffer.alloc(narrowW * height * 3);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < narrowW; x++) {
    const xl = x; // from the left edge
    const xr = width - narrowW + x; // from the right edge
    const t = Math.min(1, Math.max(0, (x - (side - feather)) / feather));
    const w = t * t * (3 - 2 * t); // smoothstep
    for (let c = 0; c < 3; c++) {
      const l = xl < width ? data[(y * width + xl) * 3 + c] : 0;
      const r = data[(y * width + xr) * 3 + c];
      px[(y * narrowW + x) * 3 + c] = Math.round(l * (1 - w) + r * w);
    }
  }
}
await sharp(px, { raw: { width: narrowW, height, channels: 3 } })
  .resize({ width: 960 })
  .webp({ quality: 82, effort: 6 })
  .toFile(out("hero-background-narrow-960.webp"));

console.log(`hero backgrounds written (source ${width} × ${height}; narrow ${narrowW} × ${height} → 960 wide)`);
