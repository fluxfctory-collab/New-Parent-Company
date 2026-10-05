import { content } from "../content";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <Logo name="parent" height={32} alt={content.meta.title} className="site-footer__logo" loading="lazy" />
        <ul className="site-footer__links">
          {content.services.map((s) => (
            <li key={s.id}>
              <a href={s.href}>{s.name}</a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
