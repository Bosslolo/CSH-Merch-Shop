import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type StockMap = Record<string, number>;

function stockKey(slug: string, size: string) {
  return `${slug}|${size}`;
}

interface StockState {
  stock: StockMap;
  loading: boolean;
  unavailable: boolean;
  getAvailable: (slug: string, size: string) => number | null;
}

const StockContext = createContext<StockState | null>(null);

export function StockProvider({ children }: { children: ReactNode }) {
  const [stock, setStock] = useState<StockMap>({});
  const [loading, setLoading] = useState(true);
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

  const getAvailable = useCallback(
    (slug: string, size: string): number | null => {
      if (unavailable) return 0;
      if (loading) return null;
      return stock[stockKey(slug, size)] ?? 0;
    },
    [unavailable, loading, stock]
  );

  const value = useMemo(
    () => ({ stock, loading, unavailable, getAvailable }),
    [stock, loading, unavailable, getAvailable]
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) {
    throw new Error("useStock must be used within StockProvider");
  }
  return ctx;
}
