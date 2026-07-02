import path from "node:path";
import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { CreateOrderPayload, Order, OrdersFile, OrderStatus } from "../shared/shop-types.js";
import { getCatalogProduct } from "./catalog.js";
import { adjustStock } from "./inventory.js";
import { readBody, readJsonFile, writeJsonFile } from "./json-store.js";

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
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `CSH-${date}-${rand}`;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function validateCustomer(customer: CreateOrderPayload["customer"]): string | null {
  if (!customer?.name?.trim() || customer.name.trim().length < 2) {
    return "Bitte einen gültigen Namen angeben.";
  }
  if (!customer?.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
    return "Bitte eine gültige E-Mail angeben.";
  }
  if (customer.grade && customer.grade.length > 80) return "Klasse/Stufe zu lang.";
  if (customer.notes && customer.notes.length > 500) return "Anmerkung zu lang.";
  return null;
}

export function createOrderHandlers(projectRoot: string) {
  return {
    async handleCreateOrder(req: IncomingMessage, res: ServerResponse) {
      if (req.method !== "POST") {
        return sendJson(res, 405, { error: "Method not allowed" });
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

      if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
        return sendJson(res, 400, { error: "Warenkorb ist leer." });
      }
      if (parsed.items.length > 20) {
        return sendJson(res, 400, { error: "Zu viele Positionen." });
      }

      const lineItems: Order["items"] = [];
      const stockDeltas: { slug: string; size: string; delta: number }[] = [];

      for (const item of parsed.items) {
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
          return sendJson(res, 400, { error: "Ungültige Menge." });
        }
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
          quantity: qty,
          unitPrice: product.price,
        });
        stockDeltas.push({ slug: product.slug, size: item.size, delta: -qty });
      }

      const stockResult = adjustStock(projectRoot, stockDeltas);
      if (!stockResult.ok) {
        return sendJson(res, 409, { error: stockResult.error });
      }

      const total = lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      const now = new Date().toISOString();
      const order: Order = {
        id: newOrderId(),
        status: "pending",
        customer: {
          name: parsed.customer.name.trim(),
          email: parsed.customer.email.trim().toLowerCase(),
          grade: parsed.customer.grade?.trim() || undefined,
          notes: parsed.customer.notes?.trim() || undefined,
        },
        items: lineItems,
        total,
        createdAt: now,
        updatedAt: now,
      };

      const data = loadOrders(projectRoot);
      data.orders.unshift(order);
      saveOrders(projectRoot, data);

      sendJson(res, 201, { orderId: order.id, total });
    },

    getAllOrders(root: string = projectRoot): Order[] {
      return loadOrders(root).orders;
    },

    updateOrderStatus(
      orderId: string,
      status: OrderStatus
    ): { ok: true; order: Order } | { ok: false; error: string } {
      const data = loadOrders(projectRoot);
      const order = data.orders.find((o) => o.id === orderId);
      if (!order) return { ok: false, error: "Bestellung nicht gefunden." };

      const prev = order.status;
      if (prev === status) return { ok: true, order };

      // Restore stock when cancelling from a non-cancelled state
      if (status === "cancelled" && prev !== "cancelled") {
        const restore = order.items.map((i) => ({
          slug: i.slug,
          size: i.size,
          delta: i.quantity,
        }));
        const result = adjustStock(projectRoot, restore);
        if (!result.ok) return { ok: false, error: result.error };
      }

      // Re-deduct if un-cancelling (rare admin action)
      if (prev === "cancelled" && status !== "cancelled") {
        const deduct = order.items.map((i) => ({
          slug: i.slug,
          size: i.size,
          delta: -i.quantity,
        }));
        const result = adjustStock(projectRoot, deduct);
        if (!result.ok) return { ok: false, error: result.error };
      }

      order.status = status;
      order.updatedAt = new Date().toISOString();
      saveOrders(projectRoot, data);
      return { ok: true, order };
    },
  };
}
