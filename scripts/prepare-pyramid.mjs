// Derives web sizes of the supplied pyramid (public/images/guardian-pyramid.png) and
// prints its measured geometry.
//
//   node scripts/prepare-pyramid.mjs
//
// The PNG is the client-supplied artwork (1312 × 1199, transparent background), stored
// as delivered. This script never crops or redraws it: it only writes resized WebP copies
// with the same aspect ratio, and reports each tier's outline from the alpha channel so
// the hit polygons in src/components/pyramidGeometry.ts can be checked against it.
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "public/images/guardian-pyramid.png");
const { width, height } = await sharp(SRC).metadata();

for (const w of [640, 980, 1312]) {
  const out = path.join(root, `public/images/guardian-pyramid-${w}.webp`);
  await sharp(SRC).resize({ width: w }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(out);
  console.log(`wrote ${path.relative(root, out)} (${w} × ${Math.round((w * height) / width)})`);
}

// Geometry: opaque rows (alpha > 128) grouped into bands; straight-line fits of each band's
// left and right edges (skipping the bevelled first/last rows).
const { data } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const bands = [];
let cur = null;
for (let y = 0; y < height; y++) {
  let l = -1;
  let r = -1;
  for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 128) {
      if (l < 0) l = x;
      r = x;
    }
  }
  if (l >= 0) {
    if (!cur) cur = { top: y, rows: [] };
    cur.rows.push([y, l, r + 1]);
  } else if (cur) {
    cur.bottom = y;
    bands.push(cur);
    cur = null;
  }
}
const fit = (pts) => {
  const n = pts.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [y, x] of pts) { sx += y; sy += x; sxx += y * y; sxy += y * x; }
  const a = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return (y) => a * y + (sy - a * sx) / n;
};
console.log(`\nsize ${width} × ${height}; tier outlines in pixels (x at top and bottom edges):`);
for (const [i, b] of bands.entries()) {
  const inner = b.rows.slice(6, -6);
  const L = fit(inner.map(([y, l]) => [y, l]));
  const R = fit(inner.map(([y, , r]) => [y, r]));
  console.log(
    `${["apex", "middle", "foundation"][i].padEnd(10)} y ${b.top}–${b.bottom}  ` +
      `top ${L(b.top).toFixed(1)}–${R(b.top).toFixed(1)}  bottom ${L(b.bottom).toFixed(1)}–${R(b.bottom).toFixed(1)}`,
  );
}
