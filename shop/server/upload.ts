import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { ensureDir, readBody } from "./json-store.js";

const MAX_BYTES = 6_000_000;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function uploadsDir(projectRoot: string) {
  return path.join(projectRoot, "client", "public", "images", "uploads");
}

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function handleAdminUpload(
  projectRoot: string,
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  let raw: string;
  try {
    raw = await readBody(req, MAX_BYTES + 64_000);
  } catch (e) {
    if (e instanceof Error && e.message === "BODY_TOO_LARGE") {
      return sendJson(res, 413, { error: "Bild zu groß (max. ca. 5 MB)." });
    }
    return sendJson(res, 400, { error: "Ungültige Anfrage." });
  }

  let parsed: { dataUrl?: string; filename?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return sendJson(res, 400, { error: "Ungültige Anfrage." });
  }

  const dataUrl = String(parsed.dataUrl || "");
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    return sendJson(res, 400, { error: "Bitte ein Bild (JPEG, PNG, WebP oder GIF) wählen." });
  }
  const mime = match[1]!.toLowerCase();
  if (!ALLOWED.has(mime)) {
    return sendJson(res, 400, { error: "Dateityp nicht erlaubt." });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(match[2]!, "base64");
  } catch {
    return sendJson(res, 400, { error: "Bild konnte nicht gelesen werden." });
  }
  if (!buffer.length || buffer.length > MAX_BYTES) {
    return sendJson(res, 413, { error: "Bild zu groß (max. ca. 5 MB)." });
  }

  const dir = uploadsDir(projectRoot);
  ensureDir(path.join(dir, "x"));
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${extForMime(mime)}`;
  const dest = path.join(dir, name);
  fs.writeFileSync(dest, buffer);

  // Keep production static tree in sync when present.
  const distDir = path.join(projectRoot, "dist", "public", "images", "uploads");
  try {
    ensureDir(path.join(distDir, "x"));
    fs.copyFileSync(dest, path.join(distDir, name));
  } catch {
    /* optional */
  }

  const url = `/images/uploads/${name}`;
  return sendJson(res, 201, { url, filename: parsed.filename || name });
}
