import type { IncomingMessage, ServerResponse } from "node:http";
import type { OrderStatus } from "../shared/shop-types.js";
import { createAuthHandlers } from "./auth.js";
import { getAdminInventory, setStockLevels } from "./inventory.js";
import { createOrderHandlers } from "./orders.js";
import { readBody } from "./json-store.js";
import { DROP_ID } from "./votes.js";
import fs from "node:fs";
import path from "node:path";

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readVotesSummary(projectRoot: string) {
  const filePath = path.join(projectRoot, "data", "votes.json");
  if (!fs.existsSync(filePath)) {
    return { totalVotes: 0, tallies: {}, records: 0 };
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    records: { dropId: string; designId: string; votedAt: string }[];
  };
  const dropRecords = data.records.filter((r) => r.dropId === DROP_ID);
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

export function createAdminHandlers(projectRoot: string) {
  const auth = createAuthHandlers();
  const orders = createOrderHandlers(projectRoot);

  return {
    handleAdminRequest: async (req: IncomingMessage, res: ServerResponse, pathname: string) => {
      // Auth routes (no session required for login/session check)
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
        const revenue = allOrders
          .filter((o) => o.status !== "cancelled")
          .reduce((s, o) => s + o.total, 0);
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
        return sendJson(res, 200, {
          orders: { total: allOrders.length, pending, revenue },
          lowStock,
          votes,
        });
      }

      if (pathname === "/api/admin/orders" && req.method === "GET") {
        return sendJson(res, 200, { orders: orders.getAllOrders() });
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
        const result = orders.updateOrderStatus(orderMatch[1], parsed.status as OrderStatus);
        if (!result.ok) return sendJson(res, 400, { error: result.error });
        return sendJson(res, 200, { order: result.order });
      }

      if (pathname === "/api/admin/inventory" && req.method === "GET") {
        return sendJson(res, 200, getAdminInventory(projectRoot));
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
        const result = setStockLevels(projectRoot, parsed.updates);
        if (!result.ok) return sendJson(res, 400, { error: result.error });
        return sendJson(res, 200, getAdminInventory(projectRoot));
      }

      if (pathname === "/api/admin/votes" && req.method === "GET") {
        return sendJson(res, 200, readVotesSummary(projectRoot));
      }

      sendJson(res, 404, { error: "Not found" });
    },
  };
}
