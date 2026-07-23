import { createHash } from "node:crypto";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getClientIp } from "./client-ip.js";
import { withFileLock } from "./file-lock.js";
import { readBody, readJsonFile, writeJsonFile } from "./json-store.js";
import { hitRateLimit } from "./rate-limit.js";

export const DROP_ID = "drop-2026-spring";
const VOTE_COOKIE = "csh_vote";
const VALID_DESIGNS = new Set(["building-print", "crest-logo", "community-tees"]);
const VOTE_RATE_MAX = 20;
const VOTE_RATE_WINDOW_MS = 15 * 60 * 1000;

interface VoteRecord {
  dropId: string;
  designId: string;
  fingerprintHash: string;
  ip: string;
  votedAt: string;
}

interface VotesFile {
  records: VoteRecord[];
}

function votingEnabled(): boolean {
  const v = (process.env.VOTING_ENABLED ?? "false").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function dataPath(root: string) {
  return path.join(root, "data", "votes.json");
}

function readVotes(filePath: string): VotesFile {
  return readJsonFile(filePath, { records: [] } satisfies VotesFile);
}

function writeVotes(filePath: string, data: VotesFile) {
  writeJsonFile(filePath, data);
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

function findExistingVote(records: VoteRecord[], fpHash: string, cookie: string | null) {
  const dropRecords = records.filter((r) => r.dropId === DROP_ID);
  return (
    dropRecords.find((r) => r.fingerprintHash === fpHash) ??
    (cookie ? dropRecords.find((r) => r.fingerprintHash === cookie) : undefined)
  );
}

function parseFingerprintQuery(req: IncomingMessage): string | null {
  const raw = req.url ?? "";
  const qIndex = raw.indexOf("?");
  if (qIndex < 0) return null;
  const fp = new URLSearchParams(raw.slice(qIndex)).get("fingerprint");
  return fp && fp.length >= 8 && fp.length <= 128 ? fp : null;
}

export function createVoteHandlers(projectRoot: string) {
  const filePath = dataPath(projectRoot);

  function sendJson(res: ServerResponse, status: number, body: unknown) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  }

  async function handleGet(req: IncomingMessage, res: ServerResponse) {
    const enabled = votingEnabled();
    const data = await withFileLock(filePath, () => readVotes(filePath));
    const cookie = parseCookie(req, VOTE_COOKIE);
    const fingerprint = parseFingerprintQuery(req);
    const ip = getClientIp(req);
    const fpHash = fingerprint ? hashFingerprint(fingerprint, ip) : null;
    const dropRecords = data.records.filter((r) => r.dropId === DROP_ID);
    const existing =
      (fpHash ? dropRecords.find((r) => r.fingerprintHash === fpHash) : undefined) ??
      (cookie ? dropRecords.find((r) => r.fingerprintHash === cookie) : undefined);

    sendJson(res, 200, {
      enabled,
      tallies: buildTallies(data.records),
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

    try {
      const result = await withFileLock(filePath, () => {
        const data = readVotes(filePath);
        const existing = findExistingVote(data.records, fpHash, cookie);
        if (existing) {
          return {
            conflict: true as const,
            existing,
            tallies: buildTallies(data.records),
          };
        }

        data.records.push({
          dropId: DROP_ID,
          designId,
          fingerprintHash: fpHash,
          ip,
          votedAt: new Date().toISOString(),
        });
        writeVotes(filePath, data);
        return {
          conflict: false as const,
          tallies: buildTallies(data.records),
          designId,
        };
      });

      if (result.conflict) {
        return sendJson(res, 409, {
          error: "Du hast bereits abgestimmt.",
          hasVoted: true,
          votedDesignId: result.existing.designId,
          tallies: result.tallies,
        });
      }

      res.setHeader(
        "Set-Cookie",
        `${VOTE_COOKIE}=${fpHash}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`
      );

      return sendJson(res, 200, {
        tallies: result.tallies,
        hasVoted: true,
        votedDesignId: result.designId,
      });
    } catch (err) {
      console.error("[votes] write failed", err);
      return sendJson(res, 500, { error: "Stimme konnte nicht gespeichert werden." });
    }
  }

  return {
    handleVoteRequest(req: IncomingMessage, res: ServerResponse) {
      if (req.method === "GET") return handleGet(req, res);
      if (req.method === "POST") return void handlePost(req, res);
      sendJson(res, 405, { error: "Method not allowed" });
    },
  };
}
