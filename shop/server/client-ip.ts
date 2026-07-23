import type { IncomingMessage } from "node:http";

/**
 * Resolve client IP. Only trust X-Forwarded-For when TRUST_PROXY=1
 * (or true/yes) — otherwise attackers can rotate that header freely.
 */
export function getClientIp(req: IncomingMessage): string {
  const trust =
    process.env.TRUST_PROXY === "1" ||
    process.env.TRUST_PROXY === "true" ||
    process.env.TRUST_PROXY === "yes";

  if (trust) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
      return forwarded.split(",")[0]?.trim() || "unknown";
    }
  }

  return req.socket.remoteAddress ?? "unknown";
}
