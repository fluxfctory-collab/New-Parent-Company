import type { LogoKey } from "../assets/logos/logos";
import { content, type Service, type ServiceId, type Tier } from "../content";
import { Logo } from "./Logo";
import { QmeLink } from "./QmeLink";

/*
 * Pyramid geometry, in a 600×100 viewBox per level. The three levels share one width
 * and an equal height, so these points form a single continuous apex-up triangle
 * (base = 600, each level 100 high). Each level is one coherent surface:
 *   surface — the level's tone,
 *   light   — a faint left-to-right falloff shared by all three (no extra bands),
 *   edge    — fine metallic gold, drawn once per line (a level draws its sides and its
 *             bottom; its top is the bottom of the level above),
 *   ring    — the full perimeter in gold, shown on hover/focus.
 */
type Shape = { surface: string; edge: string; ring: string };

const SHAPES: Record<Tier, Shape> = {
  apex: {
    surface: "300,0 400,100 200,100",
    edge: "M200,100 L300,0 L400,100 Z",
    ring: "M200,100 L300,0 L400,100 Z",
  },
  middle: {
    surface: "200,0 400,0 500,100 100,100",
    edge: "M200,0 L100,100 L500,100 L400,0",
    ring: "M200,0 L400,0 L500,100 L100,100 Z",
  },
  foundation: {
    surface: "100,0 500,0 600,100 0,100",
    edge: "M100,0 L0,100 L600,100 L500,0",
    ring: "M100,0 L500,0 L600,100 L0,100 Z",
  },
};

/** Top-to-bottom order of the levels; also each level's offset within the whole pyramid. */
const STACK: Tier[] = ["apex", "middle", "foundation"];

/* Gold along the pyramid's height (0 = apex tip, 1 = base): light catches the capstone,
   then the metal deepens toward the foundation. */
const EDGE_STOPS = [0, 0.06, 0.14, 0.24, 0.36, 0.7, 1];

const LOGO: Record<ServiceId, { key: LogoKey; height: number }> = {
  merlin: { key: "merlin", height: 46 },
  "medical-advisory": { key: "medicalAdvisory", height: 44 },
  "civil-services": { key: "civilServices", height: 44 },
};

/** One level. `uid` keeps gradient ids unique when several pyramids share the page. */
function TierShape({ tier, uid }: { tier: Tier; uid: string }) {
  const s = SHAPES[tier];
  const row = STACK.indexOf(tier);
  const edgeId = `${uid}-${tier}-edge`;
  const lightId = `${uid}-${tier}-light`;
  return (
    <g className={`tier-shape tier-shape--${tier}`}>
      <defs>
        {/* User space spans the whole pyramid (y −100·row … 300 − 100·row in this level's
            units), so the gold reads as one continuous piece of metal across the levels. */}
        <linearGradient id={edgeId} gradientUnits="userSpaceOnUse" x1="0" y1={-100 * row} x2="0" y2={300 - 100 * row}>
          {EDGE_STOPS.map((offset, i) => (
            <stop key={offset} offset={offset} className={`edge-stop-${i}`} />
          ))}
        </linearGradient>
        <linearGradient id={lightId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="600" y2="0">
          <stop offset="0" className="light-stop-0" />
          <stop offset="0.55" className="light-stop-1" />
          <stop offset="1" className="light-stop-2" />
        </linearGradient>
      </defs>
      <polygon className="tier-shape__surface" points={s.surface} />
      <polygon className="tier-shape__light" points={s.surface} fill={`url(#${lightId})`} />
      <path className="tier-shape__edge" d={s.edge} stroke={`url(#${edgeId})`} vectorEffect="non-scaling-stroke" />
      <path className="tier-shape__ring" d={s.ring} stroke={`url(#${edgeId})`} vectorEffect="non-scaling-stroke" />
    </g>
  );
}

/** The whole pyramid in one SVG: the mobile overview, or a row glyph with one level lit. */
function Pyramid({ className, uid, active }: { className: string; uid: string; active?: Tier }) {
  const band = 600 / 1.12 / 3; // base ≈ 1.12 × height, like the client diagram
  return (
    <svg className={className} viewBox={`0 0 600 ${Math.round(band * 3)}`} aria-hidden="true" focusable="false">
      {STACK.map((tier, i) => (
        <g
          key={tier}
          transform={`translate(0 ${(i * band).toFixed(2)}) scale(1 ${(band / 100).toFixed(4)})`}
          className={active && active !== tier ? "is-muted" : undefined}
        >
          <TierShape tier={tier} uid={uid} />
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
    >
      <span className="service__tier" aria-hidden="true">
        <svg viewBox="0 0 600 100" preserveAspectRatio="none" overflow="visible" focusable="false">
          <TierShape tier={tier} uid={`${id}-level`} />
        </svg>
      </span>
      <span className="service__connector" aria-hidden="true" />
      {/* __text is the full-height hit area of the row's right column; __panel is the
          visible block that takes the hover wash and the focus ring. */}
      <div className="service__text">
        <div className="service__panel">
          <div className="service__brand">
            <Pyramid className="service__glyph" uid={`${id}-glyph`} active={tier} />
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

export function ServiceSelector({ showQme }: { showQme: boolean }) {
  const { heading, closingLine } = content.selector;
  return (
    <section className="selector-section" aria-labelledby="selector-title">
      <div className="container">
        <h2 id="selector-title" className="selector-section__title">{heading}</h2>
        <Pyramid className="selector-overview" uid="overview" />
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
