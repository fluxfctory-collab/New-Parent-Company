import { content } from "../content";

/** The phrase given the champagne-to-bronze treatment; the visible text is unchanged. */
const EMPHASIS = "medical insight";

/*
 * Faint contour lines behind the hero: closed, gently irregular loops around the
 * emphasised phrase, like a precise field. Computed once at render (static SVG).
 */
function contourPaths(): string[] {
  const cx = 720;
  const cy = 360;
  const paths: string[] = [];
  for (let i = 0; i < 7; i++) {
    const r = 150 + i * 88;
    const pts: [number, number][] = [];
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2;
      const wobble = 1 + 0.045 * Math.sin(3 * a + i * 0.9) + 0.025 * Math.cos(5 * a - i * 0.6);
      pts.push([cx + Math.cos(a) * r * 2.05 * wobble, cy + Math.sin(a) * r * 0.92 * wobble]);
    }
    // Catmull-Rom → cubic Bézier for a smooth closed curve.
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let k = 0; k < pts.length; k++) {
      const p0 = pts[(k - 1 + pts.length) % pts.length];
      const p1 = pts[k];
      const p2 = pts[(k + 1) % pts.length];
      const p3 = pts[(k + 2) % pts.length];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    paths.push(d + "Z");
  }
  return paths;
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
      {/* Decorative light: never announced, never in the way of the pointer. */}
      <div className="hero__atmosphere" aria-hidden="true">
        <div className="hero__field" />
        <div className="hero__glow" />
        <svg className="hero__contours" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" focusable="false">
          {contourPaths().map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
        <div className="hero__grain" />
      </div>
      <div className="container hero__inner">
        {/* Two editorial lines on wide screens ("…who rely on / medical insight and
            testimony."); ordinary wrapping below. The text itself is unchanged. */}
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
