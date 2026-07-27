import type { CatalogProduct, SaleRule, SiteSettings, SpotlightConfig } from "../shared/shop-types.js";
import { ensureShopDb, getDb } from "./db.js";

const META_KEY = "site_settings";

export function defaultSpotlight(): SpotlightConfig {
  return {
    mode: "votes",
    countdownUntil: null,
    countdownTitle: "Nächster Drop",
    countdownLead: "Bald geht es los — bleib dran.",
    dropKind: "collection",
    dropTarget: "large",
    dropTitle: "Neuer Drop",
    dropLead: "Frisch im Shop — jetzt entdecken.",
    dropCta: "Zum Drop",
  };
}

export function defaultSiteSettings(): SiteSettings {
  return {
    sales: [],
    spotlight: defaultSpotlight(),
    categories: [
      { key: "hoodies", label: "Hoodies" },
      { key: "shirts", label: "Shirts" },
    ],
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeSettings(raw: Partial<SiteSettings> | null | undefined): SiteSettings {
  const base = defaultSiteSettings();
  const spotlightIn = raw?.spotlight ?? base.spotlight;
  const sales = Array.isArray(raw?.sales) ? raw.sales : [];
  const categories = Array.isArray(raw?.categories) && raw.categories.length
    ? raw.categories
    : base.categories;

  return {
    updatedAt: raw?.updatedAt || new Date().toISOString(),
    categories: categories
      .map((c) => ({
        key: String(c.key || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        label: String(c.label || "").trim(),
      }))
      .filter((c) => c.key && c.label),
    spotlight: {
      mode:
        spotlightIn.mode === "countdown" || spotlightIn.mode === "drop" || spotlightIn.mode === "votes"
          ? spotlightIn.mode
          : "votes",
      countdownUntil: spotlightIn.countdownUntil ? String(spotlightIn.countdownUntil) : null,
      countdownTitle: String(spotlightIn.countdownTitle || base.spotlight.countdownTitle).trim(),
      countdownLead: String(spotlightIn.countdownLead || base.spotlight.countdownLead).trim(),
      dropKind: spotlightIn.dropKind === "product" ? "product" : "collection",
      dropTarget: String(spotlightIn.dropTarget || "large").trim(),
      dropTitle: String(spotlightIn.dropTitle || base.spotlight.dropTitle).trim(),
      dropLead: String(spotlightIn.dropLead || base.spotlight.dropLead).trim(),
      dropCta: String(spotlightIn.dropCta || base.spotlight.dropCta).trim(),
    },
    sales: sales
      .map((sale) => ({
        id: String(sale.id || cryptoRandomId()),
        enabled: Boolean(sale.enabled),
        label: String(sale.label || "Sale").trim().slice(0, 80),
        scope:
          sale.scope === "collection" || sale.scope === "group" || sale.scope === "product" || sale.scope === "all"
            ? sale.scope
            : "all",
        targetId: String(sale.targetId || "").trim(),
        percentOff: Math.max(0, Math.min(90, Number(sale.percentOff) || 0)),
        startsAt: sale.startsAt ? String(sale.startsAt) : null,
        endsAt: sale.endsAt ? String(sale.endsAt) : null,
      }))
      .filter((sale) => sale.percentOff > 0),
  };
}

function cryptoRandomId() {
  return `sale-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadSiteSettings(root: string): SiteSettings {
  ensureShopDb(root);
  const db = getDb(root);
  const row = db.prepare("SELECT value FROM meta WHERE key = ?").get(META_KEY) as
    | { value: string }
    | undefined;
  if (!row?.value) return defaultSiteSettings();
  try {
    return sanitizeSettings(JSON.parse(row.value) as SiteSettings);
  } catch {
    return defaultSiteSettings();
  }
}

export function saveSiteSettings(root: string, next: SiteSettings): SiteSettings {
  ensureShopDb(root);
  const sanitized = sanitizeSettings({ ...next, updatedAt: new Date().toISOString() });
  const db = getDb(root);
  db.prepare(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(META_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export function isSaleActive(rule: SaleRule, now = Date.now()): boolean {
  if (!rule.enabled || rule.percentOff <= 0) return false;
  if (rule.startsAt) {
    const start = Date.parse(rule.startsAt);
    if (Number.isFinite(start) && now < start) return false;
  }
  if (rule.endsAt) {
    const end = Date.parse(rule.endsAt);
    if (Number.isFinite(end) && now > end) return false;
  }
  return true;
}

export function saleMatchesProduct(rule: SaleRule, product: CatalogProduct): boolean {
  if (rule.scope === "all") return true;
  if (rule.scope === "collection") return product.collection === rule.targetId;
  if (rule.scope === "group") return product.groupKey === rule.targetId;
  if (rule.scope === "product") return product.slug === rule.targetId;
  return false;
}

export function findActiveSale(
  product: CatalogProduct,
  sales: SaleRule[],
  now = Date.now()
): SaleRule | null {
  let best: SaleRule | null = null;
  for (const rule of sales) {
    if (!isSaleActive(rule, now)) continue;
    if (!saleMatchesProduct(rule, product)) continue;
    if (!best || rule.percentOff > best.percentOff) best = rule;
  }
  return best;
}

export function applySaleToProduct(
  product: CatalogProduct,
  sales: SaleRule[],
  now = Date.now()
): CatalogProduct {
  const rule = findActiveSale(product, sales, now);
  if (!rule) {
    return { ...product, onSale: false, salePercent: undefined, saleEndsAt: undefined };
  }
  const base = product.compareAt && product.compareAt > product.price ? product.compareAt : product.price;
  const discounted = Math.round(base * (1 - rule.percentOff / 100) * 100) / 100;
  return {
    ...product,
    compareAt: base,
    price: discounted,
    onSale: true,
    salePercent: rule.percentOff,
    saleEndsAt: rule.endsAt,
    tag: product.tag || `−${rule.percentOff}%`,
  };
}

export function applySalesToCatalogProducts(
  products: CatalogProduct[],
  sales: SaleRule[],
  now = Date.now()
): CatalogProduct[] {
  return products.map((product) => applySaleToProduct(product, sales, now));
}
