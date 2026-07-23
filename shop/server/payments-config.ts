import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SHARED_DEFAULT = path.join("E:", "Schülerfirma", "shared", "csh-payments.env");

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    let line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    if (line.toLowerCase().startsWith("export ")) line = line.slice(7).trim();
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

/**
 * Load shared CSH payment/hub vault first, then local config/production.env and shop/.env.
 * Later non-empty values override earlier ones. Empty values never wipe a previous secret.
 * Process env vars already set (e.g. by start_app.ps1) are kept unless a later file sets a non-empty value.
 */
export function loadMerchEnv(projectRoot: string): string[] {
  const shared =
    (process.env.CSH_SHARED_PAYMENTS_ENV || "").trim() || SHARED_DEFAULT;
  const files = [
    shared,
    path.join(projectRoot, "config", "production.env"),
    path.join(projectRoot, "shop", ".env"),
  ];
  const loaded: string[] = [];
  for (const file of files) {
    const values = parseEnvFile(file);
    if (!Object.keys(values).length) continue;
    for (const [key, value] of Object.entries(values)) {
      if (!value) continue;
      process.env[key] = value;
    }
    loaded.push(file);
  }
  try {
    fs.mkdirSync(path.join(os.tmpdir(), "csh-merch"), { recursive: true });
  } catch {
    /* ignore */
  }
  return loaded;
}

export function paypalManagedQrUrl(amountEuros: number): string | null {
  const id = (process.env.PAYPAL_MANAGED_QR_ID || "").trim();
  if (!id) return null;
  const amount = amountEuros.toFixed(2);
  return (
    `https://www.paypal.com/qrcodes/managed/${id}` +
    `?utm_source=payandgetpaid&amount=${amount}&currency_code=EUR`
  );
}

/** Browser / app-friendly PayPal link (no QR scan). Prefer PayPal.me, then managed QR page. */
export function paypalCheckoutUrl(amountEuros: number): string | null {
  const amount = amountEuros.toFixed(2);
  const meHandle = (process.env.PAYPAL_ME_HANDLE || "").trim().replace(/^@/, "");
  if (meHandle) {
    return `https://www.paypal.com/paypalme/${encodeURIComponent(meHandle)}/${amount}`;
  }
  const email = (process.env.PAYPAL_BUSINESS_EMAIL || "").trim();
  if (email) {
    const params = new URLSearchParams({
      cmd: "_xclick",
      business: email,
      amount,
      currency_code: "EUR",
      item_name: "CSH Merch",
      no_shipping: "1",
      no_note: "1",
    });
    return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
  }
  return paypalManagedQrUrl(amountEuros);
}

export function isAllowedPaypalQrPayload(data: string): boolean {
  const id = (process.env.PAYPAL_MANAGED_QR_ID || "").trim();
  if (!id || !data) return false;
  try {
    const url = new URL(data);
    if (url.protocol !== "https:") return false;
    if (url.hostname !== "www.paypal.com") return false;
    if (url.pathname !== `/qrcodes/managed/${id}`) return false;
    return true;
  } catch {
    return false;
  }
}

export function paymentsConfigured(): { paypal: boolean; stripe: boolean } {
  return {
    paypal: Boolean(
      (process.env.PAYPAL_MANAGED_QR_ID || "").trim() ||
        (process.env.PAYPAL_ME_HANDLE || "").trim() ||
        (process.env.PAYPAL_BUSINESS_EMAIL || "").trim()
    ),
    stripe: Boolean((process.env.STRIPE_SECRET_KEY || "").trim()),
  };
}

/** Prefer configured public HTTPS shop URL for Stripe redirects. */
export function shopPublicBaseUrl(): string {
  const configured = (
    process.env.STRIPE_SUCCESS_BASE_URL ||
    process.env.SHOP_PUBLIC_BASE_URL ||
    ""
  ).trim();
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:5174";
}

export function adminCookieShouldBeSecure(): boolean {
  const publicBase = (
    process.env.SHOP_PUBLIC_BASE_URL ||
    process.env.STRIPE_SUCCESS_BASE_URL ||
    ""
  ).trim().toLowerCase();
  if (publicBase.startsWith("https://")) return true;
  if (process.env.ADMIN_COOKIE_SECURE === "1") return true;
  if (process.env.ADMIN_COOKIE_SECURE === "0") return false;
  // Production over plain HTTP LAN must still allow admin cookies.
  return false;
}
