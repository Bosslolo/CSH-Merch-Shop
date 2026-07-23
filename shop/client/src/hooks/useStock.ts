import { useEffect, useState } from "react";

export type StockMap = Record<string, number>;

function stockKey(slug: string, size: string) {
  return `${slug}|${size}`;
}

export function useStock() {
  const [stock, setStock] = useState<StockMap>({});
  const [loading, setLoading] = useState(true);
  /** true when /api/stock failed — buyers should be blocked (fail closed). */
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stock");
        if (!res.ok) throw new Error("stock http");
        const data = await res.json();
        if (cancelled) return;
        const map: StockMap = {};
        for (const entry of data.stock ?? []) {
          map[stockKey(entry.slug, entry.size)] = entry.quantity;
        }
        setStock(map);
        setUnavailable(false);
      } catch {
        if (!cancelled) {
          setStock({});
          setUnavailable(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getAvailable = (slug: string, size: string): number | null => {
    if (unavailable) return 0;
    if (loading) return null;
    return stock[stockKey(slug, size)] ?? 0;
  };

  return { stock, loading, unavailable, getAvailable };
}
