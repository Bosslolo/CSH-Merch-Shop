import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { catalog } from "@/assets/images";
import { useAdmin } from "@/contexts/AdminContext";

const SHOP_DOCUMENT_TITLE = "CSH Merch — Christliche Schule im Hegau";
const ADMIN_LOGO = catalog.brand.logoWhite;

export default function AdminLoginPage() {
  const { loading, authenticated, configured, login } = useAdmin();
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "/verwaltung/dashboard";

  useEffect(() => {
    document.title = "Anmelden — CSH Verwaltung";
    return () => {
      document.title = SHOP_DOCUMENT_TITLE;
    };
  }, []);

  if (!loading && authenticated) {
    return <Redirect to={next.startsWith("/verwaltung") ? next : "/verwaltung/dashboard"} />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await login(password, rememberDevice);
    setSubmitting(false);
    if (err) setError(err);
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <img src={ADMIN_LOGO} alt="CSH Merch" className="admin-login__logo" width={140} height={56} />
        <h1 className="admin-login__title">Verwaltung</h1>
        <p className="admin-muted">Nur für autorisierte Schulmitarbeiter.</p>

        {!configured && !loading && (
          <p className="admin-alert">
            Admin-Zugang ist nicht konfiguriert. Setze <code>ADMIN_PASSWORD</code> in der Server-Umgebung.
          </p>
        )}

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-label">
            Passwort
            <input
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={!configured || submitting}
              required
            />
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              disabled={!configured || submitting}
            />
            <span>Dieses Geraet 24 Stunden merken</span>
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="admin-btn" disabled={!configured || submitting}>
            {submitting ? "Anmelden…" : "Anmelden"}
          </button>
        </form>

        <p className="admin-login__hint admin-muted">
          Diese Seite ist nicht im Shop verlinkt. Zugang nur mit Passwort.
        </p>
      </div>
    </div>
  );
}
