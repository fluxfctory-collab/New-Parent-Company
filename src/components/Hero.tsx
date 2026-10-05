import { content } from "../content";

/** The phrase given the champagne-to-bronze treatment; the visible text is unchanged. */
const EMPHASIS = "medical insight";

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
      {/* Decorative surface: the supplied photograph (glass panels lit in gold) under a
          dimming layer that keeps the words clear. Never announced, never in the way of
          the pointer. */}
      <div className="hero__atmosphere" aria-hidden="true">
        <div className="hero__photo" />
        <div className="hero__shade" />
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
