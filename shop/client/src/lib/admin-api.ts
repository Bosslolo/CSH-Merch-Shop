const adminFetch = (path: string, init?: RequestInit) =>
  fetch(path, { ...init, credentials: "include" });

export interface AdminSession {
  authenticated: boolean;
  configured: boolean;
}

export async function getAdminSession(): Promise<AdminSession> {
  const res = await adminFetch("/api/admin/session");
  return res.json();
}

export async function adminLogin(password: string): Promise<{ ok?: boolean; error?: string }> {
  const res = await adminFetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "Anmeldung fehlgeschlagen." };
  return { ok: true };
}

export async function adminLogout(): Promise<void> {
  await adminFetch("/api/admin/logout", { method: "POST" });
}

export async function fetchDashboard() {
  const res = await adminFetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function fetchAdminOrders() {
  const res = await adminFetch("/api/admin/orders");
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function updateOrderStatus(orderId: string, status: string) {
  const res = await adminFetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Aktualisierung fehlgeschlagen.");
  return data;
}

export async function markOrderPaid(
  orderId: string,
  paymentMethod: "paypal" | "stripe" | "cash" = "cash",
  opts: { paymentReference?: string } = {}
) {
  const res = await adminFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/mark-paid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentMethod,
      confirm: true,
      paymentReference: opts.paymentReference || undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Zahlung konnte nicht markiert werden.");
  return data;
}

export async function resetOrderPayment(orderId: string) {
  const res = await adminFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/reset-payment`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Zahlung konnte nicht zurückgesetzt werden.");
  return data;
}

export async function fetchAdminInventory() {
  const res = await adminFetch("/api/admin/inventory");
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function saveInventoryUpdates(updates: { slug: string; size: string; quantity: number }[]) {
  const res = await adminFetch("/api/admin/inventory", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");
  return data;
}

export async function fetchAdminVotes() {
  const res = await adminFetch("/api/admin/votes");
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}
