import fs from "node:fs";
import path from "node:path";

export function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readJsonFile<T>(filePath: string, fallback: T): T {
  ensureDir(filePath);
  if (!fs.existsSync(filePath)) {
    writeJsonFile(filePath, fallback);
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function writeJsonFile<T>(filePath: string, data: T) {
  ensureDir(filePath);
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

export async function readBody(req: import("node:http").IncomingMessage, maxBytes = 64_000): Promise<string> {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > maxBytes) {
      throw new Error("BODY_TOO_LARGE");
    }
  }
  return body;
}
