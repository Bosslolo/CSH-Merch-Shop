import type { IncomingMessage, ServerResponse } from "node:http";
import type { InventoryFile, PublicStockEntry } from "../shared/shop-types.js";
import { defaultInventory, getCatalogCollections, getCatalogProduct, getCatalogProducts, stockKey } from "./catalog.js";
import { dbLoadInventory, dbSaveInventory, dbWithShopTransaction, ensureShopDb } from "./db.js";
import { sendJsonCached } from "./http-cache.js";

/** @deprecated SQLite transactions replace the file lock; kept for call-site compatibility. */
export function shopDataLockKey(root: string) {
  return root;
}

function loadInventoryUnlocked(root: string): InventoryFile {
  ensureShopDb(root);
  const data = dbLoadInventory(root);
  const stock = { ...data.stock };
  let changed = false;
  for (const p of getCatalogProducts(root)) {
    for (const size of p.sizes) {
      const key = stockKey(p.slug, size);
      if (stock[key] === undefined) {
        stock[key] = 20;
        changed = true;
      }
    }
  }
  if (!Object.keys(stock).length) {
    Object.assign(stock, defaultInventory(root));
    changed = true;
  }
  if (changed) {
    const next: InventoryFile = { stock, updatedAt: new Date().toISOString() };
    dbSaveInventory(root, next);
    return next;
  }
  return { stock, updatedAt: data.updatedAt };
}

function saveInventoryUnlocked(root: string, data: InventoryFile) {
  data.updatedAt = new Date().toISOString();
  dbSaveInventory(root, data);
}

export function getStockQuantity(root: string, slug: string, size: string): number {
  const data = loadInventoryUnlocked(root);
  return data.stock[stockKey(slug, size)] ?? 0;
}

/** Must run inside dbWithShopTransaction when used with concurrent order writes. */
export function adjustStockUnlocked(
  root: string,
  adjustments: { slug: string; size: string; delta: number }[]
): { ok: true } | { ok: false; error: string } {
  const data = loadInventoryUnlocked(root);
  for (const { slug, size, delta } of adjustments) {
    const product = getCatalogProduct(root, slug);
    if (!product || !product.sizes.includes(size as (typeof product.sizes)[number])) {
      return { ok: false, error: `Ungültige Variante: ${slug} / ${size}` };
    }
    const key = stockKey(slug, size);
    const next = (data.stock[key] ?? 0) + delta;
    if (next < 0) {
      return { ok: false, error: `Nicht genug Bestand für ${product.name} (${size}).` };
    }
    data.stock[key] = next;
  }
  saveInventoryUnlocked(root, data);
  return { ok: true };
}

export async function adjustStock(
  root: string,
  adjustments: { slug: string; size: string; delta: number }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  return dbWithShopTransaction(root, () => adjustStockUnlocked(root, adjustments));
}

export async function setStockLevels(
  root: string,
  updates: { slug: string; size: string; quantity: number }[]
): Promise<{ ok: true; data: InventoryFile } | { ok: false; error: string }> {
  return dbWithShopTransaction(root, () => {
    const data = loadInventoryUnlocked(root);
    const MAX_STOCK = 500;
    for (const { slug, size, quantity } of updates) {
      const product = getCatalogProduct(root, slug);
      if (!product || !product.sizes.includes(size as (typeof product.sizes)[number])) {
        return { ok: false, error: `Ungültige Variante: ${slug} / ${size}` };
      }
      if (!Number.isInteger(quantity) || quantity < 0) {
        return { ok: false, error: "Bestand muss eine ganze Zahl >= 0 sein." };
      }
      if (quantity > MAX_STOCK) {
        return { ok: false, error: `Bestand darf höchstens ${MAX_STOCK} sein.` };
      }
      data.stock[stockKey(slug, size)] = quantity;
    }
    saveInventoryUnlocked(root, data);
    return { ok: true, data };
  });
}

export function getPublicStock(root: string): PublicStockEntry[] {
  const data = loadInventoryUnlocked(root);
  const entries: PublicStockEntry[] = [];
  for (const p of getCatalogProducts(root, { activeOnly: true })) {
    for (const size of p.sizes) {
      entries.push({
        slug: p.slug,
        size,
        quantity: data.stock[stockKey(p.slug, size)] ?? 0,
      });
    }
  }
  return entries;
}

export function getInventoryUpdatedAt(root: string): string {
  return loadInventoryUnlocked(root).updatedAt;
}

export function getAdminInventory(root: string) {
  const data = loadInventoryUnlocked(root);
  const products = getCatalogProducts(root);
  return {
    updatedAt: data.updatedAt,
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: p.image,
      collection: p.collection,
      collectionLabel:
        getCatalogCollections(root).find((c) => c.id === p.collection)?.name ||
        (p.collection === "small" ? "Kids Kollektion" : "Campus Kollektion"),
      groupKey: p.groupKey,
      groupLabel: p.groupLabel,
      sizes: p.sizes.map((size) => ({
        size,
        quantity: data.stock[stockKey(p.slug, size)] ?? 0,
      })),
    })),
  };
}

export function createInventoryHandlers(projectRoot: string) {
  return {
    handlePublicStockRequest(req: IncomingMessage, res: ServerResponse) {
      if (req.method !== "GET") {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }
      const stock = getPublicStock(projectRoot);
      const updatedAt = getInventoryUpdatedAt(projectRoot);
      sendJsonCached(req, res, 200, { stock, updatedAt }, updatedAt);
    },
  };
}
