import type { IncomingMessage, ServerResponse } from "node:http";
import type { CatalogFile, OrderStatus, PaymentMethod, SiteSettings } from "../shared/shop-types.js";
import { createAuthHandlers } from "./auth.js";
import { loadCatalog, saveCatalog } from "./catalog.js";
import { dbListVotes, ensureShopDb } from "./db.js";
import { getAdminInventory, setStockLevels } from "./inventory.js";
import { createOrderHandlers } from "./orders.js";
import { createPaymentHandlers } from "./payments.js";
import { readBody } from "./json-store.js";
import { loadSiteSettings, saveSiteSettings } from "./site-settings.js";
import { handleAdminUpload } from "./upload.js";
import { DROP_ID } from "./votes.js";

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readVotesSummary(projectRoot: string) {
  const dropRecords = dbListVotes(projectRoot, DROP_ID);
  const tallies: Record<string, number> = {};
  for (const r of dropRecords) {
    tallies[r.designId] = (tallies[r.designId] ?? 0) + 1;
  }
  return {
    totalVotes: dropRecords.length,
    tallies,
    records: dropRecords.length,
  };
}

const VALID_STATUSES = new Set<OrderStatus>(["pending", "confirmed", "fulfilled", "cancelled"]);
const VALID_PAY_METHODS = new Set<PaymentMethod>(["paypal", "stripe", "cash"]);

function paidRevenue(orders: { status: string; paymentStatus?: string; total: number }[]) {
  return orders
    .filter((o) => o.status !== "cancelled" && o.paymentStatus === "paid")
    .reduce((s, o) => s + o.total, 0);
}

export function createAdminHandlers(projectRoot: string) {
  ensureShopDb(projectRoot);
  const auth = createAuthHandlers();
  const orders = createOrderHandlers(projectRoot);
  const payments = createPaymentHandlers(projectRoot);

  return {
    handleAdminRequest: async (req: IncomingMessage, res: ServerResponse, pathname: string) => {
      if (
        pathname === "/api/admin/session" ||
        pathname === "/api/admin/login" ||
        pathname === "/api/admin/logout"
      ) {
        return auth.handleAuthRequest(req, res, pathname);
      }

      if (!auth.requireAdmin(req, res)) return;

      if (pathname === "/api/admin/dashboard" && req.method === "GET") {
        const allOrders = orders.getAllOrders();
        const pending = allOrders.filter((o) => o.status === "pending").length;
        const revenue = paidRevenue(allOrders);
        const inventory = getAdminInventory(projectRoot);
        const lowStock = inventory.products.flatMap((p) =>
          p.sizes.filter((s) => s.quantity <= 3).map((s) => ({
            slug: p.slug,
            name: p.name,
            size: s.size,
            quantity: s.quantity,
          }))
        );
        const votes = readVotesSummary(projectRoot);
        const votingEnabled =
          process.env.VOTING_ENABLED === "1" ||
          process.env.VOTING_ENABLED === "true" ||
          process.env.VOTING_ENABLED === "yes";
        return sendJson(res, 200, {
          orders: { total: allOrders.length, pending, revenue },
          unpaid: allOrders.filter(
            (o) => o.status !== "cancelled" && o.paymentStatus !== "paid"
          ).length,
          ready: allOrders.filter((o) => o.status === "confirmed" && o.paymentStatus === "paid")
            .length,
          lowStock,
          votes,
          votingEnabled,
        });
      }

      if (pathname === "/api/admin/orders" && req.method === "GET") {
        const sanitized = orders.getAllOrders().map(({ accessToken: _t, ...rest }) => rest);
        return sendJson(res, 200, { orders: sanitized });
      }

      const payMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)\/mark-paid$/);
      if (payMatch && req.method === "POST") {
        let body: string;
        try {
          body = await readBody(req, 4_096);
        } catch {
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }
        let method: PaymentMethod = "cash";
        let confirm = false;
        let paymentReference = "";
        if (body.trim()) {
          try {
            const parsed = JSON.parse(body) as {
              paymentMethod?: string;
              confirm?: boolean;
              paymentReference?: string;
            };
            if (parsed.paymentMethod && VALID_PAY_METHODS.has(parsed.paymentMethod as PaymentMethod)) {
              method = parsed.paymentMethod as PaymentMethod;
            }
            confirm = Boolean(parsed.confirm);
            paymentReference = (parsed.paymentReference || "").trim();
          } catch {
            return sendJson(res, 400, { error: "Ungültige Anfrage." });
          }
        }
        const result = await payments.markOrderPaidByAdmin(decodeURIComponent(payMatch[1]), method, {
          confirm,
          paymentReference,
        });
        if (!result.ok) return sendJson(res, 400, { error: result.error });
        const { accessToken: _t, ...safe } = result.order;
        return sendJson(res, 200, { order: safe });
      }

      const resetPayMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)\/reset-payment$/);
      if (resetPayMatch && req.method === "POST") {
        const result = await payments.resetOrderPayment(decodeURIComponent(resetPayMatch[1]));
        if (!result.ok) return sendJson(res, 400, { error: result.error });
        const { accessToken: _t, ...safe } = result.order;
        return sendJson(res, 200, { order: safe });
      }

      const orderMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
      if (orderMatch && req.method === "PATCH") {
        let body: string;
        try {
          body = await readBody(req, 4_096);
        } catch {
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }
        let parsed: { status?: string };
        try {
          parsed = JSON.parse(body);
        } catch {
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }
        if (!parsed.status || !VALID_STATUSES.has(parsed.status as OrderStatus)) {
          return sendJson(res, 400, { error: "Ungültiger Status." });
        }
        const result = await orders.updateOrderStatus(
          decodeURIComponent(orderMatch[1]),
          parsed.status as OrderStatus
        );
        if (!result.ok) return sendJson(res, 400, { error: result.error });
        const { accessToken: _t, ...safe } = result.order;
        return sendJson(res, 200, { order: safe });
      }

      if (pathname === "/api/admin/inventory" && req.method === "GET") {
        return sendJson(res, 200, getAdminInventory(projectRoot));
      }

      if (pathname === "/api/admin/catalog" && req.method === "GET") {
        return sendJson(res, 200, loadCatalog(projectRoot));
      }

      if (pathname === "/api/admin/inventory" && req.method === "PUT") {
        let body: string;
        try {
          body = await readBody(req, 32_768);
        } catch {
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }
        let parsed: { updates?: { slug: string; size: string; quantity: number }[] };
        try {
          parsed = JSON.parse(body);
        } catch {
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }
        if (!Array.isArray(parsed.updates) || parsed.updates.length === 0) {
          return sendJson(res, 400, { error: "Keine Aktualisierungen." });
        }
        const result = await setStockLevels(projectRoot, parsed.updates);
        if (!result.ok) return sendJson(res, 400, { error: result.error });
        return sendJson(res, 200, getAdminInventory(projectRoot));
      }

      if (pathname === "/api/admin/catalog" && req.method === "PUT") {
        let body: string;
        try {
          body = await readBody(req, 200_000);
        } catch {
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }
        let parsed: CatalogFile;
        try {
          parsed = JSON.parse(body);
        } catch {
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }
        const result = saveCatalog(projectRoot, parsed);
        if (!result.ok) return sendJson(res, 400, { error: result.error });
        return sendJson(res, 200, result.data);
      }

      if (pathname === "/api/admin/votes" && req.method === "GET") {
        return sendJson(res, 200, readVotesSummary(projectRoot));
      }

      if (pathname === "/api/admin/settings" && req.method === "GET") {
        return sendJson(res, 200, loadSiteSettings(projectRoot));
      }

      if (pathname === "/api/admin/settings" && req.method === "PUT") {
        let body: string;
        try {
          body = await readBody(req, 100_000);
        } catch {
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }
        let parsed: SiteSettings;
        try {
          parsed = JSON.parse(body);
        } catch {
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }
        return sendJson(res, 200, saveSiteSettings(projectRoot, parsed));
      }

      if (pathname === "/api/admin/upload" && req.method === "POST") {
        return handleAdminUpload(projectRoot, req, res);
      }

      sendJson(res, 404, { error: "Not found" });
    },
  };
}
