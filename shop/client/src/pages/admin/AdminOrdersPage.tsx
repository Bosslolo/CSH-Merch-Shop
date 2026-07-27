import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/contexts/AdminContext";
import {
  fetchAdminOrders,
  markOrderPaid,
  resetOrderPayment,
  updateOrderStatus,
} from "@/lib/admin-api";
import AdminLayout from "./AdminLayout";

interface Order {
  id: string;
  status: string;
  customer: { name: string; email: string; grade?: string; notes?: string };
  items: { productName: string; size: string; quantity: number; unitPrice: number }[];
  total: number;
  createdAt: string;
  paymentStatus?: string;
  paymentMethod?: string;
}

type FilterKey = "all" | "open" | "unpaid" | "ready" | "cancelled";

const STATUS_FLOW = [
  { value: "pending", label: "Offen" },
  { value: "confirmed", label: "Bestätigt" },
  { value: "fulfilled", label: "Ausgegeben" },
] as const;

const PAY_LABELS: Record<string, string> = {
  unpaid: "Unbezahlt",
  pending: "Wartend",
  paid: "Bezahlt",
};

function matchesFilter(order: Order, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "cancelled") return order.status === "cancelled";
  if (filter === "open") return order.status === "pending";
  if (filter === "unpaid") {
    return order.status !== "cancelled" && order.paymentStatus !== "paid";
  }
  if (filter === "ready") {
    return order.status === "confirmed" && order.paymentStatus === "paid";
  }
  return true;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"paypal" | "cash">("cash");
  const [payRef, setPayRef] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchAdminOrders();
      setOrders(data.orders ?? []);
      setError(null);
      setLastRefresh(new Date());
    } catch {
      if (!silent) setError("Bestellungen konnten nicht geladen werden.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(true), 30_000);
    return () => clearInterval(timer);
  }, [load]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      open: orders.filter((o) => o.status === "pending").length,
      unpaid: orders.filter((o) => o.status !== "cancelled" && o.paymentStatus !== "paid").length,
      ready: orders.filter((o) => o.status === "confirmed" && o.paymentStatus === "paid").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }),
    [orders]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesFilter(order, filter)) return false;
      if (!q) return true;
      const hay = [
        order.id,
        order.customer.name,
        order.customer.email,
        order.customer.grade ?? "",
        order.customer.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, filter, query]);

  async function setStatus(order: Order, status: string) {
    if (status === order.status) return;
    if (status === "cancelled") {
      if (!window.confirm(`Bestellung ${order.id} wirklich stornieren?`)) return;
    }
    try {
      await updateOrderStatus(order.id, status);
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status konnte nicht geändert werden.");
    }
  }

  async function submitPaid(orderId: string) {
    if (payMethod === "paypal" && !payRef.trim()) {
      setError("PayPal-Referenz fehlt.");
      return;
    }
    if (
      !window.confirm(
        payMethod === "paypal"
          ? `PayPal für ${orderId} bestätigen? (Shop prüft PayPal nicht automatisch.)`
          : `Barzahlung für ${orderId} bestätigen?`
      )
    ) {
      return;
    }
    try {
      await markOrderPaid(orderId, payMethod, { paymentReference: payRef.trim() });
      setPayFor(null);
      setPayRef("");
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zahlung konnte nicht markiert werden.");
    }
  }

  async function onResetPayment(orderId: string) {
    if (!window.confirm(`Zahlungsart für ${orderId} zurücksetzen?`)) return;
    try {
      await resetOrderPayment(orderId);
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zurücksetzen fehlgeschlagen.");
    }
  }

  const chips: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "Alle", count: counts.all },
    { key: "open", label: "Offen", count: counts.open },
    { key: "unpaid", label: "Unbezahlt", count: counts.unpaid },
    { key: "ready", label: "Abholbereit", count: counts.ready },
    { key: "cancelled", label: "Storniert", count: counts.cancelled },
  ];

  return (
    <AdminGuard>
      <AdminLayout
        title="Bestellungen"
        actions={
          <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => void load()}>
            Aktualisieren
          </button>
        }
      >
        {error && <p className="admin-error">{error}</p>}

        <div className="admin-toolbar">
          <div className="admin-toolbar__left" style={{ flex: 1 }}>
            <input
              className="admin-input admin-search"
              type="search"
              placeholder="Suche: Name, E-Mail, Bestell-ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <p className="admin-muted">
            {lastRefresh ? `Stand ${lastRefresh.toLocaleTimeString("de-DE")}` : ""}
          </p>
        </div>

        <div className="admin-chips">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className={`admin-chip${filter === chip.key ? " is-active" : ""}`}
              onClick={() => setFilter(chip.key)}
            >
              {chip.label}
              <span className="admin-chip__count">{chip.count}</span>
            </button>
          ))}
        </div>

        {loading && <p className="admin-muted">Lade…</p>}
        {!loading && filtered.length === 0 && (
          <p className="admin-empty">
            {orders.length === 0 ? "Keine Bestellungen." : "Keine Treffer für diese Filter."}
          </p>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="admin-orders-desktop admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bestellung</th>
                    <th>Kunde</th>
                    <th>Summe</th>
                    <th>Zahlung</th>
                    <th>Status</th>
                    <th>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const isOpen = expanded === order.id;
                    const payLabel = PAY_LABELS[order.paymentStatus || "unpaid"] || "Unbezahlt";
                    const paid = order.paymentStatus === "paid";
                    return (
                      <Fragment key={order.id}>
                        <tr
                          className={`is-clickable${isOpen ? " is-expanded" : ""}`}
                          onClick={() => setExpanded(isOpen ? null : order.id)}
                        >
                          <td>
                            <strong>{order.id}</strong>
                            <div className="admin-muted">
                              {new Date(order.createdAt).toLocaleString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td>
                            {order.customer.name}
                            <div className="admin-muted">{order.customer.email}</div>
                          </td>
                          <td>
                            <strong>{order.total} €</strong>
                          </td>
                          <td>
                            <span
                              className={`admin-badge${
                                paid ? " admin-badge--ok" : " admin-badge--warn"
                              }`}
                            >
                              {payLabel}
                              {order.paymentMethod ? ` · ${order.paymentMethod}` : ""}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="admin-status-row">
                              {STATUS_FLOW.map((s) => (
                                <button
                                  key={s.value}
                                  type="button"
                                  className={`admin-status-btn${
                                    order.status === s.value ? " is-active" : ""
                                  }`}
                                  disabled={order.status === "cancelled"}
                                  onClick={() => void setStatus(order, s.value)}
                                >
                                  {s.label}
                                </button>
                              ))}
                              <button
                                type="button"
                                className={`admin-status-btn is-danger${
                                  order.status === "cancelled" ? " is-active" : ""
                                }`}
                                disabled={paid && order.status !== "cancelled"}
                                onClick={() => void setStatus(order, "cancelled")}
                              >
                                Stornieren
                              </button>
                            </div>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {!paid && order.status !== "cancelled" ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn--sm"
                                onClick={() => {
                                  setPayFor(payFor === order.id ? null : order.id);
                                  setPayMethod("cash");
                                  setPayRef("");
                                  setExpanded(order.id);
                                }}
                              >
                                Als bezahlt
                              </button>
                            ) : (
                              <span className="admin-muted">—</span>
                            )}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="is-expanded">
                            <td colSpan={6}>
                              <div className="admin-order-detail">
                                {order.customer.grade && (
                                  <p className="admin-muted">Klasse: {order.customer.grade}</p>
                                )}
                                <ul>
                                  {order.items.map((item, i) => (
                                    <li key={i}>
                                      {item.quantity}× {item.productName} ({item.size}) —{" "}
                                      {item.unitPrice} €
                                    </li>
                                  ))}
                                </ul>
                                {order.customer.notes && (
                                  <p style={{ marginTop: "0.5rem" }}>
                                    <strong>Anmerkung:</strong> {order.customer.notes}
                                  </p>
                                )}
                                {payFor === order.id && renderPayPanel(order)}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-orders-mobile">
              <div className="admin-orders-mobile-list">
                {filtered.map((order) => {
                  const isOpen = expanded === order.id;
                  const payLabel = PAY_LABELS[order.paymentStatus || "unpaid"] || "Unbezahlt";
                  const paid = order.paymentStatus === "paid";
                  return (
                    <article key={order.id} className="admin-order-mobile">
                      <div className="admin-order-mobile__top">
                        <div>
                          <p className="admin-order-mobile__id">{order.id}</p>
                          <p className="admin-muted">
                            {new Date(order.createdAt).toLocaleString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p>
                            <strong>{order.customer.name}</strong>
                          </p>
                          <p className="admin-muted">{order.customer.email}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong>{order.total} €</strong>
                          <div style={{ marginTop: "0.35rem" }}>
                            <span
                              className={`admin-badge${
                                paid ? " admin-badge--ok" : " admin-badge--warn"
                              }`}
                            >
                              {payLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary admin-btn--sm"
                        onClick={() => setExpanded(isOpen ? null : order.id)}
                      >
                        {isOpen ? "Details schliessen" : "Details"}
                      </button>

                      {isOpen && (
                        <div className="admin-order-detail">
                          {order.customer.grade && (
                            <p className="admin-muted">Klasse: {order.customer.grade}</p>
                          )}
                          <ul>
                            {order.items.map((item, i) => (
                              <li key={i}>
                                {item.quantity}× {item.productName} ({item.size}) — {item.unitPrice} €
                              </li>
                            ))}
                          </ul>
                          {order.customer.notes && (
                            <p style={{ marginTop: "0.5rem" }}>
                              <strong>Anmerkung:</strong> {order.customer.notes}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="admin-status-row">
                        {STATUS_FLOW.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            className={`admin-status-btn${
                              order.status === s.value ? " is-active" : ""
                            }`}
                            disabled={order.status === "cancelled"}
                            onClick={() => void setStatus(order, s.value)}
                          >
                            {s.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={`admin-status-btn is-danger${
                            order.status === "cancelled" ? " is-active" : ""
                          }`}
                          disabled={paid && order.status !== "cancelled"}
                          onClick={() => void setStatus(order, "cancelled")}
                        >
                          Stornieren
                        </button>
                      </div>

                      {!paid && order.status !== "cancelled" && (
                        <button
                          type="button"
                          className="admin-btn"
                          onClick={() => {
                            setPayFor(payFor === order.id ? null : order.id);
                            setPayMethod("cash");
                            setPayRef("");
                            setExpanded(order.id);
                          }}
                        >
                          Als bezahlt markieren
                        </button>
                      )}
                      {payFor === order.id && renderPayPanel(order)}
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  );

  function renderPayPanel(order: Order) {
    return (
      <div className="admin-pay-panel">
        <strong>Zahlung bestätigen</strong>
        <div className="admin-pay-panel__actions">
          <button
            type="button"
            className={`admin-chip${payMethod === "cash" ? " is-active" : ""}`}
            onClick={() => setPayMethod("cash")}
          >
            Bar
          </button>
          <button
            type="button"
            className={`admin-chip${payMethod === "paypal" ? " is-active" : ""}`}
            onClick={() => setPayMethod("paypal")}
          >
            PayPal
          </button>
        </div>
        {payMethod === "paypal" && (
          <input
            className="admin-input"
            placeholder="PayPal-Referenz / Notiz"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />
        )}
        <div className="admin-pay-panel__actions">
          <button type="button" className="admin-btn admin-btn--sm" onClick={() => void submitPaid(order.id)}>
            Bestätigen
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--secondary admin-btn--sm"
            onClick={() => setPayFor(null)}
          >
            Abbrechen
          </button>
          {order.paymentStatus === "pending" && (
            <button
              type="button"
              className="admin-btn admin-btn--ghost-danger admin-btn--sm"
              onClick={() => void onResetPayment(order.id)}
            >
              Zahlung zurücksetzen
            </button>
          )}
        </div>
      </div>
    );
  }
}
