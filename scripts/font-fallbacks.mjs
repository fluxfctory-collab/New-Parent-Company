// Prints the metric overrides used for the fallback @font-face rules in src/styles/fonts.css.
//   node scripts/font-fallbacks.mjs
// size-adjust = webfont average character width ÷ fallback average width (Capsize metrics);
// ascent/descent/line-gap overrides are the webfont's metrics divided by that size-adjust.
import georgia from "@capsizecss/metrics/georgia";
import timesNewRoman from "@capsizecss/metrics/timesNewRoman";
import lora from "@capsizecss/metrics/lora";
import cinzel from "@capsizecss/metrics/cinzel";

const pct = (v) => `${(v * 100).toFixed(2)}%`;
for (const [name, font] of [["Lora", lora], ["Cinzel", cinzel]]) {
  for (const [fallbackName, fb] of [["Georgia", georgia], ["Times New Roman / Liberation Serif", timesNewRoman]]) {
    const sizeAdjust = font.xWidthAvg / font.unitsPerEm / (fb.xWidthAvg / fb.unitsPerEm);
    console.log(
      `${name} ← ${fallbackName}: size-adjust ${pct(sizeAdjust)}; ` +
        `ascent-override ${pct(font.ascent / font.unitsPerEm / sizeAdjust)}; ` +
        `descent-override ${pct(Math.abs(font.descent) / font.unitsPerEm / sizeAdjust)}; ` +
        `line-gap-override ${pct(font.lineGap / font.unitsPerEm / sizeAdjust)}`,
    );
  }
}
