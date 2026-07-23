/** Simple in-memory sliding window rate limiter (per process). */

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 0, resetAt: now + windowMs });
    return false;
  }
  return entry.count >= maxAttempts;
}

export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
  buckets.set(key, entry);
}

/** Call after a successful action that should still count toward the limit (e.g. order create). */
export function hitRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  if (isRateLimited(key, maxAttempts, windowMs)) return true;
  recordAttempt(key, windowMs);
  return false;
}
