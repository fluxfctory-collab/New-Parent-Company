import { content } from "../content";

/** The phrase given the champagne-to-bronze treatment; the visible text is unchanged. */
const EMPHASIS = "medical insight";

type Pt = readonly [number, number];

/**
 * The hero's background: a few large, dark angular plates, lifted off a near-black ground
 * by soft shadows and lit along their upper edges, like embossed metal. Static SVG in a
 * 1440 × 720 field (cropped to fill the hero). Grey levels are 0–255 at the plate's lit
 * and far ends; a fold divides a plate into a lit and a shaded face; a bevel engraves an
 * inset outline a set distance inside the plate's edge.
 */
interface Plate {
  pts: readonly Pt[];
  tone: readonly [number, number];
  angle: number;
  fold?: readonly [Pt, Pt];
  bevel?: number;
}

const PLATES: readonly Plate[] = [
  // at the edges, barely lifted
  { pts: [[-40, 40], [210, -10], [262, 300], [150, 780], [-40, 780]], tone: [30, 17], angle: 100 },
  { pts: [[1236, -30], [1480, -30], [1480, 560], [1352, 452]], tone: [29, 17], angle: 110 },
  { pts: [[1150, 780], [1310, 560], [1480, 600], [1480, 780]], tone: [26, 16], angle: 90 },
  // the main form: two overlapping plates, both folded; the front one bevelled
  { pts: [[296, 96], [742, 22], [884, 250], [812, 780], [428, 780], [246, 430]], tone: [36, 16], angle: 120, fold: [[742, 22], [560, 780]] },
  { pts: [[640, 128], [1012, 58], [1146, 334], [1042, 642], [770, 780], [690, 470]], tone: [42, 17], angle: 130, fold: [[1012, 58], [880, 780]], bevel: 26 },
];

const pts = (p: readonly Pt[]) => p.map(([x, y]) => `${+x.toFixed(1)},${+y.toFixed(1)}`).join(" ");

/** Everything to the right of the line through a and b (the plate's shaded face). */
function rightOf([a, b]: readonly [Pt, Pt]): Pt[] {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const k = 4;
  const a2: Pt = [a[0] - dx * k, a[1] - dy * k];
  const b2: Pt = [b[0] + dx * k, b[1] + dy * k];
  return [a2, [a2[0] + 4000, a2[1]], [b2[0] + 4000, b2[1]], b2];
}

/** The outline moved inward by d on every edge (convex plates). */
function inset(p: readonly Pt[], d: number): Pt[] {
  const n = p.length;
  const cx = p.reduce((s, q) => s + q[0], 0) / n;
  const cy = p.reduce((s, q) => s + q[1], 0) / n;
  const lines = p.map((q, i) => {
    const r = p[(i + 1) % n];
    const [dx, dy] = [r[0] - q[0], r[1] - q[1]];
    const len = Math.hypot(dx, dy);
    let [nx, ny] = [-dy / len, dx / len];
    if ((cx - (q[0] + r[0]) / 2) * nx + (cy - (q[1] + r[1]) / 2) * ny < 0) [nx, ny] = [-nx, -ny];
    return { o: [q[0] + nx * d, q[1] + ny * d] as Pt, v: [dx, dy] as Pt };
  });
  const cross = (u: Pt, v: Pt) => u[0] * v[1] - u[1] * v[0];
  return lines.map((l, i) => {
    const prev = lines[(i - 1 + n) % n];
    const t = cross([l.o[0] - prev.o[0], l.o[1] - prev.o[1]], l.v) / cross(prev.v, l.v);
    return [prev.o[0] + prev.v[0] * t, prev.o[1] + prev.v[1] * t];
  });
}

function HeroPlates() {
  return (
    <svg className="hero__plates" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <filter id="hero-lift" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="6" dy="22" stdDeviation="26" floodColor="#000" floodOpacity="0.6" />
        </filter>
        <linearGradient id="hero-edge" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.13" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hero-light" cx="0.46" cy="0.08" r="0.55" gradientTransform="translate(0.23 0) scale(0.5 1)">
          <stop offset="0" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        {PLATES.map((p, i) => (
          <linearGradient key={i} id={`hero-tone-${i}`} x1="0" y1="0" x2="0" y2="1" gradientTransform={`rotate(${p.angle - 90} 0.5 0.5)`}>
            <stop offset="0" stopColor={`rgb(${p.tone[0]} ${p.tone[0]} ${p.tone[0]})`} />
            <stop offset="1" stopColor={`rgb(${p.tone[1]} ${p.tone[1]} ${p.tone[1]})`} />
          </linearGradient>
        ))}
        {PLATES.map((p, i) => (p.fold ? <clipPath key={i} id={`hero-clip-${i}`}><polygon points={pts(p.pts)} /></clipPath> : null))}
      </defs>
      {PLATES.map((p, i) => (
        <g key={i}>
          <polygon points={pts(p.pts)} fill={`url(#hero-tone-${i})`} filter="url(#hero-lift)" />
          {p.fold && (
            <g clipPath={`url(#hero-clip-${i})`}>
              <polygon points={pts(rightOf(p.fold))} fill="rgb(0 0 0 / 0.3)" />
              <line x1={p.fold[0][0]} y1={p.fold[0][1]} x2={p.fold[1][0]} y2={p.fold[1][1]} className="hero__ridge" />
            </g>
          )}
          <polygon points={pts(p.pts)} className="hero__edge" />
          {p.bevel && (
            <>
              <polygon points={pts(inset(p.pts, p.bevel))} className="hero__groove" />
              <polygon points={pts(inset(p.pts, p.bevel).map(([x, y]) => [x + 0.8, y + 1.4]))} className="hero__edge" />
            </>
          )}
        </g>
      ))}
      <rect width="1440" height="720" fill="url(#hero-light)" />
    </svg>
  );
}

/** Keeps the word before the em dash and the dash together, so no line starts with "—". */
function keepDashWithWord(text: string) {
  const m = text.match(/^(.*?)(\S+ \u2014)( .*)$/);
  if (!m) return text;
  return (
    <>
      {m[1]}
      <span className="nowrap">{m[2]}</span>
      {m[3]}
    </>
  );
}

export function Hero() {
  const { headline, subhead, epigraph } = content.hero;
  const at = headline.indexOf(EMPHASIS);
  if (at < 0) throw new Error(`Hero headline no longer contains "${EMPHASIS}"`);
  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* Decorative surface: never announced, never in the way of the pointer. */}
      <div className="hero__atmosphere" aria-hidden="true">
        <HeroPlates />
        <div className="hero__shade" />
        <div className="hero__grain" />
      </div>
      <div className="container hero__inner">
        {/* Two lines on wide screens ("…who rely on / medical insight and testimony.");
            ordinary wrapping below. The text itself is unchanged. */}
        <h1 id="hero-title" className="hero__title">
          <span className="hero__line">{headline.slice(0, at).trimEnd()}</span>{" "}
          <span className="hero__line">
            <span className="hero__em">{EMPHASIS}</span>
            {headline.slice(at + EMPHASIS.length)}
          </span>
        </h1>
        <p className="hero__subhead">{keepDashWithWord(subhead)}</p>
        <figure className="epigraph">
          <blockquote className="epigraph__quote">
            <p>{epigraph.quote}</p>
          </blockquote>
          <figcaption className="epigraph__attribution">{epigraph.attribution}</figcaption>
        </figure>
      </div>
    </section>
  );
}
