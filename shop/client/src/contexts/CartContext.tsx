import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { type CartLineItem, cartLineKey } from "@/lib/cart";

interface CartContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartLineItem, "quantity">, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartLineItem[]>([]);

  const addItem = useCallback((item: Omit<CartLineItem, "quantity">, quantity = 1) => {
    const key = cartLineKey(item.slug, item.size);
    setItems((prev) => {
      const existing = prev.find((i) => cartLineKey(i.slug, i.size) === key);
      if (existing) {
        return prev.map((i) =>
          cartLineKey(i.slug, i.size) === key
            ? { ...i, quantity: Math.min(10, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(10, quantity) }];
    });
    setOpen(true);
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => cartLineKey(i.slug, i.size) !== key);
      return prev.map((i) =>
        cartLineKey(i.slug, i.size) === key ? { ...i, quantity: Math.min(10, quantity) } : i
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
