import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type CartLineItem, cartLineKey } from "@/lib/cart";

const CART_STORAGE_KEY = "csh-merch-cart-v1";

interface CartContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartLineItem, "quantity">, quantity?: number, maxAvailable?: number | null) => void;
  updateQuantity: (key: string, quantity: number, maxAvailable?: number | null) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartLineItem[] {
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLineItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i) =>
          i &&
          typeof i.slug === "string" &&
          typeof i.size === "string" &&
          typeof i.quantity === "number" &&
          i.quantity > 0
      )
      .map((i) => ({ ...i, quantity: Math.min(10, Math.max(1, Math.floor(i.quantity))) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartLineItem[]>(() =>
    typeof sessionStorage !== "undefined" ? loadCart() : []
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota */
    }
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartLineItem, "quantity">, quantity = 1, maxAvailable: number | null = null) => {
      const key = cartLineKey(item.slug, item.size);
      const cap =
        maxAvailable === null || maxAvailable === undefined
          ? 10
          : Math.max(0, Math.min(10, Math.floor(maxAvailable)));
      setItems((prev) => {
        const existing = prev.find((i) => cartLineKey(i.slug, i.size) === key);
        if (existing) {
          return prev.map((i) =>
            cartLineKey(i.slug, i.size) === key
              ? { ...i, quantity: Math.min(cap, i.quantity + quantity) }
              : i
          );
        }
        const qty = Math.min(cap, Math.max(1, quantity));
        if (qty <= 0) return prev;
        return [...prev, { ...item, quantity: qty }];
      });
      setOpen(true);
    },
    []
  );

  const updateQuantity = useCallback((key: string, quantity: number, maxAvailable: number | null = null) => {
    const cap =
      maxAvailable === null || maxAvailable === undefined
        ? 10
        : Math.max(0, Math.min(10, Math.floor(maxAvailable)));
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => cartLineKey(i.slug, i.size) !== key);
      return prev.map((i) =>
        cartLineKey(i.slug, i.size) === key ? { ...i, quantity: Math.min(cap, quantity) } : i
      );
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => cartLineKey(i.slug, i.size) !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ open, setOpen, items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
