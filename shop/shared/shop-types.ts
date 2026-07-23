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
