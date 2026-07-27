import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import Stripe from "stripe";
import type { Order, PaymentMethod } from "../shared/shop-types.js";
import { dbGetOrder, dbUpdateOrder, dbWithShopTransaction, ensureShopDb } from "./db.js";
import { readBody } from "./json-store.js";
import {
  assertStripePublicBaseUrl,
  paymentsConfigured,
  paypalCheckoutUrl,
  shopPublicBaseUrl,
} from "./payments-config.js";

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function findOrder(projectRoot: string, orderId: string): Order | undefined {
  return dbGetOrder(projectRoot, orderId);
}

function tokensEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function extractAccessToken(req: IncomingMessage): string {
  const header = req.headers["x-order-access-token"];
  if (typeof header === "string" && header.trim()) return header.trim();
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);
  return (url.searchParams.get("accessToken") || url.searchParams.get("token") || "").trim();
}

function requireOrderAccess(
  projectRoot: string,
  req: IncomingMessage,
  orderId: string
): { ok: true; order: Order } | { ok: false; status: number; error: string } {
  const order = findOrder(projectRoot, orderId);
  if (!order) return { ok: false, status: 404, error: "Bestellung nicht gefunden." };
  if (!order.accessToken) {
    return {
      ok: false,
      status: 403,
      error: "Diese Bestellung kann nur über die Admin-Oberfläche bearbeitet werden.",
    };
  }
  const token = extractAccessToken(req);
  if (!tokensEqual(token, order.accessToken)) {
    return { ok: false, status: 403, error: "Ungültiger oder fehlender Bestell-Zugang." };
  }
  return { ok: true, order };
}

async function patchOrderPayment(
  projectRoot: string,
  orderId: string,
  patch: Partial<Order>
): Promise<Order | null> {
  return dbWithShopTransaction(projectRoot, () => {
    const order = dbGetOrder(projectRoot, orderId);
    if (!order) return null;
    Object.assign(order, patch, { updatedAt: new Date().toISOString() });
    dbUpdateOrder(projectRoot, order);
    return order;
  });
}

function eurosToCents(total: number): number {
  return Math.round(Number(total) * 100);
}

function rejectDualMethod(order: Order, method: PaymentMethod): string | null {
  if (order.paymentStatus === "paid") return "Bestellung ist bereits bezahlt.";
  if (order.paymentMethod && order.paymentMethod !== method && order.paymentStatus === "pending") {
    return `Zahlung bereits über ${order.paymentMethod} gestartet. Bitte diese Methode fortsetzen oder Admin fragen.`;
  }
  return null;
}

async function markStripePaid(
  projectRoot: string,
  order: Order,
  session: Stripe.Checkout.Session
): Promise<Order | null> {
  if (order.status === "cancelled") return null;
  const expectedCents = eurosToCents(order.total);
  if (typeof session.amount_total === "number" && session.amount_total !== expectedCents) {
    return null;
  }
  const metaOrder = session.metadata?.order_id || session.client_reference_id || "";
  if (!metaOrder || metaOrder !== order.id) return null;
  if (session.payment_status !== "paid") return null;

  return patchOrderPayment(projectRoot, order.id, {
    paymentStatus: "paid",
    paymentMethod: "stripe",
    paymentReference: session.payment_intent
      ? String(session.payment_intent)
      : session.id,
    stripeSessionId: session.id,
    status: order.status === "pending" ? "confirmed" : order.status,
  });
}

export function createPaymentHandlers(projectRoot: string) {
  ensureShopDb(projectRoot);
  return {
    handlePaymentsStatus(_req: IncomingMessage, res: ServerResponse) {
      const cfg = paymentsConfigured();
      // Public: booleans only (no business email leak).
      return sendJson(res, 200, {
        paypal: cfg.paypal,
        stripe: cfg.stripe,
      });
    },

    handleOrderPayPalQr(req: IncomingMessage, res: ServerResponse, orderId: string) {
      if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });
      const access = requireOrderAccess(projectRoot, req, orderId);
      if (!access.ok) return sendJson(res, access.status, { error: access.error });
      const { order } = access;

      if (order.status === "cancelled") {
        return sendJson(res, 409, { error: "Bestellung ist storniert." });
      }
      const dual = rejectDualMethod(order, "paypal");
      if (dual) return sendJson(res, 409, { error: dual });

      const url = paypalCheckoutUrl(order.total, order.id);
      if (!url) {
        return sendJson(res, 503, {
          error:
            "PayPal ist nicht konfiguriert (PAYPAL_ME_HANDLE / BUSINESS_EMAIL / MANAGED_QR_ID).",
        });
      }

      void patchOrderPayment(projectRoot, orderId, {
        paymentMethod: "paypal",
        paymentStatus: "pending",
      });

      return sendJson(res, 200, {
        orderId: order.id,
        amountEuros: order.total,
        paypalUrl: url,
        paypalQrUrl: url,
        reminder:
          "Bitte Bestellnummer in der PayPal-Notiz lassen. Zahlung wird manuell von der Schülerfirma bestätigt.",
      });
    },

    async handleOrderStripeCheckout(
      req: IncomingMessage,
      res: ServerResponse,
      orderId: string
    ) {
      if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
      const secret = (process.env.STRIPE_SECRET_KEY || "").trim();
      if (!secret) {
        return sendJson(res, 503, { error: "Stripe ist nicht konfiguriert." });
      }

      const publicUrlError = assertStripePublicBaseUrl();
      if (publicUrlError) return sendJson(res, 503, { error: publicUrlError });

      const access = requireOrderAccess(projectRoot, req, orderId);
      if (!access.ok) return sendJson(res, access.status, { error: access.error });
      const { order } = access;

      if (order.status === "cancelled") {
        return sendJson(res, 409, { error: "Bestellung ist storniert." });
      }
      const dual = rejectDualMethod(order, "stripe");
      if (dual) return sendJson(res, 409, { error: dual });

      if (order.stripeSessionId && order.paymentMethod === "stripe") {
        try {
          const stripe = new Stripe(secret);
          const existing = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
          if (existing.status === "open" && existing.url) {
            return sendJson(res, 200, {
              orderId: order.id,
              checkoutUrl: existing.url,
              sessionId: existing.id,
            });
          }
        } catch {
          /* create a new session below */
        }
      }

      const successBase = shopPublicBaseUrl();
      const cancelBase = (
        process.env.STRIPE_CANCEL_BASE_URL ||
        process.env.SHOP_PUBLIC_BASE_URL ||
        successBase
      )
        .trim()
        .replace(/\/$/, "");
      const company = process.env.STRIPE_CHECKOUT_COMPANY_NAME || "CSH Merch";
      const tokenQ = `token=${encodeURIComponent(order.accessToken)}`;

      try {
        const stripe = new Stripe(secret);
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          success_url: `${successBase}/kasse/bezahlt?order=${encodeURIComponent(order.id)}&${tokenQ}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${cancelBase}/kasse/bezahlt?order=${encodeURIComponent(order.id)}&${tokenQ}&cancelled=1`,
          customer_email: order.customer.email,
          client_reference_id: order.id,
          metadata: {
            order_id: order.id,
            source: "csh-merch-shop",
          },
          line_items: order.items.map((item) => ({
            quantity: item.quantity,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(item.unitPrice * 100),
              product_data: {
                name: `${item.productName} (${item.size})`,
                metadata: { slug: item.slug, size: item.size },
              },
            },
          })),
          payment_intent_data: {
            description: `${company} order ${order.id}`,
            metadata: { order_id: order.id },
          },
        });

        await patchOrderPayment(projectRoot, orderId, {
          paymentMethod: "stripe",
          paymentStatus: "pending",
          paymentReference: session.id,
          stripeSessionId: session.id,
        });

        return sendJson(res, 200, {
          orderId: order.id,
          checkoutUrl: session.url,
          sessionId: session.id,
        });
      } catch (err) {
        console.error("[stripe-checkout]", err);
        return sendJson(res, 502, { error: "Stripe-Checkout konnte nicht gestartet werden." });
      }
    },

    async handleStripeConfirm(
      req: IncomingMessage,
      res: ServerResponse,
      orderId: string
    ) {
      if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
      const secret = (process.env.STRIPE_SECRET_KEY || "").trim();
      if (!secret) return sendJson(res, 503, { error: "Stripe ist nicht konfiguriert." });

      const access = requireOrderAccess(projectRoot, req, orderId);
      if (!access.ok) return sendJson(res, access.status, { error: access.error });
      const { order } = access;

      if (order.status === "cancelled") {
        return sendJson(res, 409, { error: "Bestellung ist storniert." });
      }
      if (order.paymentStatus === "paid") {
        return sendJson(res, 200, { paid: true });
      }

      // Ignore client-supplied session ids — only the session stored on the order.
      try {
        await readBody(req, 4_096);
      } catch {
        /* empty / oversized ignored for confirm */
      }

      const sessionId = order.stripeSessionId || "";
      if (!sessionId) {
        return sendJson(res, 400, { error: "Keine Stripe-Session für diese Bestellung." });
      }

      try {
        const stripe = new Stripe(secret);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid") {
          const updated = await markStripePaid(projectRoot, order, session);
          if (!updated) {
            return sendJson(res, 409, {
              error: "Zahlung passt nicht zur Bestellung (Betrag/Status/Metadaten).",
            });
          }
          return sendJson(res, 200, { paid: true });
        }
        return sendJson(res, 200, { paid: false, paymentStatus: session.payment_status });
      } catch (err) {
        console.error("[stripe-confirm]", err);
        return sendJson(res, 502, { error: "Zahlung konnte nicht bestätigt werden." });
      }
    },

    async handleStripeWebhook(req: IncomingMessage, res: ServerResponse) {
      if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
      const secret = (process.env.STRIPE_SECRET_KEY || "").trim();
      const whSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
      if (!secret || !whSecret) {
        return sendJson(res, 503, { error: "Stripe-Webhook ist nicht konfiguriert." });
      }

      let raw: string;
      try {
        raw = await readBody(req, 256_000);
      } catch {
        return sendJson(res, 400, { error: "Ungültige Anfrage." });
      }

      const sig = req.headers["stripe-signature"];
      if (typeof sig !== "string") {
        return sendJson(res, 400, { error: "Missing stripe-signature" });
      }

      let event: Stripe.Event;
      try {
        const stripe = new Stripe(secret);
        event = stripe.webhooks.constructEvent(raw, sig, whSecret);
      } catch (err) {
        console.error("[stripe-webhook] signature", err);
        return sendJson(res, 400, { error: "Invalid signature" });
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id || session.client_reference_id || "";
        if (orderId) {
          const order = findOrder(projectRoot, orderId);
          if (order && order.paymentStatus !== "paid" && order.status !== "cancelled") {
            const updated = await markStripePaid(projectRoot, order, session);
            if (!updated) {
              console.error("[stripe-webhook] refused mark paid for", orderId);
            }
          }
        }
      }

      return sendJson(res, 200, { received: true });
    },

    async markOrderPaidByAdmin(
      orderId: string,
      method: PaymentMethod = "cash",
      opts: { confirm?: boolean; paymentReference?: string } = {}
    ): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
      if (!opts.confirm) {
        return {
          ok: false,
          error: "Bitte Bestätigung senden (confirm: true). PayPal/Bar wird nicht automatisch geprüft.",
        };
      }
      if (method === "paypal" && !(opts.paymentReference || "").trim()) {
        return {
          ok: false,
          error: "Bei PayPal bitte eine Referenz / Transaktionsnotiz angeben.",
        };
      }

      return dbWithShopTransaction(projectRoot, () => {
        const order = dbGetOrder(projectRoot, orderId);
        if (!order) return { ok: false, error: "Bestellung nicht gefunden." };
        if (order.status === "cancelled") {
          return { ok: false, error: "Stornierte Bestellung kann nicht als bezahlt markiert werden." };
        }
        if (order.paymentStatus === "paid") return { ok: true, order };
        order.paymentStatus = "paid";
        order.paymentMethod = method;
        order.paymentReference =
          (opts.paymentReference || "").trim() ||
          order.paymentReference ||
          `admin:${method}:${new Date().toISOString()}`;
        if (order.status === "pending") order.status = "confirmed";
        order.updatedAt = new Date().toISOString();
        dbUpdateOrder(projectRoot, order);
        return { ok: true, order };
      });
    },

    async resetOrderPayment(
      orderId: string
    ): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
      return dbWithShopTransaction(projectRoot, () => {
        const order = dbGetOrder(projectRoot, orderId);
        if (!order) return { ok: false, error: "Bestellung nicht gefunden." };
        if (order.paymentStatus === "paid") {
          return { ok: false, error: "Bezahlte Bestellung kann nicht zurückgesetzt werden." };
        }
        if (order.status === "cancelled") {
          return { ok: false, error: "Stornierte Bestellung." };
        }
        delete order.paymentMethod;
        order.paymentStatus = "unpaid";
        delete order.paymentReference;
        delete order.stripeSessionId;
        order.updatedAt = new Date().toISOString();
        dbUpdateOrder(projectRoot, order);
        return { ok: true, order };
      });
    },
  };
}
