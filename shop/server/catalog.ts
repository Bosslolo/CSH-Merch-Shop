import type { CatalogCollection, CatalogFile, CatalogProduct, CollectionId } from "../shared/shop-types.js";
import { dbLoadCatalog, dbSaveCatalog, ensureShopDb } from "./db.js";

const c = (p: string) => `/images/catalog/${p}`;

const DEFAULT_COLLECTIONS: CatalogCollection[] = [
  {
    id: "large",
    name: "Campus Kollektion",
    lead: "Hoodies und Shirts in Erwachsenengrößen für die ganze Schulgemeinschaft.",
    cardNote: "Alltagstauglich für Mittelstufe bis Oberstufe.",
  },
  {
    id: "small",
    name: "Kids Kollektion",
    lead: "Kleinere Schnitte für KiTa und Kinder.",
    cardNote: "Noch im Aufbau, bald verfügbar.",
    badge: "Bald",
  },
];

const DEFAULT_PRODUCTS: CatalogProduct[] = [
  {
    slug: "csh-hoodie-blau",
    name: "CSH Hoodie Blau",
    subtitle: "Letzte Auflage",
    price: 25,
    compareAt: 35,
    material: "80 % Baumwolle / 20 % Polyester",
    sizingNote: "Fällt klein aus – bei Bedarf eine Größe größer.",
    unityLine: "Navy, klar, CSH – für die ganze Schulgemeinschaft.",
    colors: [{ name: "Blau", hex: "#4070a0" }],
    sizes: ["S", "M", "L", "XL"],
    image: c("products/hoodie-blau-front-studio.jpg"),
    flatLay: c("products/hoodie-blau-front-studio.jpg"),
    gallery: [
      c("products/hoodie-blau-front-studio.jpg"),
      c("products/hoodie-blau-detail-logo.jpg"),
      c("community/group-tees-black-studio.jpg"),
    ],
    tag: "Letzte Auflage",
    collection: "large",
    groupKey: "hoodies",
    groupLabel: "Hoodies",
    active: true,
  },
  {
    slug: "csh-hoodie-schwarz",
    name: "CSH Hoodie Schwarz",
    subtitle: "Letzte Auflage",
    price: 25,
    compareAt: 35,
    material: "80 % Baumwolle / 20 % Polyester",
    sizingNote: "Fällt klein aus – bei Bedarf eine Größe größer.",
    unityLine: "Gebäude-Print auf dem Rücken – Schulstolz zum Anziehen.",
    colors: [{ name: "Schwarz", hex: "#1A1A1A" }],
    sizes: ["S", "M", "L", "XL"],
    image: c("products/hoodie-schwarz-front-studio.jpg"),
    flatLay: c("products/hoodie-schwarz-front-studio.jpg"),
    gallery: [
      c("products/hoodie-schwarz-front-studio.jpg"),
      c("products/hoodie-schwarz-back-building-print.jpg"),
      c("products/hoodie-schwarz-front-lifestyle.jpg"),
    ],
    tag: "Letzte Auflage",
    collection: "large",
    groupKey: "hoodies",
    groupLabel: "Hoodies",
    active: true,
  },
  {
    slug: "csh-hoodie-weiss",
    name: "CSH Hoodie Weiss",
    subtitle: "Letzte Auflage",
    price: 25,
    compareAt: 35,
    material: "80 % Baumwolle / 20 % Polyester",
    sizingNote: "Fällt klein aus – bei Bedarf eine Größe größer.",
    unityLine: "Hell und klar – KiTa bis Oberstufe.",
    colors: [{ name: "Weiss", hex: "#FAFAF8" }],
    sizes: ["S", "M", "L", "XL"],
    image: c("products/hoodie-weiss-front-studio.jpg"),
    flatLay: c("products/hoodie-weiss-front-studio.jpg"),
    gallery: [
      c("products/hoodie-weiss-front-studio.jpg"),
      c("hero/lifestyle-crossgen-hoodies-outdoor.jpg"),
      c("products/hoodie-schwarz-front-lifestyle.jpg"),
    ],
    tag: "Letzte Auflage",
    collection: "large",
    groupKey: "hoodies",
    groupLabel: "Hoodies",
    active: true,
  },
  {
    slug: "csh-t-shirt-schwarz",
    name: "CSH T-Shirt Schwarz",
    subtitle: "Letzte Auflage",
    price: 15,
    compareAt: 25,
    material: "100 % Bio-Baumwolle",
    sizingNote: "Unisex und Mädels (enger). Fällt klein aus.",
    unityLine: "Drei Generationen, ein Shirt – schwarz, schlicht, CSH.",
    colors: [{ name: "Schwarz", hex: "#1A1A1A" }],
    sizes: ["S", "M", "L", "XL"],
    image: c("products/tshirt-schwarz-front-studio.jpg"),
    flatLay: c("products/tshirt-schwarz-front-studio.jpg"),
    gallery: [
      c("products/tshirt-schwarz-front-studio.jpg"),
      c("products/tshirt-schwarz-group-community.jpg"),
      c("products/tshirt-weiss-front-studio.jpg"),
    ],
    tag: "Letzte Auflage",
    collection: "large",
    groupKey: "shirts",
    groupLabel: "Shirts",
    active: true,
  },
  {
    slug: "csh-t-shirt-weiss",
    name: "CSH T-Shirt Weiss",
    subtitle: "Letzte Auflage",
    price: 15,
    compareAt: 25,
    material: "100 % Bio-Baumwolle",
    sizingNote: "Unisex und Mädels (enger). Fällt klein aus.",
    unityLine: "Bio-Baumwolle, weiß, für jeden Tag an der CSH.",
    colors: [{ name: "Weiss", hex: "#FAFAF8" }],
    sizes: ["S", "M", "L", "XL"],
    image: c("products/tshirt-weiss-front-studio.jpg"),
    flatLay: c("products/tshirt-weiss-front-studio.jpg"),
    gallery: [
      c("products/tshirt-weiss-front-studio.jpg"),
      c("products/tshirt-schwarz-group-community.jpg"),
      c("hero/lifestyle-crossgen-hoodies-outdoor.jpg"),
    ],
    tag: "Letzte Auflage",
    collection: "large",
    groupKey: "shirts",
    groupLabel: "Shirts",
    active: true,
  },
];

export function stockKey(slug: string, size: string) {
  return `${slug}|${size}`;
}

export function parseStockKey(key: string): { slug: string; size: string } | null {
  const i = key.lastIndexOf("|");
  if (i < 1) return null;
  return { slug: key.slice(0, i), size: key.slice(i + 1) };
}

export function defaultCatalog(): CatalogFile {
  return {
    collections: DEFAULT_COLLECTIONS.map((collection) => ({ ...collection })),
    products: DEFAULT_PRODUCTS.map((product) => ({
      ...product,
      colors: product.colors.map((color) => ({ ...color })),
      sizes: [...product.sizes],
      gallery: [...product.gallery],
    })),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeCollection(id: string): CollectionId {
  const cleaned = String(id || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!cleaned) return "large";
  if (cleaned === "gross" || cleaned === "große" || cleaned === "grosse") return "large";
  if (cleaned === "klein") return "small";
  return cleaned;
}

function sanitizeProduct(input: CatalogProduct): CatalogProduct {
  const slug = String(input.slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const gallery = Array.from(
    new Set(
      (Array.isArray(input.gallery) ? input.gallery : [])
        .map((src) => String(src || "").trim())
        .filter(Boolean)
    )
  );
  const image = String(input.image || gallery[0] || "").trim();
  const flatLay = String(input.flatLay || image || gallery[0] || "").trim();
  const sizes = Array.from(
    new Set(
      (Array.isArray(input.sizes) ? input.sizes : [])
        .map((size) => String(size || "").trim().toUpperCase())
        .filter(Boolean)
    )
  );
  return {
    slug,
    name: String(input.name || "").trim(),
    subtitle: String(input.subtitle || "").trim(),
    price: Number(input.price || 0),
    compareAt: input.compareAt ? Number(input.compareAt) : undefined,
    material: String(input.material || "").trim(),
    sizingNote: String(input.sizingNote || "").trim(),
    unityLine: String(input.unityLine || "").trim(),
    colors: (Array.isArray(input.colors) ? input.colors : [])
      .map((color) => ({
        name: String(color?.name || "").trim(),
        hex: String(color?.hex || "").trim() || "#1A1A1A",
      }))
      .filter((color) => color.name),
    sizes,
    image,
    flatLay,
    gallery: gallery.length ? gallery : image ? [image] : [],
    tag: String(input.tag || "").trim() || undefined,
    collection: normalizeCollection(input.collection),
    groupKey: String(input.groupKey || "").trim().toLowerCase().replace(/\s+/g, "-") || "misc",
    groupLabel: String(input.groupLabel || "").trim() || "Weitere",
    active: input.active !== false,
    soldOut: Boolean(input.soldOut),
  };
}

function validateCatalog(data: CatalogFile): { ok: true; data: CatalogFile } | { ok: false; error: string } {
  const seen = new Set<string>();
  const collections = (Array.isArray(data.collections) ? data.collections : DEFAULT_COLLECTIONS).map((collection) => ({
    id: normalizeCollection(collection.id),
    name:
      String(collection.name || "").trim() ||
      (normalizeCollection(collection.id) === "small" ? "Kids Kollektion" : "Campus Kollektion"),
    lead: String(collection.lead || "").trim(),
    cardNote: String(collection.cardNote || "").trim(),
    badge: String(collection.badge || "").trim() || undefined,
  }));
  if (!collections.length) {
    return { ok: false, error: "Mindestens eine Kollektion / Kategorie ist nötig." };
  }

  const products = (Array.isArray(data.products) ? data.products : []).map(sanitizeProduct);
  for (const product of products) {
    if (!product.slug) return { ok: false, error: "Jedes Produkt braucht einen Slug." };
    if (seen.has(product.slug)) return { ok: false, error: `Slug doppelt: ${product.slug}` };
    seen.add(product.slug);
    if (!product.name) return { ok: false, error: `Produkt ${product.slug} braucht einen Namen.` };
    if (!Number.isFinite(product.price) || product.price < 0) {
      return { ok: false, error: `Produkt ${product.slug} hat einen ungültigen Preis.` };
    }
    if (!product.sizes.length) return { ok: false, error: `Produkt ${product.slug} braucht mindestens eine Größe.` };
    if (!product.image) return { ok: false, error: `Produkt ${product.slug} braucht ein Vorschaubild.` };
    if (!product.gallery.length) return { ok: false, error: `Produkt ${product.slug} braucht mindestens ein Bild.` };
  }

  return {
    ok: true,
    data: {
      collections,
      products,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function loadCatalog(root: string): CatalogFile {
  ensureShopDb(root);
  const raw = dbLoadCatalog(root);
  if (!raw.products.length) {
    const fallback = defaultCatalog();
    dbSaveCatalog(root, fallback);
    return fallback;
  }
  const validated = validateCatalog(raw);
  if (!validated.ok) {
    const fallback = defaultCatalog();
    dbSaveCatalog(root, fallback);
    return fallback;
  }
  return {
    ...validated.data,
    updatedAt: raw.updatedAt || validated.data.updatedAt,
  };
}

export function saveCatalog(root: string, next: CatalogFile): { ok: true; data: CatalogFile } | { ok: false; error: string } {
  ensureShopDb(root);
  const validated = validateCatalog(next);
  if (!validated.ok) return validated;
  dbSaveCatalog(root, validated.data);
  return { ok: true, data: validated.data };
}

export function getCatalogProducts(root: string, options?: { activeOnly?: boolean }): CatalogProduct[] {
  const products = loadCatalog(root).products;
  return options?.activeOnly ? products.filter((product) => product.active !== false) : products;
}

export function getCatalogCollections(root: string): CatalogCollection[] {
  return loadCatalog(root).collections;
}

export function getCatalogProduct(root: string, slug: string): CatalogProduct | undefined {
  return getCatalogProducts(root).find((product) => product.slug === slug);
}

export function defaultInventory(root: string): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const product of getCatalogProducts(root)) {
    for (const size of product.sizes) {
      stock[stockKey(product.slug, size)] = 20;
    }
  }
  return stock;
}
