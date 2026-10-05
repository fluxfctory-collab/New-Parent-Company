import { content } from "../content";
import { Logo } from "./Logo";
import { QmeLink } from "./QmeLink";

export function Header({ showQme }: { showQme: boolean }) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a className="site-header__brand" href="#top">
          <Logo name="parent" height={50} alt={content.meta.title} className="site-header__logo" />
        </a>
        {showQme && <QmeLink />}
      </div>
    </header>
  );
}
