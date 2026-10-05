/**
 * Single source of truth for every visible string on the page.
 * Copy is verbatim from "Guardian Group Landing .docx" ("Card copy, as it appears"
 * for the services). `npm run check:manifest` verifies it against the document.
 */
export const content = {
  meta: {
    title: "The Guardian Group",
    // Re-uses the hero subhead verbatim; no new copy.
    description:
      "Medical Intelligence Services — record analysis, physician reports, and expert testimony.",
  },
  hero: {
    headline:
      "For the litigation teams who rely on medical insight and testimony.",
    subhead:
      "Medical Intelligence Services — record analysis, physician reports, and expert testimony.",
    epigraph: {
      quote: "Knowledge itself is power.",
      attribution: "— Francis Bacon", // full source string: "Knowledge itself is power. — Francis Bacon"
    },
  },
  selector: {
    heading: "Match the medicine to the matter.",
    // Source ends in "between.la" — preserved on purpose. See HANDOVER.md.
    closingLine:
      "Every case rests on the record. Few warrant a specialist. Most sit somewhere in between.la",
  },
  // Top-to-bottom order of the pyramid (apex first). This is also the DOM, reading,
  // focus and mobile order: Civil Services → Medical Advisory → Merlin.
  services: [
    {
      id: "civil-services",
      tier: "apex",
      name: "Guardian Civil Services",
      benefit: "Board-certified specialists who hold up under challenge.",
      description:
        "Retained experts for trial cases and independent evaluations.",
      cta: "Learn more →",
      href: "https://www.guardiancivil.services/",
    },
    {
      id: "medical-advisory",
      tier: "middle",
      name: "Guardian Medical Advisory",
      benefit: "Substantiated medicine for the cases that settle.",
      description:
        "Lower-cost generalist medical opinion on causation, future care, and other areas of dispute.",
      cta: "Learn more →",
      href: "https://www.guardianadvisory.group/",
    },
    {
      id: "merlin",
      tier: "foundation",
      name: "Merlin",
      benefit: "Physician-grade command of the complete record.",
      description:
        "The whole production, read and analyzed. Not just a chronology.",
      cta: "Explore Merlin →",
      href: "https://www.merlin.law/",
    },
  ],
  qme: { label: "QME", href: "https://www.theguardian.group/" },
} as const;

export type Service = (typeof content.services)[number];
export type ServiceId = Service["id"];
export type Tier = Service["tier"];
