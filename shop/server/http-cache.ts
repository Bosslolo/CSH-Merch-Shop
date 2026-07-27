import type { IncomingMessage, ServerResponse } from "node:http";

/** Weak ETag from a revision string (e.g. updatedAt). */
export function weakEtag(revision: string): string {
  return `W/"${revision.replace(/"/g, "")}"`;
}

export function sendJsonCached(
  req: IncomingMessage,
  res: ServerResponse,
  status: number,
  body: unknown,
  revision: string,
  maxAgeSeconds = 30
): void {
  const etag = weakEtag(revision);
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", `public, max-age=${maxAgeSeconds}, must-revalidate`);
  res.setHeader("Vary", "Accept-Encoding");

  const client = req.headers["if-none-match"];
  if (typeof client === "string" && client === etag) {
    res.writeHead(304);
    res.end();
    return;
  }

  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
