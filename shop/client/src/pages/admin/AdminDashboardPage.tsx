import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminGuard } from "@/contexts/AdminContext";
import { fetchDashboard } from "@/lib/admin-api";
import AdminLayout from "./AdminLayout";

interface DashboardData {
  orders: { total: number; pending: number; revenue: number };
  unpaid?: number;
  ready?: number;
  lowStock: { slug: string; name: string; size: string; quantity: number }[];
  votes: { totalVotes: number; tallies: Record<string, number> };
  votingEnabled?: boolean;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setError("Daten konnten nicht geladen werden."));
  }, []);

  const unpaid = data?.unpaid ?? 0;
  const ready = data?.ready ?? 0;
  const pending = data?.orders.pending ?? 0;
  const low = data?.lowStock.length ?? 0;
  const hasTodos = pending > 0 || unpaid > 0 || ready > 0 || low > 0;

  return (
    <AdminGuard>
      <AdminLayout title="Übersicht">
        {error && <p className="admin-error">{error}</p>}
        {!data && !error && <p className="admin-muted">Lade…</p>}

        {data && (
          <>
            <div className="admin-grid admin-grid--3">
              <Link href="/verwaltung/bestellungen" className="admin-stat">
                <p className="admin-stat__label">Offen</p>
                <p className="admin-stat__value">{pending}</p>
              </Link>
              <Link href="/verwaltung/bestellungen" className="admin-stat admin-stat--warn">
                <p className="admin-stat__label">Unbezahlt</p>
                <p className="admin-stat__value">{unpaid}</p>
              </Link>
              <article className="admin-stat">
                <p className="admin-stat__label">Umsatz bezahlt</p>
                <p className="admin-stat__value">{data.orders.revenue} €</p>
              </article>
            </div>

            <section className="admin-section">
              <h2 className="admin-section__title">Heute erledigen</h2>
              {!hasTodos ? (
                <p className="admin-todo__empty">Alles erledigt — keine offenen Aufgaben.</p>
              ) : (
                <ul className="admin-todo">
                  {pending > 0 && (
                    <li>
                      <Link href="/verwaltung/bestellungen" className="admin-todo__item">
                        <div>
                          <strong>{pending} offene Bestellung{pending === 1 ? "" : "en"}</strong>
                          <p className="admin-todo__meta">Prüfen und weiterleiten</p>
                        </div>
                        <span className="admin-muted">Öffnen</span>
                      </Link>
                    </li>
                  )}
                  {unpaid > 0 && (
                    <li>
                      <Link href="/verwaltung/bestellungen" className="admin-todo__item">
                        <div>
                          <strong>{unpaid} unbezahlt</strong>
                          <p className="admin-todo__meta">Zahlungseingang bestätigen</p>
                        </div>
                        <span className="admin-muted">Öffnen</span>
                      </Link>
                    </li>
                  )}
                  {ready > 0 && (
                    <li>
                      <Link href="/verwaltung/bestellungen" className="admin-todo__item">
                        <div>
                          <strong>{ready} abholbereit</strong>
                          <p className="admin-todo__meta">Bezahlt & bestätigt</p>
                        </div>
                        <span className="admin-muted">Öffnen</span>
                      </Link>
                    </li>
                  )}
                  {low > 0 && (
                    <li>
                      <Link href="/verwaltung/bestand" className="admin-todo__item">
                        <div>
                          <strong>{low} Variante{low === 1 ? "" : "n"} mit wenig Bestand</strong>
                          <p className="admin-todo__meta">≤ 3 Stück</p>
                        </div>
                        <span className="admin-muted">Bestand</span>
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </section>

            {low > 0 && (
              <section className="admin-section">
                <h2 className="admin-section__title">Niedriger Bestand</h2>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Produkt</th>
                        <th>Grösse</th>
                        <th>Stück</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lowStock.map((row) => (
                        <tr key={`${row.slug}-${row.size}`}>
                          <td>{row.name}</td>
                          <td>{row.size}</td>
                          <td className="admin-warn">{row.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {data.votingEnabled && (
              <section className="admin-section">
                <h2 className="admin-section__title">Abstimmung</h2>
                <p className="admin-muted">{data.votes.totalVotes} Stimmen</p>
                <ul className="admin-list">
                  {Object.entries(data.votes.tallies).map(([id, count]) => (
                    <li key={id}>
                      {id}: <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: "0.75rem" }}>
                  <Link href="/verwaltung/abstimmung" className="admin-muted">
                    Details ansehen →
                  </Link>
                </p>
              </section>
            )}
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
