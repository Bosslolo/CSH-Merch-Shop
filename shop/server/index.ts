import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createAdminHandlers } from "./admin.js";
import { buildHubSnapshot, createHubHandlers } from "./hub.js";
import { startHubPush } from "./hub-push.js";
import { createInventoryHandlers } from "./inventory.js";
import { createOrderHandlers, startUnpaidOrderCleanup } from "./orders.js";
import { createPaymentHandlers } from "./payments.js";
import { loadMerchEnv } from "./payments-config.js";
import { handleQrImage } from "./qr.js";
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

  const app = express();
  const server = createServer(app);

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
    startHubPush(() => buildHubSnapshot(shopRoot), "csh-merch");
  });
}

startServer().catch(console.error);
