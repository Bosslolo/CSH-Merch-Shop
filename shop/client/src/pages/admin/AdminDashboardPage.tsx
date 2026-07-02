import { useEffect, useState } from "react";
import { AdminGuard } from "@/contexts/AdminContext";
import { fetchDashboard } from "@/lib/admin-api";
import AdminLayout from "./AdminLayout";

interface DashboardData {
  orders: { total: number; pending: number; revenue: number };
  lowStock: { slug: string; name: string; size: string; quantity: number }[];
  votes: { totalVotes: number; tallies: Record<string, number> };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setError("Daten konnten nicht geladen werden."));
  }, []);

  return (
    <AdminGuard>
      <AdminLayout title="Übersicht">
        {error && <p className="admin-error">{error}</p>}
        {!data && !error && <p className="admin-muted">Lade…</p>}
        {data && (
          <div className="admin-grid admin-grid--3">
            <article className="admin-stat">
              <p className="admin-stat__label">Bestellungen gesamt</p>
              <p className="admin-stat__value">{data.orders.total}</p>
            </article>
            <article className="admin-stat">
              <p className="admin-stat__label">Offen (pending)</p>
              <p className="admin-stat__value">{data.orders.pending}</p>
            </article>
            <article className="admin-stat">
              <p className="admin-stat__label">Umsatz (ohne storniert)</p>
              <p className="admin-stat__value">{data.orders.revenue} €</p>
            </article>
          </div>
        )}

        {data && data.lowStock.length > 0 && (
          <section className="admin-section">
            <h2 className="admin-section__title">Niedriger Bestand</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th>Grösse</th>
                    <th>Bestand</th>
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

        {data && (
          <section className="admin-section">
            <h2 className="admin-section__title">Design-Abstimmung</h2>
            <p className="admin-muted">{data.votes.totalVotes} Stimmen insgesamt</p>
            <ul className="admin-list">
              {Object.entries(data.votes.tallies).map(([id, count]) => (
                <li key={id}>
                  {id}: <strong>{count}</strong>
                </li>
              ))}
            </ul>
          </section>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
