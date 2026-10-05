import { content } from "../content";

/**
 * The legacy QME site: a small brushed-gold control. The visible text stays "QME" and
 * the accessible name starts with it (aria-label is not visible copy — see HANDOVER.md).
 * The label sits in its own span so the reflective sweep passes beneath the lettering.
 */
export function QmeLink({ className = "" }: { className?: string }) {
  return (
    <a className={`qme ${className}`.trim()} href={content.qme.href} aria-label={`${content.qme.label} (legacy site)`}>
      <span className="qme__label">{content.qme.label}</span>
    </a>
  );
}
