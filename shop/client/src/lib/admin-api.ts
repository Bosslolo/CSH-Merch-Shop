import type { CatalogFile, SiteSettings } from "@shared/shop-types";

const adminFetch = (path: string, init?: RequestInit) =>
  fetch(path, { ...init, credentials: "include" });

async function readAdminJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) {
    if (!res.ok) throw new Error(`Serverfehler (${res.status}).`);
    return {};
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      res.ok ? "Ungültige Server-Antwort." : `Serverfehler (${res.status}).`
    );
  }
}

function adminError(res: Response, data: Record<string, unknown>, fallback: string): Error {
  if (res.status === 401) {
    return new Error(
      typeof data.error === "string" ? data.error : "Sitzung abgelaufen. Bitte erneut anmelden."
    );
  }
  return new Error(typeof data.error === "string" ? data.error : fallback);
}

export interface AdminSession {
  authenticated: boolean;
  configured: boolean;
}

export async function getAdminSession(): Promise<AdminSession> {
  const res = await adminFetch("/api/admin/session");
  return res.json();
}

export async function adminLogin(
  password: string,
  rememberDevice = false
): Promise<{ ok?: boolean; error?: string }> {
  const res = await adminFetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, rememberDevice }),
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
  const data = await readAdminJson(res);
  if (!res.ok) throw adminError(res, data, "Bestellungen konnten nicht geladen werden.");
  return data as { orders: unknown[] };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const body = JSON.stringify({ status });
  const path = `/api/admin/orders/${encodeURIComponent(orderId)}/status`;
  let res = await adminFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (res.status === 404 || res.status === 405) {
    res = await adminFetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }
  const data = await readAdminJson(res);
  if (!res.ok) throw adminError(res, data, "Aktualisierung fehlgeschlagen.");
  return data;
}

export async function deleteAdminOrder(orderId: string) {
  const res = await adminFetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
  });
  const data = await readAdminJson(res);
  if (!res.ok) throw adminError(res, data, "Löschen fehlgeschlagen.");
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
  const data = await readAdminJson(res);
  if (!res.ok) throw adminError(res, data, "Zahlung konnte nicht markiert werden.");
  return data;
}

export async function resetOrderPayment(orderId: string) {
  const res = await adminFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/reset-payment`, {
    method: "POST",
  });
  const data = await readAdminJson(res);
  if (!res.ok) throw adminError(res, data, "Zahlung konnte nicht zurückgesetzt werden.");
  return data;
}

export async function fetchAdminInventory() {
  const res = await adminFetch("/api/admin/inventory");
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function fetchAdminCatalog(): Promise<CatalogFile> {
  const res = await adminFetch("/api/admin/catalog");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Katalog konnte nicht geladen werden.");
  return data;
}

export async function saveAdminCatalog(catalog: CatalogFile): Promise<CatalogFile> {
  const res = await adminFetch("/api/admin/catalog", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(catalog),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Katalog konnte nicht gespeichert werden.");
  return data;
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

export async function fetchPublicCatalog(): Promise<CatalogFile> {
  const res = await fetch("/api/catalog");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Katalog konnte nicht geladen werden.");
  return data;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const res = await fetch("/api/site-settings");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Einstellungen konnten nicht geladen werden.");
  return data;
}

export async function fetchAdminSettings(): Promise<SiteSettings> {
  const res = await adminFetch("/api/admin/settings");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Einstellungen konnten nicht geladen werden.");
  return data;
}

export async function saveAdminSettings(settings: SiteSettings): Promise<SiteSettings> {
  const res = await adminFetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Einstellungen konnten nicht gespeichert werden.");
  return data;
}

export async function uploadAdminImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
  const res = await adminFetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, filename: file.name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload fehlgeschlagen.");
  return data.url as string;
}
