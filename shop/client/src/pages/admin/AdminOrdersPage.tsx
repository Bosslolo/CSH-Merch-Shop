import { useEffect, useState } from "react";
import { AdminGuard } from "@/contexts/AdminContext";
import { fetchAdminOrders, updateOrderStatus } from "@/lib/admin-api";
import AdminLayout from "./AdminLayout";

interface Order {
  id: string;
  status: string;
  customer: { name: string; email: string; grade?: string; notes?: string };
  items: { productName: string; size: string; quantity: number; unitPrice: number }[];
  total: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Offen",
  confirmed: "Bestätigt",
  fulfilled: "Ausgegeben",
  cancelled: "Storniert",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAdminOrders();
      setOrders(data.orders ?? []);
      setError(null);
    } catch {
      setError("Bestellungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeStatus(orderId: string, status: string) {
    try {
      await updateOrderStatus(orderId, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Aktualisieren.");
    }
  }

  return (
    <AdminGuard>
      <AdminLayout title="Bestellungen">
        {error && <p className="admin-error">{error}</p>}
        {loading && <p className="admin-muted">Lade…</p>}
        {!loading && orders.length === 0 && <p className="admin-muted">Noch keine Bestellungen.</p>}

        <div className="admin-orders">
          {orders.map((order) => (
            <article key={order.id} className="admin-order-card">
              <header className="admin-order-card__head">
                <div>
                  <p className="admin-order-card__id">{order.id}</p>
                  <p className="admin-muted">
                    {new Date(order.createdAt).toLocaleString("de-DE")} · {order.customer.name} ·{" "}
                    {order.customer.email}
                  </p>
                  {order.customer.grade && <p className="admin-muted">Klasse/Stufe: {order.customer.grade}</p>}
                </div>
                <div className="admin-order-card__actions">
                  <select
                    className="admin-select"
                    value={order.status}
                    onChange={(e) => void changeStatus(order.id, e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="admin-order-card__total">{order.total} €</p>
                </div>
              </header>
              <ul className="admin-order-card__items">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.quantity}× {item.productName} ({item.size}) — {item.unitPrice} €
                  </li>
                ))}
              </ul>
              {order.customer.notes && (
                <p className="admin-order-card__notes">
                  <strong>Anmerkung:</strong> {order.customer.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
