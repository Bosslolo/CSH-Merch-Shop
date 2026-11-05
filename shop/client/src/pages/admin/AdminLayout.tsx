import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { catalog } from "@/assets/images";
import { useAdmin } from "@/contexts/AdminContext";

const SHOP_DOCUMENT_TITLE = "CSH Merch — Christliche Schule im Hegau";
const ADMIN_LOGO = catalog.brand.logoWhite;

const NAV = [
  { href: "/verwaltung/dashboard", label: "Übersicht" },
  { href: "/verwaltung/bestellungen", label: "Bestellungen" },
  { href: "/verwaltung/bestand", label: "Produkte" },
  { href: "/verwaltung/einstellungen", label: "Einstellungen" },
  { href: "/verwaltung/abstimmung", label: "Abstimmung" },
] as const;

function navActive(location: string, href: string) {
  return location === href;
}

export default function AdminLayout({
  children,
  title,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}) {
  const [location] = useLocation();
  const { logout } = useAdmin();
  const [navOpen, setNavOpen] = useState(false);

  function closeNav() {
    setNavOpen(false);
  }

  useEffect(() => {
    closeNav();
  }, [location]);

  useEffect(() => {
    document.title = `${title} — CSH Verwaltung`;
    return () => {
      document.title = SHOP_DOCUMENT_TITLE;
    };
  }, [title]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNav();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  const nav = (
    <>
      <div className="admin-sidebar__brand">
        <Link href="/verwaltung/dashboard" className="admin-sidebar__logo-link" onClick={closeNav}>
          <img src={ADMIN_LOGO} alt="CSH Merch" className="admin-sidebar__logo" width={120} height={48} />
        </Link>
        <p className="admin-sidebar__kicker">Verwaltung</p>
      </div>
      <nav className="admin-nav" aria-label="Hauptnavigation">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav__link${navActive(location, item.href) ? " is-active" : ""}`}
            onClick={closeNav}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="admin-sidebar__footer">
        <Link href="/" className="admin-nav__link admin-nav__link--ghost" onClick={closeNav}>
          Zum Shop
        </Link>
        <button
          type="button"
          className="admin-nav__link admin-nav__link--button"
          onClick={() => {
            closeNav();
            void logout();
          }}
        >
          Abmelden
        </button>
      </div>
    </>
  );

  return (
    <div className={`admin-shell${navOpen ? " is-nav-open" : ""}`}>
      <div className="admin-mobile-bar">
        <button
          type="button"
          className="admin-mobile-bar__toggle"
          onClick={() => setNavOpen(true)}
          aria-expanded={navOpen}
          aria-label="Menü öffnen"
        >
          Menü
        </button>
        <Link href="/verwaltung/dashboard" className="admin-mobile-bar__brand">
          <img src={ADMIN_LOGO} alt="" className="admin-mobile-bar__logo" width={88} height={36} />
          <span className="admin-mobile-bar__brand-text">Verwaltung</span>
        </Link>
        <span className="admin-mobile-bar__spacer" aria-hidden="true" />
      </div>

      {navOpen && (
        <button type="button" className="admin-nav-backdrop" aria-label="Menü schließen" onClick={closeNav} />
      )}

      <aside className="admin-sidebar admin-sidebar--desktop">{nav}</aside>
      <aside className={`admin-sidebar admin-sidebar--drawer${navOpen ? " is-open" : ""}`} aria-hidden={!navOpen}>
        <div className="admin-drawer__head">
          <button type="button" className="admin-mobile-bar__toggle" onClick={closeNav}>
            Schließen
          </button>
        </div>
        {nav}
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__lead">
            <h1 className="admin-topbar__title">{title}</h1>
          </div>
          {actions ? <div className="admin-topbar__actions">{actions}</div> : null}
        </header>
        <div className="admin-main__content">{children}</div>
      </main>
    </div>
  );
}
