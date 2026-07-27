export type OrderStatus = "pending" | "confirmed" | "fulfilled" | "cancelled";
export type PaymentStatus = "unpaid" | "pending" | "paid";
export type PaymentMethod = "paypal" | "stripe" | "cash";

export interface OrderLineItem {
  slug: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  grade?: string;
  notes?: string;
}

export interface Order {
  id: string;
  /** Capability secret required for public payment endpoints (never list in admin UI as linkable). */
  accessToken: string;
  status: OrderStatus;
  customer: CustomerInfo;
  items: OrderLineItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  stripeSessionId?: string;
}

export interface OrdersFile {
  orders: Order[];
}

/** Stock key format: `{slug}|{size}` e.g. `csh-hoodie-blau|M` */
export type StockKey = string;

export interface InventoryFile {
  stock: Record<StockKey, number>;
  updatedAt: string;
}

export interface PublicStockEntry {
  slug: string;
  size: string;
  quantity: number;
}

export interface CreateOrderPayload {
  customer: CustomerInfo;
  items: { slug: string; size: string; quantity: number }[];
}

/** Collection id — built-ins `large` / `small`, plus custom categories. */
export type CollectionId = string;

/** @deprecated Prefer CollectionId */
export type CollectionKind = CollectionId;

export interface CatalogColor {
  name: string;
  hex: string;
}

export interface CatalogCollection {
  id: CollectionId;
  name: string;
  lead: string;
  cardNote: string;
  badge?: string;
}

export interface CatalogProduct {
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  compareAt?: number;
  material: string;
  sizingNote: string;
  unityLine: string;
  colors: CatalogColor[];
  sizes: string[];
  image: string;
  flatLay: string;
  gallery: string[];
  tag?: string;
  collection: CollectionId;
  groupKey: string;
  groupLabel: string;
  active?: boolean;
  /** Shop shows product but purchase is blocked (manager override). */
  soldOut?: boolean;
  /** Filled by public catalog when a sale applies */
  onSale?: boolean;
  salePercent?: number;
  saleEndsAt?: string | null;
}

export interface CatalogFile {
  collections: CatalogCollection[];
  products: CatalogProduct[];
  updatedAt: string;
}

export type SaleScope = "all" | "collection" | "group" | "product";

export interface SaleRule {
  id: string;
  enabled: boolean;
  label: string;
  scope: SaleScope;
  /** Product slug, groupKey, or collection id — empty when scope is `all` */
  targetId: string;
  percentOff: number;
  startsAt: string | null;
  endsAt: string | null;
}

export type SpotlightMode = "countdown" | "votes" | "drop";

export interface SpotlightConfig {
  mode: SpotlightMode;
  countdownUntil: string | null;
  countdownTitle: string;
  countdownLead: string;
  dropKind: "collection" | "product";
  dropTarget: string;
  dropTitle: string;
  dropLead: string;
  dropCta: string;
}

export interface CategoryDef {
  key: string;
  label: string;
}

export interface SiteSettings {
  sales: SaleRule[];
  spotlight: SpotlightConfig;
  categories: CategoryDef[];
  updatedAt: string;
}
