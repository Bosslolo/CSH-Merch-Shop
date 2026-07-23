import type { IncomingMessage, ServerResponse } from "node:http";
import QRCode from "qrcode";
import { isAllowedPaypalQrPayload } from "./payments-config.js";

export async function handleQrImage(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);
  const data = url.searchParams.get("data") || "";
  if (!data || data.length > 4000 || !isAllowedPaypalQrPayload(data)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid QR data" }));
    return;
  }

  try {
    const png = await QRCode.toBuffer(data, {
      type: "png",
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M",
    });
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Content-Length": String(png.length),
    });
    res.end(png);
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "QR generation failed" }));
  }
}
