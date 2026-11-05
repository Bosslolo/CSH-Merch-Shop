/**
 * Resolve Laurin IT Check push targets (school server → outbound).
 * Mirrors kaffeeliste app/hub_push_config.py for ingest path csh-merch.
 *
 * HUB_PUSH_MODE:
 *   - local      → Mac/dev hub on school LAN
 *   - production → hub.glaciers.online
 *   - both       → local + production
 *
 * Override with HUB_PUSH_URL (single) or HUB_PUSH_URLS (comma-separated).
 */
export function resolveHubPushUrls(appSlug = "csh-merch"): string[] {
  const explicitUrls = (process.env.HUB_PUSH_URLS || "").trim();
  if (explicitUrls) {
    return explicitUrls
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
  }

  const single = (process.env.HUB_PUSH_URL || "").trim();
  if (single) {
    return [single];
  }

  const mode = (process.env.HUB_PUSH_MODE || "local").trim().toLowerCase();
  const localHost = (process.env.HUB_PUSH_LOCAL_HOST || "YOUR_MAC_LAN_IP").trim();
  const localPort = (process.env.HUB_PUSH_LOCAL_PORT || "5180").trim();
  const localUrl = `http://${localHost}:${localPort}/api/ingest/${appSlug}`;
  const prodUrl = `https://hub.glaciers.online/api/ingest/${appSlug}`;

  if (mode === "production") return [prodUrl];
  if (mode === "both") return [localUrl, prodUrl];
  return [localUrl];
}

export function hubPushEnabled(): boolean {
  const v = (process.env.HUB_PUSH_ENABLED ?? "true").toLowerCase();
  return v !== "false" && v !== "0" && v !== "no";
}
