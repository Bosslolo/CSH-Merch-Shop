import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatalogCollection, CatalogProduct } from "@shared/shop-types";
import { fetchPublicCatalog } from "@/lib/admin-api";

interface CatalogState {
  collections: CatalogCollection[];
  products: CatalogProduct[];
  updatedAt: string;
  loading: boolean;
  error: string | null;
  getProduct: (slug: string) => CatalogProduct | undefined;
}

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<CatalogCollection[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await fetchPublicCatalog();
        if (cancelled) return;
        setCollections(next.collections ?? []);
        setProducts(next.products ?? []);
        setUpdatedAt(next.updatedAt ?? "");
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Katalog konnte nicht geladen werden.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.slug, product])),
    [products]
  );

  const value = useMemo<CatalogState>(
    () => ({
      collections,
      products,
      updatedAt,
      loading,
      error,
      getProduct: (slug: string) => productMap.get(slug),
    }),
    [collections, products, updatedAt, loading, error, productMap]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}
