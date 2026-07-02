import { Link, useLocation } from "wouter";
import { useAdmin } from "@/contexts/AdminContext";

const NAV = [
  { href: "/verwaltung/dashboard", label: "Übersicht" },
  { href: "/verwaltung/bestellungen", label: "Bestellungen" },
  { href: "/verwaltung/bestand", label: "Bestand" },
  { href: "/verwaltung/abstimmung", label: "Abstimmung" },
] as const;

export default function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const [location] = useLocation();
  const { logout } = useAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <p className="admin-sidebar__eyebrow">CSH Merch</p>
          <p className="admin-sidebar__title">Verwaltung</p>
        </div>
        <nav className="admin-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav__link${location === item.href ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <Link href="/" className="admin-nav__link admin-nav__link--ghost">
            Zum Shop
          </Link>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void logout()}>
            Abmelden
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-main__header">
          <h1 className="admin-main__title">{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );
}
