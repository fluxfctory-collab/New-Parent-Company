import { content } from "../content";

export function Hero() {
  const { headline, subhead, epigraph } = content.hero;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__main">
          <h1 id="hero-title" className="hero__title">{headline}</h1>
          <p className="hero__subhead">{subhead}</p>
        </div>
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
