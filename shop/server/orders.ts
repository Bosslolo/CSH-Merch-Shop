import path from "node:path";
import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { CreateOrderPayload, Order, OrdersFile, OrderStatus } from "../shared/shop-types.js";
import { getClientIp } from "./client-ip.js";
import { getCatalogProduct } from "./catalog.js";
import { withFileLock } from "./file-lock.js";
import { adjustStockUnlocked, shopDataLockKey } from "./inventory.js";
import { readBody, readJsonFile, writeJsonFile } from "./json-store.js";
import { isRateLimited, recordAttempt } from "./rate-limit.js";

const MAX_LINE_ITEMS = 20;
const MAX_QTY_PER_LINE = 10;
const MAX_QTY_PER_VARIANT = 10;
const MAX_OPEN_UNPAID_PER_EMAIL = 3;
const ORDER_RATE_IP_MAX = 8;
const ORDER_RATE_IP_WINDOW_MS = 15 * 60 * 1000;
const ORDER_RATE_EMAIL_MAX = 5;
const ORDER_RATE_EMAIL_WINDOW_MS = 60 * 60 * 1000;
/** Unpaid pending orders auto-cancel after this (default 2h). */
const UNPAID_TTL_MS = Math.max(
  15 * 60 * 1000,
  Number(process.env.ORDER_UNPAID_TTL_MINUTES || 120) * 60 * 1000
);

function ordersPath(root: string) {
  return path.join(root, "data", "orders.json");
}

function loadOrders(root: string): OrdersFile {
  return readJsonFile(ordersPath(root), { orders: [] });
}

function saveOrders(root: string, data: OrdersFile) {
  writeJsonFile(ordersPath(root), data);
}

function newOrderId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = randomBytes(8).toString("hex").toUpperCase();
  return `CSH-${date}-${rand}`;
}

function newAccessToken(): string {
  return randomBytes(24).toString("hex");
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function validateCustomer(customer: CreateOrderPayload["customer"]): string | null {
  if (!customer?.name?.trim() || customer.name.trim().length < 2) {
    return "Bitte einen gültigen Namen angeben.";
  }
  if (customer.name.trim().length > 80) {
    return "Name zu lang (max. 80 Zeichen).";
  }
  const email = customer?.email?.trim() ?? "";
  if (
    !email ||
    email.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)
  ) {
    return "Bitte eine gültige E-Mail angeben.";
  }
  if (customer.grade && customer.grade.length > 80) return "Klasse/Stufe zu lang.";
  if (customer.notes && customer.notes.length > 500) return "Anmerkung zu lang.";
  return null;
}

function mergeItems(
  items: CreateOrderPayload["items"]
): { ok: true; merged: { slug: string; size: string; quantity: number }[] } | { ok: false; error: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Warenkorb ist leer." };
  }
  if (items.length > MAX_LINE_ITEMS) {
    return { ok: false, error: "Zu viele Positionen." };
  }

  const map = new Map<string, { slug: string; size: string; quantity: number }>();
  for (const item of items) {
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return { ok: false, error: "Ungültige Menge." };
    }
    const slug = String(item.slug || "");
    const size = String(item.size || "");
    const key = `${slug}|${size}`;
    const prev = map.get(key);
    const nextQty = (prev?.quantity ?? 0) + qty;
    if (nextQty > MAX_QTY_PER_VARIANT) {
      return {
        ok: false,
        error: `Maximal ${MAX_QTY_PER_VARIANT} Stück pro Groesse/Artikel.`,
      };
    }
    map.set(key, { slug, size, quantity: nextQty });
  }
  return { ok: true, merged: Array.from(map.values()) };
}

function expireUnpaidLocked(root: string): number {
  const data = loadOrders(root);
  const now = Date.now();
  let expired = 0;
  for (const order of data.orders) {
    if (order.status !== "pending") continue;
    if (order.paymentStatus === "paid") continue;
    const created = Date.parse(order.createdAt);
    if (!Number.isFinite(created) || now - created < UNPAID_TTL_MS) continue;

    const restore = order.items.map((i) => ({
      slug: i.slug,
      size: i.size,
      delta: i.quantity,
    }));
    const result = adjustStockUnlocked(root, restore);
    if (!result.ok) {
      console.error("[expire-unpaid] stock restore failed", order.id, result.error);
      continue;
    }
    order.status = "cancelled";
    order.updatedAt = new Date().toISOString();
    order.paymentStatus = order.paymentStatus === "pending" ? "unpaid" : order.paymentStatus;
    expired += 1;
  }
  if (expired > 0) saveOrders(root, data);
  return expired;
}

export function createOrderHandlers(projectRoot: string) {
  return {
    async handleCreateOrder(req: IncomingMessage, res: ServerResponse) {
      if (req.method !== "POST") {
        return sendJson(res, 405, { error: "Method not allowed" });
      }

      const ip = getClientIp(req);
      if (isRateLimited(`order:ip:${ip}`, ORDER_RATE_IP_MAX, ORDER_RATE_IP_WINDOW_MS)) {
        return sendJson(res, 429, { error: "Zu viele Bestellungen. Bitte später erneut." });
      }

      let body: string;
      try {
        body = await readBody(req, 16_384);
      } catch (e) {
        if (e instanceof Error && e.message === "BODY_TOO_LARGE") {
          return sendJson(res, 413, { error: "Anfrage zu gross." });
        }
        return sendJson(res, 400, { error: "Ungültige Anfrage." });
      }

      let parsed: CreateOrderPayload;
      try {
        parsed = JSON.parse(body);
      } catch {
        return sendJson(res, 400, { error: "Ungültige Anfrage." });
      }

      const customerError = validateCustomer(parsed.customer);
      if (customerError) return sendJson(res, 400, { error: customerError });

      const email = parsed.customer.email.trim().toLowerCase();
      if (isRateLimited(`order:email:${email}`, ORDER_RATE_EMAIL_MAX, ORDER_RATE_EMAIL_WINDOW_MS)) {
        return sendJson(res, 429, { error: "Zu viele Bestellungen für diese E-Mail." });
      }

      const merged = mergeItems(parsed.items);
      if (!merged.ok) return sendJson(res, 400, { error: merged.error });

      const lineItems: Order["items"] = [];
      const stockDeltas: { slug: string; size: string; delta: number }[] = [];

      for (const item of merged.merged) {
        const product = getCatalogProduct(item.slug);
        if (!product) {
          return sendJson(res, 400, { error: `Unbekanntes Produkt: ${item.slug}` });
        }
        if (!product.sizes.includes(item.size as (typeof product.sizes)[number])) {
          return sendJson(res, 400, { error: `Ungültige Groesse für ${product.name}.` });
        }
        lineItems.push({
          slug: product.slug,
          productName: product.name,
          size: item.size,
          quantity: item.quantity,
          unitPrice: product.price,
        });
        stockDeltas.push({ slug: product.slug, size: item.size, delta: -item.quantity });
      }

      const total = lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      const now = new Date().toISOString();
      const accessToken = newAccessToken();
      const order: Order = {
        id: newOrderId(),
        accessToken,
        status: "pending",
        paymentStatus: "unpaid",
        customer: {
          name: parsed.customer.name.trim().slice(0, 80),
          email,
          grade: parsed.customer.grade?.trim().slice(0, 80) || undefined,
          notes: parsed.customer.notes?.trim().slice(0, 500) || undefined,
        },
        items: lineItems,
        total,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await withFileLock(shopDataLockKey(projectRoot), () => {
          expireUnpaidLocked(projectRoot);

          const data = loadOrders(projectRoot);
          const openUnpaid = data.orders.filter(
            (o) =>
              o.customer.email === email &&
              o.status === "pending" &&
              o.paymentStatus !== "paid"
          ).length;
          if (openUnpaid >= MAX_OPEN_UNPAID_PER_EMAIL) {
            throw new Error("TOO_MANY_OPEN");
          }

          const stockResult = adjustStockUnlocked(projectRoot, stockDeltas);
          if (!stockResult.ok) {
            throw new Error(`STOCK:${stockResult.error}`);
          }

          data.orders.unshift(order);
          saveOrders(projectRoot, data);
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "TOO_MANY_OPEN") {
            return sendJson(res, 429, {
              error: `Maximal ${MAX_OPEN_UNPAID_PER_EMAIL} offene unbezahlte Bestellungen pro E-Mail.`,
            });
          }
          if (err.message.startsWith("STOCK:")) {
            return sendJson(res, 409, { error: err.message.slice(6) });
          }
        }
        console.error("[create-order] save failed", err);
        return sendJson(res, 500, { error: "Bestellung konnte nicht gespeichert werden." });
      }

      recordAttempt(`order:ip:${ip}`, ORDER_RATE_IP_WINDOW_MS);
      recordAttempt(`order:email:${email}`, ORDER_RATE_EMAIL_WINDOW_MS);

      sendJson(res, 201, {
        orderId: order.id,
        accessToken,
        total,
        paymentStatus: order.paymentStatus,
      });
    },

    getAllOrders(root: string = projectRoot): Order[] {
      return loadOrders(root).orders;
    },

    async updateOrderStatus(
      orderId: string,
      status: OrderStatus
    ): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
      return withFileLock(shopDataLockKey(projectRoot), () => {
        const data = loadOrders(projectRoot);
        const order = data.orders.find((o) => o.id === orderId);
        if (!order) return { ok: false, error: "Bestellung nicht gefunden." };

        const prev = order.status;
        if (prev === status) return { ok: true, order };

        if (status === "cancelled" && prev !== "cancelled") {
          if (order.paymentStatus === "paid") {
            return {
              ok: false,
              error:
                "Bezahlte Bestellung kann nicht storniert werden (sonst doppelter Bestand). Bitte zuerst klären.",
            };
          }
          const restore = order.items.map((i) => ({
            slug: i.slug,
            size: i.size,
            delta: i.quantity,
          }));
          const result = adjustStockUnlocked(projectRoot, restore);
          if (!result.ok) return { ok: false, error: result.error };
        }

        if (prev === "cancelled" && status !== "cancelled") {
          const deduct = order.items.map((i) => ({
            slug: i.slug,
            size: i.size,
            delta: -i.quantity,
          }));
          const result = adjustStockUnlocked(projectRoot, deduct);
          if (!result.ok) return { ok: false, error: result.error };
        }

        order.status = status;
        order.updatedAt = new Date().toISOString();
        saveOrders(projectRoot, data);
        return { ok: true, order };
      });
    },

    /** Cancel unpaid pending orders older than TTL and restore stock. */
    async expireUnpaidOrders(): Promise<number> {
      return withFileLock(shopDataLockKey(projectRoot), () => expireUnpaidLocked(projectRoot));
    },
  };
}

export function startUnpaidOrderCleanup(
  expireFn: () => Promise<number>,
  intervalMs = 5 * 60 * 1000
): void {
  const tick = async () => {
    try {
      const n = await expireFn();
      if (n > 0) console.log(`[orders] expired ${n} unpaid order(s), stock restored`);
    } catch (err) {
      console.warn("[orders] expire sweep failed:", err);
    }
  };
  void tick();
  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.();
}
