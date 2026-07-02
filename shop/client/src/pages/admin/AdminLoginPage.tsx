import { useState } from "react";
import { Redirect } from "wouter";
import { useAdmin } from "@/contexts/AdminContext";

export default function AdminLoginPage() {
  const { loading, authenticated, configured, login } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "/verwaltung/dashboard";

  if (!loading && authenticated) {
    return <Redirect to={next.startsWith("/verwaltung") ? next : "/verwaltung/dashboard"} />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await login(password);
    setSubmitting(false);
    if (err) setError(err);
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <p className="admin-login__eyebrow">CSH Merch</p>
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
