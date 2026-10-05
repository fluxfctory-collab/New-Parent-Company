import type { CSSProperties } from "react";
import type { LogoKey } from "../assets/logos/logos";
import { content, type Service, type ServiceId, type Tier } from "../content";
import { Logo } from "./Logo";
import { QmeLink } from "./QmeLink";

/*
 * Pyramid geometry, in a 600×100 viewBox per band. The three bands share one width
 * and an equal height, so these points form a single continuous apex-up triangle
 * (base = 600, each band 100 high). Each shape is drawn as a full polygon in the
 * right-half colour with the left half on top, so palettes A/B (one colour) have no
 * seam and palette C gets its bronze/graphite split from the same markup.
 */
type Shape = { full: string; left: string; outlineL: string; outlineR: string; seam?: string };

const SHAPES: Record<Tier, Shape> = {
  apex: {
    full: "300,0 400,100 200,100",
    left: "300,0 300,100 200,100",
    outlineL: "M200,100 L300,0",
    outlineR: "M300,0 L400,100",
    seam: "M200,100 L400,100",
  },
  middle: {
    full: "200,0 400,0 500,100 100,100",
    left: "200,0 300,0 300,100 100,100",
    outlineL: "M100,100 L200,0",
    outlineR: "M400,0 L500,100",
    seam: "M100,100 L500,100",
  },
  foundation: {
    full: "100,0 500,0 600,100 0,100",
    left: "100,0 300,0 300,100 0,100",
    outlineL: "M0,100 L100,0 M0,100 L300,100",
    outlineR: "M500,0 L600,100 M300,100 L600,100",
  },
};

/** x of each band's right edge at mid-height, as a fraction of the pyramid width. */
const EDGE_AT_MID: Record<Tier, number> = { apex: 350 / 600, middle: 450 / 600, foundation: 550 / 600 };

/** Top-to-bottom drawing order for the whole-pyramid figures. */
const STACK: Tier[] = ["apex", "middle", "foundation"];

const LOGO: Record<ServiceId, { key: LogoKey; height: number }> = {
  merlin: { key: "merlin", height: 38 },
  "medical-advisory": { key: "medicalAdvisory", height: 36 },
  "civil-services": { key: "civilServices", height: 36 },
};

function TierShape({ tier }: { tier: Tier }) {
  const s = SHAPES[tier];
  return (
    <g className={`tier-shape tier-shape--${tier}`}>
      <polygon className="tier-shape__fill-r" points={s.full} />
      <polygon className="tier-shape__fill-l" points={s.left} />
      <path className="tier-shape__outline-l" d={s.outlineL} vectorEffect="non-scaling-stroke" />
      <path className="tier-shape__outline-r" d={s.outlineR} vectorEffect="non-scaling-stroke" />
      {s.seam && <path className="tier-shape__seam" d={s.seam} vectorEffect="non-scaling-stroke" />}
    </g>
  );
}

/** The whole pyramid in one SVG: the mobile overview, or a row glyph with one tier lit. */
function Pyramid({ className, active }: { className: string; active?: Tier }) {
  const band = 600 / 1.12 / 3; // base ≈ 1.12 × height, like the client diagram
  return (
    <svg
      className={className}
      viewBox={`0 0 600 ${Math.round(band * 3)}`}
      aria-hidden="true"
      focusable="false"
      overflow="visible"
    >
      {STACK.map((tier, i) => (
        <g
          key={tier}
          transform={`translate(0 ${(i * band).toFixed(2)}) scale(1 ${(band / 100).toFixed(4)})`}
          className={active && active !== tier ? "is-muted" : undefined}
        >
          <TierShape tier={tier} />
        </g>
      ))}
    </svg>
  );
}

function ServiceRow({ service }: { service: Service }) {
  const { id, tier, name, benefit, description, cta, href } = service;
  const ctaLabel = cta.replace(/\s*→$/, "");
  const ids = { name: `${id}-name`, cta: `${id}-cta`, benefit: `${id}-benefit`, description: `${id}-description` };
  // Accessible name = visible CTA text, plus the company name when the CTA doesn't carry it.
  const labelledBy = ctaLabel.includes(name) ? ids.cta : `${ids.name} ${ids.cta}`;
  const logo = LOGO[id];
  return (
    <a
      className={`service service--${tier}`}
      href={href}
      aria-labelledby={labelledBy}
      aria-describedby={`${ids.benefit} ${ids.description}`}
      style={{ "--edge": EDGE_AT_MID[tier].toFixed(4) } as CSSProperties}
    >
      <span className="service__tier" aria-hidden="true">
        <svg viewBox="0 0 600 100" preserveAspectRatio="none" overflow="visible" focusable="false">
          <TierShape tier={tier} />
        </svg>
      </span>
      <span className="service__connector" aria-hidden="true" />
      {/* __text is the full-height hit area of the row's right column; __panel is the
          visible block that takes the hover tint and the focus ring. */}
      <div className="service__text">
        <div className="service__panel">
          <div className="service__brand">
            <Pyramid className="service__glyph" active={tier} />
            <Logo name={logo.key} height={logo.height} alt="" className={`service__logo service__logo--${id}`} />
          </div>
          <div className="service__copy">
            <h3 id={ids.name} className="service__name">{name}</h3>
            <p id={ids.benefit} className="service__benefit">{benefit}</p>
            <p id={ids.description} className="service__description">{description}</p>
            <span className="service__cta">
              <span id={ids.cta} className="service__cta-label">{ctaLabel}</span>{" "}
              <span className="service__arrow" aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

export function ServiceSelector({ showQme, palette = "c" }: { showQme: boolean; palette?: "a" | "b" | "c" }) {
  const { heading, closingLine } = content.selector;
  return (
    <section className="selector-section" aria-labelledby="selector-title" data-palette={palette}>
      <div className="container">
        <h2 id="selector-title" className="selector-section__title">{heading}</h2>
        <Pyramid className="selector-overview" />
        {/* DOM order is foundation-first (Merlin → Medical Advisory → Civil Services);
            desktop CSS stacks the rows bottom-to-top with grid-row. */}
        <div className="selector">
          {content.services.map((s) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </div>
        <p className="selector-section__closing">{closingLine}</p>
        {showQme && <QmeLink className="qme--below" />}
      </div>
    </section>
  );
}
