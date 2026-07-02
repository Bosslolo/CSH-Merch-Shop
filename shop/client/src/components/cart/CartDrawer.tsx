import { Link } from "wouter";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { cartLineKey } from "@/lib/cart";
import { scrollToTop } from "@/lib/scroll";

export default function CartDrawer() {
  const { open, setOpen, items, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="csh-cart">
        <SheetHeader className="csh-cart__header">
          <p className="csh-cart__promo">Letzte Auflage — limitierter Bestand</p>
          <SheetTitle className="csh-cart__title">Warenkorb</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="csh-cart__empty">
            <ShoppingBag size={32} strokeWidth={1.25} className="csh-cart__empty-icon" />
            <p className="csh-cart__empty-text">Dein Warenkorb ist leer</p>
            <Link
              href="/kollektion/gross"
              className="csh-link"
              onClick={() => {
                setOpen(false);
                scrollToTop();
              }}
            >
              Zur Kollektion
            </Link>
          </div>
        ) : (
          <div className="csh-cart__body">
            <ul className="csh-cart__lines">
              {items.map((item) => {
                const key = cartLineKey(item.slug, item.size);
                return (
                  <li key={key} className="csh-cart__line">
                    <img src={item.image} alt="" className="csh-cart__thumb" />
                    <div className="csh-cart__line-info">
                      <p className="csh-cart__line-name">{item.name}</p>
                      <p className="csh-cart__line-meta">
                        {item.size} · {item.price} €
                      </p>
                      <div className="csh-cart__qty">
                        <button
                          type="button"
                          aria-label="Menge verringern"
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Menge erhöhen"
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="csh-cart__remove"
                      aria-label="Entfernen"
                      onClick={() => removeItem(key)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="csh-cart__footer">
              <p className="csh-cart__subtotal">
                Zwischensumme <strong>{subtotal} €</strong>
              </p>
              <Link
                href="/kasse"
                className="csh-btn csh-cart__checkout"
                onClick={() => setOpen(false)}
              >
                Zur Kasse
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
