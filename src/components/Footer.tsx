import { content, type ServiceId } from "../content";
import { Logo } from "./Logo";

/** Footer order as supplied: Merlin, Guardian Medical Advisory, Guardian Civil Services. */
const FOOTER_ORDER: ServiceId[] = ["merlin", "medical-advisory", "civil-services"];

export function Footer() {
  const links = FOOTER_ORDER.map((id) => content.services.find((s) => s.id === id)!);
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <Logo name="parent" height={34} alt={content.meta.title} className="site-footer__logo" loading="lazy" />
        <ul className="site-footer__links">
          {links.map((s) => (
            <li key={s.id}>
              <a href={s.href}>{s.name}</a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
