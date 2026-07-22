import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { useCart } from "@/contexts/CartContext";
import { scrollToTop } from "@/lib/scroll";
import { cartLineKey } from "@/lib/cart";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email, grade: grade || undefined, notes: notes || undefined },
          items: items.map((i) => ({ slug: i.slug, size: i.size, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Bestellung fehlgeschlagen.");
        return;
      }
      setOrderId(data.orderId);
      clearCart();
      toast("Bestellung eingegangen — vielen Dank!");
    } catch {
      toast("Verbindungsfehler. Bitte später erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (orderId) {
    return (
      <div className="csh-page">
        <SiteHeader />
        <main className="csh-checkout">
          <div className="csh-checkout__card">
            <p className="csh-label">Bestellung eingegangen</p>
            <h1 className="csh-display csh-display--sm">Danke, {name}!</h1>
            <p className="csh-body">
              Deine Bestellung <strong>{orderId}</strong> wurde gespeichert. Du erhältst eine Bestätigung an{" "}
              {email}. Die Abgabe erfolgt an der Schule.
            </p>
            <Link href="/kollektion/gross" className="csh-btn" onClick={() => scrollToTop()}>
              Weiter stöbern
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="csh-page">
      <SiteHeader />
      <main className="csh-checkout">
        <div className="csh-checkout__grid">
          <section>
            <p className="csh-label">Kasse</p>
            <h1 className="csh-display csh-display--sm">Bestellung abschliessen</h1>
            {items.length === 0 ? (
              <p className="csh-body">Dein Warenkorb ist leer.</p>
            ) : (
              <form className="csh-checkout__form" onSubmit={handleSubmit}>
                <label className="csh-checkout__field">
                  Name
                  <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
                </label>
                <label className="csh-checkout__field">
                  E-Mail
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label className="csh-checkout__field">
                  Klasse / Stufe (optional)
                  <input value={grade} onChange={(e) => setGrade(e.target.value)} />
                </label>
                <label className="csh-checkout__field">
                  Anmerkung (optional)
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </label>
                <button type="submit" className="csh-btn" disabled={submitting}>
                  {submitting ? "Wird gesendet…" : `Bestellen — ${subtotal} €`}
                </button>
              </form>
            )}
          </section>

          <aside className="csh-checkout__summary">
            <h2 className="csh-serif">Zusammenfassung</h2>
            <ul className="csh-checkout__items">
              {items.map((item) => (
                <li key={cartLineKey(item.slug, item.size)}>
                  <span>
                    {item.quantity}× {item.name} ({item.size})
                  </span>
                  <span>{item.price * item.quantity} €</span>
                </li>
              ))}
            </ul>
            <p className="csh-checkout__total">
              <span>Gesamt</span>
              <strong>{subtotal} €</strong>
            </p>
            <p className="csh-body csh-checkout__note">
              Zahlung online per PayPal oder Stripe (Schulserver). Abholung an der CSH.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
