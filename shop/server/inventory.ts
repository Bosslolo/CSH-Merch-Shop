import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { InventoryFile, PublicStockEntry } from "../shared/shop-types.js";
import { CATALOG, defaultInventory, getCatalogProduct, stockKey } from "./catalog.js";
import { withFileLock } from "./file-lock.js";
import { readJsonFile, writeJsonFile } from "./json-store.js";

function inventoryPath(root: string) {
  return path.join(root, "data", "inventory.json");
}

/** Shared lock key so order create + stock mutations never interleave across modules. */
export function shopDataLockKey(root: string) {
  return path.join(root, "data", ".shop-data.lock");
}

function loadInventoryUnlocked(root: string): InventoryFile {
  const fallback: InventoryFile = {
    stock: defaultInventory(),
    updatedAt: new Date().toISOString(),
  };
  const data = readJsonFile(inventoryPath(root), fallback);
  let changed = false;
  for (const p of CATALOG) {
    for (const size of p.sizes) {
      const key = stockKey(p.slug, size);
      if (data.stock[key] === undefined) {
        data.stock[key] = 20;
        changed = true;
      }
    }
  }
  if (changed) {
    data.updatedAt = new Date().toISOString();
    writeJsonFile(inventoryPath(root), data);
  }
  return data;
}

function saveInventoryUnlocked(root: string, data: InventoryFile) {
  data.updatedAt = new Date().toISOString();
  writeJsonFile(inventoryPath(root), data);
}

export function getStockQuantity(root: string, slug: string, size: string): number {
  const data = loadInventoryUnlocked(root);
  return data.stock[stockKey(slug, size)] ?? 0;
}

/** Must be called while holding shopDataLockKey(root) when used with concurrent order writes. */
export function adjustStockUnlocked(
  root: string,
  adjustments: { slug: string; size: string; delta: number }[]
): { ok: true } | { ok: false; error: string } {
  const data = loadInventoryUnlocked(root);
  for (const { slug, size, delta } of adjustments) {
    const product = getCatalogProduct(slug);
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
  return withFileLock(shopDataLockKey(root), () => adjustStockUnlocked(root, adjustments));
}

export async function setStockLevels(
  root: string,
  updates: { slug: string; size: string; quantity: number }[]
): Promise<{ ok: true; data: InventoryFile } | { ok: false; error: string }> {
  return withFileLock(shopDataLockKey(root), () => {
    const data = loadInventoryUnlocked(root);
    const MAX_STOCK = 500;
    for (const { slug, size, quantity } of updates) {
      const product = getCatalogProduct(slug);
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
  for (const p of CATALOG) {
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

export function getAdminInventory(root: string) {
  const data = loadInventoryUnlocked(root);
  return {
    updatedAt: data.updatedAt,
    products: CATALOG.map((p) => ({
      slug: p.slug,
      name: p.name,
      price: p.price,
      sizes: p.sizes.map((size) => ({
        size,
        quantity: data.stock[stockKey(p.slug, size)] ?? 0,
      })),
    })),
  };
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export function createInventoryHandlers(projectRoot: string) {
  return {
    handlePublicStockRequest(req: IncomingMessage, res: ServerResponse) {
      if (req.method !== "GET") {
        return sendJson(res, 405, { error: "Method not allowed" });
      }
      sendJson(res, 200, { stock: getPublicStock(projectRoot) });
    },
  };
}
