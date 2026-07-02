import { useEffect, useState } from "react";

export type StockMap = Record<string, number>;

function stockKey(slug: string, size: string) {
  return `${slug}|${size}`;
}

export function useStock() {
  const [stock, setStock] = useState<StockMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        if (cancelled) return;
        const map: StockMap = {};
        for (const entry of data.stock ?? []) {
          map[stockKey(entry.slug, entry.size)] = entry.quantity;
        }
        setStock(map);
      } catch {
        if (!cancelled) setStock({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getAvailable = (slug: string, size: string) => stock[stockKey(slug, size)] ?? null;

  return { stock, loading, getAvailable };
}
