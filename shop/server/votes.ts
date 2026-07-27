import { createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getClientIp } from "./client-ip.js";
import {
  dbFindVote,
  dbInsertVote,
  dbListVotes,
  ensureShopDb,
  type VoteRecord,
} from "./db.js";
import { readBody } from "./json-store.js";
import { hitRateLimit } from "./rate-limit.js";

export const DROP_ID = "drop-2026-spring";
const VOTE_COOKIE = "csh_vote";
const VALID_DESIGNS = new Set(["building-print", "crest-logo", "community-tees"]);
const VOTE_RATE_MAX = 20;
const VOTE_RATE_WINDOW_MS = 15 * 60 * 1000;

function votingEnabled(): boolean {
  const v = (process.env.VOTING_ENABLED ?? "false").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function hashFingerprint(fingerprint: string, ip: string) {
  return createHash("sha256").update(`${fingerprint}|${ip}`).digest("hex");
}

function parseCookie(req: IncomingMessage, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const match = raw.split(";").find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]?.trim() ?? "") : null;
}

function buildTallies(records: VoteRecord[]) {
  const tallies: Record<string, number> = {};
  for (const id of Array.from(VALID_DESIGNS)) tallies[id] = 0;
  for (const r of records.filter((x) => x.dropId === DROP_ID)) {
    tallies[r.designId] = (tallies[r.designId] ?? 0) + 1;
  }
  return tallies;
}

function parseFingerprintQuery(req: IncomingMessage): string | null {
  const raw = req.url ?? "";
  const qIndex = raw.indexOf("?");
  if (qIndex < 0) return null;
  const fp = new URLSearchParams(raw.slice(qIndex)).get("fingerprint");
  return fp && fp.length >= 8 && fp.length <= 128 ? fp : null;
}

export function createVoteHandlers(projectRoot: string) {
  ensureShopDb(projectRoot);

  function sendJson(res: ServerResponse, status: number, body: unknown) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  }

  async function handleGet(req: IncomingMessage, res: ServerResponse) {
    const enabled = votingEnabled();
    const records = dbListVotes(projectRoot);
    const cookie = parseCookie(req, VOTE_COOKIE);
    const fingerprint = parseFingerprintQuery(req);
    const ip = getClientIp(req);
    const fpHash = fingerprint ? hashFingerprint(fingerprint, ip) : null;
    const existing =
      (fpHash ? dbFindVote(projectRoot, DROP_ID, fpHash, cookie) : undefined) ??
      (cookie ? dbFindVote(projectRoot, DROP_ID, cookie, null) : undefined);

    sendJson(res, 200, {
      enabled,
      tallies: buildTallies(records),
      hasVoted: Boolean(existing),
      votedDesignId: existing?.designId ?? null,
    });
  }

  async function handlePost(req: IncomingMessage, res: ServerResponse) {
    if (!votingEnabled()) {
      return sendJson(res, 403, {
        error: "Abstimmung ist noch nicht freigeschaltet.",
        enabled: false,
      });
    }

    const ip = getClientIp(req);
    if (hitRateLimit(`vote:ip:${ip}`, VOTE_RATE_MAX, VOTE_RATE_WINDOW_MS)) {
      return sendJson(res, 429, { error: "Zu viele Versuche. Bitte später erneut." });
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

    let parsed: { designId?: string; fingerprint?: string };
    try {
      parsed = JSON.parse(body);
    } catch {
      return sendJson(res, 400, { error: "Ungültige Anfrage." });
    }

    const { designId, fingerprint } = parsed;
    if (!designId || !VALID_DESIGNS.has(designId)) {
      return sendJson(res, 400, { error: "Unbekanntes Design." });
    }
    if (
      !fingerprint ||
      typeof fingerprint !== "string" ||
      fingerprint.length < 8 ||
      fingerprint.length > 128
    ) {
      return sendJson(res, 400, { error: "Fingerabdruck fehlt." });
    }

    const fpHash = hashFingerprint(fingerprint, ip);
    const cookie = parseCookie(req, VOTE_COOKIE);
    const existing = dbFindVote(projectRoot, DROP_ID, fpHash, cookie);
    if (existing) {
      return sendJson(res, 409, {
        error: "Du hast bereits abgestimmt.",
        hasVoted: true,
        votedDesignId: existing.designId,
        tallies: buildTallies(dbListVotes(projectRoot)),
      });
    }

    const inserted = dbInsertVote(projectRoot, {
      dropId: DROP_ID,
      designId,
      fingerprintHash: fpHash,
      ip,
      votedAt: new Date().toISOString(),
    });
    if (!inserted) {
      const again = dbFindVote(projectRoot, DROP_ID, fpHash, cookie);
      return sendJson(res, 409, {
        error: "Du hast bereits abgestimmt.",
        hasVoted: true,
        votedDesignId: again?.designId ?? designId,
        tallies: buildTallies(dbListVotes(projectRoot)),
      });
    }

    res.setHeader(
      "Set-Cookie",
      `${VOTE_COOKIE}=${fpHash}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`
    );

    return sendJson(res, 200, {
      tallies: buildTallies(dbListVotes(projectRoot)),
      hasVoted: true,
      votedDesignId: designId,
    });
  }

  return {
    handleVoteRequest(req: IncomingMessage, res: ServerResponse) {
      if (req.method === "GET") return handleGet(req, res);
      if (req.method === "POST") return void handlePost(req, res);
      sendJson(res, 405, { error: "Method not allowed" });
    },
  };
}
