// WCAG 2.x contrast ratios for the token pairs used on the page.
//   node scripts/contrast.mjs            → the standard report
//   node scripts/contrast.mjs #abc #fff  → one pair
const lum = (hex) => {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const pairs = process.argv.length === 4
  ? [[process.argv[2], process.argv[3], "pair"]]
  : [
      ["#23262B", "#FAF9F6", "ink on paper"],
      ["#5D646C", "#FAF9F6", "ink-2 on paper"],
      ["#5D646C", "#FFFFFF", "ink-2 on surface"],
      ["#875A2E", "#FAF9F6", "bronze-ink on paper"],
      ["#875A2E", "#F0E8DC", "bronze-ink on bronze-wash"],
      ["#9B6B3F", "#FAF9F6", "bronze on paper (decorative)"],
      ["#C9BFAF", "#FAF9F6", "rule-strong on paper"],
      ["#DDD7CD", "#FAF9F6", "rule on paper"],
      ["#F0E8DC", "#FAF9F6", "bronze-wash on paper"],
      ["#303942", "#FAF9F6", "slate on paper"],
      ["#74767E", "#FAF9F6", "graphite-2 on paper"],
      ["#3A4046", "#FAF9F6", "graphite on paper"],
    ];
for (const [a, b, label] of pairs) console.log(`${ratio(a, b).toFixed(2).padStart(6)} : 1  ${a} / ${b}  ${label}`);
