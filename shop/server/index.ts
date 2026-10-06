import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createAdminHandlers } from "./admin.js";
import { loadCatalog } from "./catalog.js";
import { ensureShopDb, startOrderArchiveCleanup } from "./db.js";
import { buildHubSnapshot, createHubHandlers } from "./hub.js";
import { startHubPush } from "./hub-push.js";
import { sendJsonCached } from "./http-cache.js";
import { createInventoryHandlers } from "./inventory.js";
import { createOrderHandlers, startUnpaidOrderCleanup } from "./orders.js";
import { createPaymentHandlers } from "./payments.js";
import { loadMerchEnv } from "./payments-config.js";
import { handleQrImage } from "./qr.js";
import { applySalesToCatalogProducts, loadSiteSettings } from "./site-settings.js";
import { createVoteHandlers } from "./votes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shopRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(shopRoot, "..");

async function startServer() {
  const loadedEnv = loadMerchEnv(projectRoot);
  if (loadedEnv.length) {
    console.log("Loaded env:", loadedEnv.join(" | "));
  }

  ensureShopDb(shopRoot);

  const app = express();
  const server = createServer(app);

  // Canonical host: shop.icicles.online (Cloudflare zone).
  // Alias shop.cs-bodensee.de is a Cloudpit CNAME — send everyone to icicles once they connect.
  const CANONICAL_HOST = (
    process.env.SHOP_PUBLIC_BASE_URL ||
    process.env.STRIPE_SUCCESS_BASE_URL ||
    "https://shop.icicles.online"
  )
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .toLowerCase() || "shop.icicles.online";

  const ALIAS_HOSTS = new Set(
    (
      process.env.SHOP_ALIAS_HOSTS ||
      "shop.cs-bodensee.de,www.shop.cs-bodensee.de"
    )
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  );

  app.use((req, res, next) => {
    const rawHost = String(req.headers.host || "")
      .split(":")[0]
      .trim()
      .toLowerCase();
    const xfHost = String(req.headers["x-forwarded-host"] || "")
      .split(",")[0]
      .split(":")[0]
      .trim()
      .toLowerCase();
    const requestHost = ALIAS_HOSTS.has(rawHost)
      ? rawHost
      : ALIAS_HOSTS.has(xfHost)
        ? xfHost
        : rawHost;

    if (
      requestHost &&
      requestHost !== CANONICAL_HOST &&
      ALIAS_HOSTS.has(requestHost) &&
      req.path !== "/api/stripe/webhook"
    ) {
      const target = `https://${CANONICAL_HOST}${req.originalUrl || "/"}`;
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.redirect(301, target);
    }
    return next();
  });

  const { handleVoteRequest } = createVoteHandlers(shopRoot);
  const { handlePublicStockRequest } = createInventoryHandlers(shopRoot);
  const orderHandlers = createOrderHandlers(shopRoot);
  const { handleCreateOrder } = orderHandlers;
  const { handleAdminRequest } = createAdminHandlers(shopRoot);
  const payments = createPaymentHandlers(shopRoot);
  const { handleHubRequest } = createHubHandlers(shopRoot);

  app.use("/api/votes", (req, res) => {
    void handleVoteRequest(req, res);
  });

  app.use("/api/stock", (req, res) => {
    handlePublicStockRequest(req, res);
  });

  app.get("/api/catalog", (req, res) => {
    const data = loadCatalog(shopRoot);
    const settings = loadSiteSettings(shopRoot);
    const products = applySalesToCatalogProducts(
      data.products.filter((product) => product.active !== false),
      settings.sales
    );
    const body = {
      collections: data.collections,
      products,
      updatedAt: data.updatedAt,
    };
    sendJsonCached(req, res, 200, body, `${data.updatedAt}|${settings.updatedAt}`);
  });

  app.get("/api/site-settings", (req, res) => {
    const settings = loadSiteSettings(shopRoot);
    sendJsonCached(req, res, 200, settings, settings.updatedAt, 15);
  });

  app.post("/api/orders", (req, res) => {
    void handleCreateOrder(req, res);
  });

  app.get("/api/payments/status", (req, res) => {
    payments.handlePaymentsStatus(req, res);
  });

  app.get("/api/qr", (req, res) => {
    void handleQrImage(req, res);
  });

  app.post("/api/stripe/webhook", (req, res) => {
    void payments.handleStripeWebhook(req, res);
  });

  app.get("/api/orders/:orderId/paypal-qr", (req, res) => {
    payments.handleOrderPayPalQr(req, res, req.params.orderId);
  });

  app.post("/api/orders/:orderId/stripe-checkout", (req, res) => {
    void payments.handleOrderStripeCheckout(req, res, req.params.orderId);
  });

  app.post("/api/orders/:orderId/stripe-confirm", (req, res) => {
    void payments.handleStripeConfirm(req, res, req.params.orderId);
  });

  app.use("/api/hub/snapshot", (req, res) => {
    handleHubRequest(req, res);
  });

  app.use("/api/admin", (req, res) => {
    const pathname = `/api/admin${req.url?.split("?")[0] ?? ""}`;
    void handleAdminRequest(req, res, pathname);
  });

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.use("/__manus__", (_req, res) => {
    res.status(404).end();
  });

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 5174;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`SQLite store: ${path.join(shopRoot, "data", "shop.db")}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.warn("WARN: ADMIN_PASSWORD not set — admin login disabled.");
    }
    if (!process.env.ADMIN_SESSION_SECRET) {
      console.warn(
        "WARN: ADMIN_SESSION_SECRET not set — sessions fall back to ADMIN_PASSWORD. Set a dedicated secret."
      );
    }
    if (
      !(process.env.PAYPAL_MANAGED_QR_ID || "").trim() &&
      !(process.env.PAYPAL_ME_HANDLE || "").trim() &&
      !(process.env.PAYPAL_BUSINESS_EMAIL || "").trim()
    ) {
      console.warn("WARN: PayPal not configured — PayPal checkout disabled.");
    }
    if (!(process.env.STRIPE_SECRET_KEY || "").trim()) {
      console.warn("WARN: STRIPE_SECRET_KEY missing — Stripe checkout disabled.");
    }
    startUnpaidOrderCleanup(() => orderHandlers.expireUnpaidOrders());
    startOrderArchiveCleanup(() => orderHandlers.archiveOldOrders());
    startHubPush(() => buildHubSnapshot(shopRoot), "csh-merch");
  });
}

startServer().catch(console.error);
