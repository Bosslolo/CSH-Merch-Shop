import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createAdminHandlers } from "./admin.js";
import { buildHubSnapshot, createHubHandlers } from "./hub.js";
import { startHubPush } from "./hub-push.js";
import { createInventoryHandlers } from "./inventory.js";
import { createOrderHandlers } from "./orders.js";
import { createVoteHandlers } from "./votes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

async function startServer() {
  const app = express();
  const server = createServer(app);

  const { handleVoteRequest } = createVoteHandlers(projectRoot);
  const { handlePublicStockRequest } = createInventoryHandlers(projectRoot);
  const { handleCreateOrder } = createOrderHandlers(projectRoot);
  const { handleAdminRequest } = createAdminHandlers(projectRoot);

  const { handleHubRequest } = createHubHandlers(projectRoot);

  app.use("/api/votes", (req, res) => {
    void handleVoteRequest(req, res);
  });

  app.use("/api/stock", (req, res) => {
    handlePublicStockRequest(req, res);
  });

  app.use("/api/orders", (req, res) => {
    void handleCreateOrder(req, res);
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

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 5174;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    if (!process.env.ADMIN_PASSWORD) {
      console.warn("WARN: ADMIN_PASSWORD not set — admin login disabled.");
    }
    startHubPush(() => buildHubSnapshot(projectRoot), "csh-merch");
  });
}

startServer().catch(console.error);
