import { Link } from "wouter";
import { scrollToTop } from "@/lib/scroll";

export default function SiteFooter() {
  return (
    <footer className="csh-footer">
      <div className="csh-footer__grid">
        <div>
          <p className="csh-footer__logo">CSH Merch</p>
          <p className="csh-footer__text">Christliche Schule im Hegau · Hilzingen</p>
        </div>
        <div>
          <p className="csh-label">Kollektion</p>
          <ul className="csh-footer__links">
            <li>
              <Link href="/kollektion/gross" onClick={() => scrollToTop()}>
                Grosse Kollektion
              </Link>
            </li>
            <li>
              <Link href="/kollektion/klein" onClick={() => scrollToTop()}>
                Kleine Kollektion
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="csh-label">Schule</p>
          <ul className="csh-footer__links">
            <li>
              <a href="https://www.cs-bodensee.de" target="_blank" rel="noreferrer">
                cs-bodensee.de
              </a>
            </li>
            <li>
              <a href="mailto:schuelerfirma@cs-bodensee.de">Kontakt</a>
            </li>
          </ul>
        </div>
      </div>
      <p className="csh-footer__legal">© {new Date().getFullYear()} CSH Merch · Schülerfirma</p>
    </footer>
  );
}
