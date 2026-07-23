/** Single source of truth for sellable products (server + client prices/sizes). */
export const CATALOG_META = [
  { slug: "csh-hoodie-blau", name: "CSH Hoodie Blau", price: 25, sizes: ["S", "M", "L", "XL"] },
  { slug: "csh-hoodie-schwarz", name: "CSH Hoodie Schwarz", price: 25, sizes: ["S", "M", "L", "XL"] },
  { slug: "csh-hoodie-weiss", name: "CSH Hoodie Weiss", price: 25, sizes: ["S", "M", "L", "XL"] },
  { slug: "csh-t-shirt-schwarz", name: "CSH T-Shirt Schwarz", price: 15, sizes: ["S", "M", "L", "XL"] },
  { slug: "csh-t-shirt-weiss", name: "CSH T-Shirt Weiss", price: 15, sizes: ["S", "M", "L", "XL"] },
] as const;

export type CatalogSlug = (typeof CATALOG_META)[number]["slug"];
export type CatalogSize = (typeof CATALOG_META)[number]["sizes"][number];

export function getCatalogMeta(slug: string) {
  return CATALOG_META.find((p) => p.slug === slug);
}

export function stockKey(slug: string, size: string) {
  return `${slug}|${size}`;
}

export function parseStockKey(key: string): { slug: string; size: string } | null {
  const i = key.lastIndexOf("|");
  if (i < 1) return null;
  return { slug: key.slice(0, i), size: key.slice(i + 1) };
}

export function defaultInventory(): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const p of CATALOG_META) {
    for (const size of p.sizes) {
      stock[stockKey(p.slug, size)] = 20;
    }
  }
  return stock;
}
