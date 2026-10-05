import type { CSSProperties } from "react";
import type { LogoKey } from "../assets/logos/logos";
import { content, type Service, type ServiceId, type Tier } from "../content";
import { Logo } from "./Logo";
import { QmeLink } from "./QmeLink";
import { CONNECTOR_SIDE, PYRAMID, anchor, tierPoints } from "./pyramidGeometry";

const LOGO: Record<ServiceId, { key: LogoKey; height: number }> = {
  "civil-services": { key: "civilServices", height: 40 },
  "medical-advisory": { key: "medicalAdvisory", height: 40 },
  merlin: { key: "merlin", height: 42 },
};

/** Spoken position of each tier, for the tier links' accessible names. */
const TIER_WORDS: Record<Tier, string> = {
  apex: "top tier of the pyramid",
  middle: "middle tier of the pyramid",
  foundation: "foundation tier of the pyramid",
};

const ctaParts = (s: Service) => {
  const label = s.cta.replace(/\s*→$/, "");
  return { label, ownsName: label.includes(s.name) };
};

/** A company's description beside (desktop) or below (narrower screens) the pyramid. */
function Callout({ service }: { service: Service }) {
  const { id, tier, name, benefit, description, href } = service;
  const { label, ownsName } = ctaParts(service);
  const logo = LOGO[id];
  const a = anchor(tier);
  const ids = { title: `${id}-title`, cta: `${id}-cta` };
  return (
    <li
      className={`callout callout--${id} callout--${CONNECTOR_SIDE[tier]}`}
      style={{ "--ay": a.y.toFixed(4), "--logo-h": `${logo.height}px` } as CSSProperties}
    >
      {/* The original logo is the company's heading; its alt text is the name. */}
      <h3 className="callout__title" id={ids.title}>
        <Logo name={logo.key} height={logo.height} alt={name} className={`callout__logo callout__logo--${id}`} />
      </h3>
      <p className="callout__benefit">{benefit}</p>
      <p className="callout__description">{description}</p>
      <a className="callout__cta" href={href} aria-labelledby={ownsName ? ids.cta : `${ids.cta} ${ids.title}`}>
        <span id={ids.cta} className="callout__cta-label">{label}</span>{" "}
        <span className="callout__arrow" aria-hidden="true">→</span>
      </a>
    </li>
  );
}

export function ServiceSelector({ showQme }: { showQme: boolean }) {
  const { heading, closingLine } = content.selector;
  const { services } = content;
  return (
    <section className="selector-section" aria-labelledby="selector-title">
      <div className="container">
        <h2 id="selector-title" className="selector__title">{heading}</h2>

        <div className="stage">
          <div className="pyramid">
            <picture>
              <source
                type="image/webp"
                srcSet="/images/guardian-pyramid-640.webp 640w, /images/guardian-pyramid-960.webp 960w, /images/guardian-pyramid-1254.webp 1254w"
                sizes="(min-width: 1200px) 540px, (min-width: 960px) 500px, (min-width: 467px) 420px, 90vw"
              />
              {/* Decorative: the tier links and the descriptions carry its meaning. */}
              <img
                className="pyramid__image"
                src="/images/guardian-pyramid.png"
                width={PYRAMID.width}
                height={PYRAMID.height}
                alt=""
                decoding="async"
              />
            </picture>

            {/* One native link per tier; polygons trace each tier in normalized image
                coordinates, so the gaps between tiers are not links. */}
            <svg className="pyramid__links" viewBox="0 0 1 1" preserveAspectRatio="none">
              {services.map((s) => (
                <a key={s.id} href={s.href} className={`tier-link tier-link--${s.id}`} aria-label={`${s.name} — ${TIER_WORDS[s.tier]}`}>
                  <polygon points={tierPoints(s.tier)} vectorEffect="non-scaling-stroke" />
                </a>
              ))}
            </svg>

            {services.map((s) => {
              const a = anchor(s.tier);
              return (
                <span
                  key={s.id}
                  className={`connector connector--${s.id} connector--${CONNECTOR_SIDE[s.tier]}`}
                  style={{ "--ax": a.x.toFixed(4), "--ay": a.y.toFixed(4) } as CSSProperties}
                  aria-hidden="true"
                />
              );
            })}
          </div>

          <ul className="callouts">
            {services.map((s) => (
              <Callout key={s.id} service={s} />
            ))}
          </ul>
        </div>

        <p className="selector__statement">{closingLine}</p>
        {showQme && <QmeLink className="qme--below" />}
      </div>
    </section>
  );
}
