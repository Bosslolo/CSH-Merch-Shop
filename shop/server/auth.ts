import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getClientIp } from "./client-ip.js";
import { adminCookieShouldBeSecure } from "./payments-config.js";
import { isRateLimited, recordAttempt } from "./rate-limit.js";
import { readBody } from "./json-store.js";

const ADMIN_COOKIE = "csh_admin_session";
const REMEMBER_COOKIE = "csh_admin_device";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const REMEMBER_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

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

function userAgentFingerprint(req: IncomingMessage): string {
  return createHmac("sha256", getSessionSecret() || "csh-admin")
    .update(req.headers["user-agent"] ?? "unknown")
    .digest("hex")
    .slice(0, 24);
}

function createToken(expMs: number, scope: string, device: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const exp = Date.now() + expMs;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${scope}.${exp}.${device}.${nonce}`;
  const sig = signPayload(payload);
  return `${payload}.${sig}`;
}

function createSessionToken(req: IncomingMessage): string | null {
  return createToken(SESSION_TTL_MS, "session", userAgentFingerprint(req));
}

function createRememberToken(req: IncomingMessage): string | null {
  return createToken(REMEMBER_TTL_MS, "remember", userAgentFingerprint(req));
}

function verifyToken(token: string, req: IncomingMessage, scope: "session" | "remember"): boolean {
  const parts = token.split(".");
  if (parts.length !== 5) return false;
  const [tokenScope, expStr, device, nonce, sig] = parts;
  if (tokenScope !== scope) return false;
  if (device !== userAgentFingerprint(req)) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = signPayload(`${tokenScope}.${expStr}.${device}.${nonce}`);
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

function setCookie(res: ServerResponse, name: string, token: string, maxAgeMs: number) {
  const secure = adminCookieShouldBeSecure() ? "; Secure" : "";
  return `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`;
}

function setSessionCookie(res: ServerResponse, token: string) {
  res.setHeader("Set-Cookie", setCookie(res, ADMIN_COOKIE, token, SESSION_TTL_MS));
}

function setRememberCookie(res: ServerResponse, token: string) {
  const current = res.getHeader("Set-Cookie");
  const next = setCookie(res, REMEMBER_COOKIE, token, REMEMBER_TTL_MS);
  res.setHeader("Set-Cookie", Array.isArray(current) ? [...current, next] : current ? [String(current), next] : [next]);
}

function clearSessionCookie(res: ServerResponse) {
  const secure = adminCookieShouldBeSecure() ? "; Secure" : "";
  const cookies = [
    `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
    `${REMEMBER_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
  ];
  res.setHeader("Set-Cookie", cookies);
}

export function isAdminAuthenticated(req: IncomingMessage): boolean {
  const token = parseCookie(req, ADMIN_COOKIE);
  if (!token) return false;
  return verifyToken(token, req, "session");
}

function tryRestoreRememberedSession(req: IncomingMessage, res: ServerResponse): boolean {
  const remember = parseCookie(req, REMEMBER_COOKIE);
  if (!remember || !verifyToken(remember, req, "remember")) return false;
  const nextSession = createSessionToken(req);
  if (!nextSession) return false;
  setSessionCookie(res, nextSession);
  return true;
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
        const authenticated = isAdminAuthenticated(req) || tryRestoreRememberedSession(req, res);
        return sendJson(res, 200, {
          authenticated,
          configured,
        });
      }

      if (pathname === "/api/admin/login" && req.method === "POST") {
        const ip = getClientIp(req);
        if (isRateLimited(`admin-login:${ip}`, MAX_ATTEMPTS, WINDOW_MS)) {
          return sendJson(res, 429, { error: "Zu viele Versuche. Bitte später erneut." });
        }

        const password = getAdminPassword();
        if (!password || !getSessionSecret()) {
          return sendJson(res, 503, { error: "Admin-Zugang ist nicht konfiguriert." });
        }

        let body = "";
        try {
          body = await readBody(req, 4_096);
        } catch (e) {
          if (e instanceof Error && e.message === "BODY_TOO_LARGE") {
            return sendJson(res, 413, { error: "Anfrage zu gross." });
          }
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }

        let parsed: { password?: string; rememberDevice?: boolean };
        try {
          parsed = JSON.parse(body);
        } catch {
          recordAttempt(`admin-login:${ip}`, WINDOW_MS);
          return sendJson(res, 400, { error: "Ungültige Anfrage." });
        }

        const submitted = parsed.password ?? "";
        const expected = Buffer.from(password);
        const actual = Buffer.from(submitted);
        const match =
          expected.length === actual.length && timingSafeEqual(expected, actual);

        if (!match) {
          recordAttempt(`admin-login:${ip}`, WINDOW_MS);
          return sendJson(res, 401, { error: "Falsches Passwort." });
        }

        const token = createSessionToken(req);
        if (!token) {
          return sendJson(res, 503, { error: "Session konnte nicht erstellt werden." });
        }
        setSessionCookie(res, token);
        if (parsed.rememberDevice) {
          const rememberToken = createRememberToken(req);
          if (rememberToken) setRememberCookie(res, rememberToken);
        }
        return sendJson(res, 200, { ok: true });
      }

      if (pathname === "/api/admin/logout" && req.method === "POST") {
        clearSessionCookie(res);
        return sendJson(res, 200, { ok: true });
      }

      sendJson(res, 404, { error: "Not found" });
    },

    requireAdmin(req: IncomingMessage, res: ServerResponse): boolean {
      if (isAdminAuthenticated(req) || tryRestoreRememberedSession(req, res)) return true;
      sendJson(res, 401, { error: "Nicht angemeldet." });
      return false;
    },
  };
}
