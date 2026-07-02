import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

export const DROP_ID = "drop-2026-spring";
const VOTE_COOKIE = "csh_vote";
const VALID_DESIGNS = new Set(["building-print", "crest-logo", "community-tees"]);

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

function dataPath(root: string) {
  return path.join(root, "data", "votes.json");
}

function ensureDataFile(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ records: [] } satisfies VotesFile, null, 2));
  }
}

function readVotes(filePath: string): VotesFile {
  ensureDataFile(filePath);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as VotesFile;
}

function writeVotes(filePath: string, data: VotesFile) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function hashFingerprint(fingerprint: string, ip: string) {
  return createHash("sha256").update(`${fingerprint}|${ip}`).digest("hex");
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.socket.remoteAddress ?? "unknown";
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
  return fp && fp.length >= 8 ? fp : null;
}

export function createVoteHandlers(projectRoot: string) {
  const filePath = dataPath(projectRoot);

  function sendJson(res: ServerResponse, status: number, body: unknown) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  }

  async function handleGet(req: IncomingMessage, res: ServerResponse) {
    const data = readVotes(filePath);
    const cookie = parseCookie(req, VOTE_COOKIE);
    const fingerprint = parseFingerprintQuery(req);
    const ip = getClientIp(req);
    const fpHash = fingerprint ? hashFingerprint(fingerprint, ip) : null;
    const dropRecords = data.records.filter((r) => r.dropId === DROP_ID);
    const existing =
      (fpHash ? dropRecords.find((r) => r.fingerprintHash === fpHash) : undefined) ??
      (cookie ? dropRecords.find((r) => r.fingerprintHash === cookie) : undefined);

    sendJson(res, 200, {
      tallies: buildTallies(data.records),
      hasVoted: Boolean(existing),
      votedDesignId: existing?.designId ?? null,
    });
  }

  async function handlePost(req: IncomingMessage, res: ServerResponse) {
    let body = "";
    for await (const chunk of req) body += chunk;

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
    if (!fingerprint || typeof fingerprint !== "string" || fingerprint.length < 8) {
      return sendJson(res, 400, { error: "Fingerabdruck fehlt." });
    }

    const data = readVotes(filePath);
    const ip = getClientIp(req);
    const fpHash = hashFingerprint(fingerprint, ip);
    const cookie = parseCookie(req, VOTE_COOKIE);
    const existing = findExistingVote(data.records, fpHash, cookie);

    if (existing) {
      return sendJson(res, 409, {
        error: "Du hast bereits abgestimmt.",
        hasVoted: true,
        votedDesignId: existing.designId,
        tallies: buildTallies(data.records),
      });
    }

    data.records.push({
      dropId: DROP_ID,
      designId,
      fingerprintHash: fpHash,
      ip,
      votedAt: new Date().toISOString(),
    });
    writeVotes(filePath, data);

    res.setHeader(
      "Set-Cookie",
      `${VOTE_COOKIE}=${fpHash}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`
    );

    sendJson(res, 200, {
      tallies: buildTallies(data.records),
      hasVoted: true,
      votedDesignId: designId,
    });
  }

  return {
    handleVoteRequest(req: IncomingMessage, res: ServerResponse) {
      if (req.method === "GET") return handleGet(req, res);
      if (req.method === "POST") return handlePost(req, res);
      sendJson(res, 405, { error: "Method not allowed" });
    },
  };
}
