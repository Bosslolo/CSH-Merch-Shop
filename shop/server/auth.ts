import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const ADMIN_COOKIE = "csh_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!secret) return "";
  return secret;
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

function signPayload(payload: string): string {
  const secret = getSessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function createSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const exp = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${exp}.${nonce}`;
  const sig = signPayload(payload);
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expStr, nonce, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = signPayload(`${expStr}.${nonce}`);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

function parseCookie(req: IncomingMessage, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const match = raw.split(";").find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]?.trim() ?? "") : null;
}

function setSessionCookie(res: ServerResponse, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`
  );
}

function clearSessionCookie(res: ServerResponse) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

export function isAdminAuthenticated(req: IncomingMessage): boolean {
  const token = parseCookie(req, ADMIN_COOKIE);
  if (!token) return false;
  return verifySessionToken(token);
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.socket.remoteAddress ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedLogin(ip: string) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };
  if (now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
  loginAttempts.set(ip, entry);
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export function createAuthHandlers() {
  return {
    handleAuthRequest: async (req: IncomingMessage, res: ServerResponse, pathname: string) => {
      if (pathname === "/api/admin/session" && req.method === "GET") {
        const configured = Boolean(getAdminPassword() && getSessionSecret());
        return sendJson(res, 200, {
          authenticated: isAdminAuthenticated(req),
          configured,
        });
      }

      if (pathname === "/api/admin/login" && req.method === "POST") {
        const ip = getClientIp(req);
        if (isRateLimited(ip)) {
          return sendJson(res, 429, { error: "Zu viele Versuche. Bitte später erneut." });
        }

        const password = getAdminPassword();
        if (!password || !getSessionSecret()) {
          return sendJson(res, 503, { error: "Admin-Zugang ist nicht konfiguriert." });
        }

        let body = "";
        try {
          const { readBody } = await import("./json-store.js");
          body = await readBody(req, 4_096);
        } catch (e) {
          if (e instanceof Error && e.message === "BODY_TOO_LARGE") {
            return sendJson(res, 413, { error: "Anfrage zu gross." });
          }
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }

        let parsed: { password?: string };
        try {
          parsed = JSON.parse(body);
        } catch {
          recordFailedLogin(ip);
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }

        const submitted = parsed.password ?? "";
        const expected = Buffer.from(password);
        const actual = Buffer.from(submitted);
        const match =
          expected.length === actual.length && timingSafeEqual(expected, actual);

        if (!match) {
          recordFailedLogin(ip);
          return sendJson(res, 401, { error: "Falsches Passwort." });
        }

        const token = createSessionToken();
        if (!token) {
          return sendJson(res, 503, { error: "Session konnte nicht erstellt werden." });
        }
        setSessionCookie(res, token);
        return sendJson(res, 200, { ok: true });
      }

      if (pathname === "/api/admin/logout" && req.method === "POST") {
        clearSessionCookie(res);
        return sendJson(res, 200, { ok: true });
      }

      sendJson(res, 404, { error: "Not found" });
    },

    requireAdmin(req: IncomingMessage, res: ServerResponse): boolean {
      if (isAdminAuthenticated(req)) return true;
      sendJson(res, 401, { error: "Nicht angemeldet." });
      return false;
    },
  };
}
