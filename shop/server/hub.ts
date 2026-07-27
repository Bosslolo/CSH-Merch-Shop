import type { IncomingMessage, ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { DROP_ID } from "./votes.js";
import { getAdminInventory } from "./inventory.js";
import { createOrderHandlers } from "./orders.js";
import { dbListVotes, ensureShopDb } from "./db.js";

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function getBearerToken(req: IncomingMessage): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

function readVotesSummary(projectRoot: string) {
  const dropRecords = dbListVotes(projectRoot, DROP_ID);
  const tallies: Record<string, number> = {};
  for (const r of dropRecords) tallies[r.designId] = (tallies[r.designId] ?? 0) + 1;
  return { total: dropRecords.length, tallies };
}

export function buildHubSnapshot(projectRoot: string): Record<string, unknown> {
  ensureShopDb(projectRoot);
  const orders = createOrderHandlers(projectRoot);
  const allOrders = orders.getAllOrders();
  const pending = allOrders.filter((o) => o.status === "pending").length;
  const revenue = allOrders
    .filter((o) => o.status !== "cancelled" && o.paymentStatus === "paid")
    .reduce((s, o) => s + o.total, 0);

  const inventory = getAdminInventory(projectRoot);
  const lowStock = inventory.products.flatMap((p) =>
    p.sizes
      .filter((s) => s.quantity <= 3)
      .map((s) => ({ slug: p.slug, name: p.name, size: s.size, quantity: s.quantity }))
  );

  const problems: string[] = [];
  if (!process.env.ADMIN_PASSWORD) problems.push("ADMIN_PASSWORD nicht gesetzt.");
  if (!process.env.ADMIN_SESSION_SECRET) {
    problems.push("ADMIN_SESSION_SECRET fehlt — Session nutzt Passwort als Secret.");
  }
  if (lowStock.length > 0) problems.push(`${lowStock.length} Varianten mit niedrigem Bestand.`);
  if (pending > 5) problems.push(`${pending} offene Bestellungen warten auf Bearbeitung.`);

  const votes = readVotesSummary(projectRoot);

  return {
    app: "csh-merch",
    generatedAt: new Date().toISOString(),
    orders: { total: allOrders.length, pending, revenue },
    votes,
    lowStock,
    problems,
  };
}

export function createHubHandlers(projectRoot: string) {
  ensureShopDb(projectRoot);
  return {
    handleHubRequest(req: IncomingMessage, res: ServerResponse) {
      if (req.method !== "GET") {
        return sendJson(res, 405, { error: "Method not allowed" });
      }

      const expected = process.env.HUB_API_KEY ?? "";
      const token = getBearerToken(req) ?? "";
      const valid =
        expected.length > 0 &&
        expected !== "generate-a-long-random-string" &&
        token.length === expected.length &&
        timingSafeEqual(Buffer.from(token), Buffer.from(expected));
      if (!valid) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      sendJson(res, 200, buildHubSnapshot(projectRoot));
    },
  };
}
