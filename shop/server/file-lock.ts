/** Simple in-process async mutex keyed by resource path (covers concurrent request interleaving). */
const tails = new Map<string, Promise<unknown>>();

export async function withFileLock<T>(key: string, fn: () => T | Promise<T>): Promise<T> {
  const prev = tails.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const next = prev.then(() => gate);
  tails.set(key, next);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (tails.get(key) === next) tails.delete(key);
  }
}
