import { content } from "../content";

/**
 * The legacy QME site. A quiet outlined link; the visible text stays "QME" and the
 * accessible name starts with it (aria-label is not visible copy — see HANDOVER.md).
 */
export function QmeLink({ className = "" }: { className?: string }) {
  return (
    <a className={`qme ${className}`.trim()} href={content.qme.href} aria-label={`${content.qme.label} (legacy site)`}>
      {content.qme.label}
    </a>
  );
}
