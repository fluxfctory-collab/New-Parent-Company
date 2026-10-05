// Side-by-side comparison image with labels.
//   node scripts/compare.mjs <left.png> <right.png> <out.png> [leftLabel] [rightLabel] [width]
// Both images are scaled to the same CSS width (default 720 px per side).
import sharp from "sharp";

const [left, right, out, leftLabel = "before", rightLabel = "after", w = "720"] = process.argv.slice(2);
if (!left || !right || !out) {
  console.error("usage: node scripts/compare.mjs left.png right.png out.png [leftLabel] [rightLabel] [width]");
  process.exit(1);
}
const width = Number(w);
const a = await sharp(left).resize({ width }).toBuffer();
const b = await sharp(right).resize({ width }).toBuffer();
const [ma, mb] = await Promise.all([sharp(a).metadata(), sharp(b).metadata()]);
const pad = 20;
const head = 40;
const label = (text, x) => ({
  input: Buffer.from(
    `<svg width="${width}" height="${head}" xmlns="http://www.w3.org/2000/svg"><text x="0" y="26" font-family="sans-serif" font-size="18" fill="#242629">${text}</text></svg>`,
  ),
  left: x,
  top: 6,
});
await sharp({
  create: { width: width * 2 + pad * 3, height: Math.max(ma.height, mb.height) + head + pad, channels: 3, background: "#E4DED3" },
})
  .composite([label(leftLabel, pad), label(rightLabel, width + pad * 2), { input: a, left: pad, top: head }, { input: b, left: width + pad * 2, top: head }])
  .png()
  .toFile(out);
console.log(`wrote ${out}`);
