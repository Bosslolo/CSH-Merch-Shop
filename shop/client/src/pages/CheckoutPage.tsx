import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { useCart } from "@/contexts/CartContext";
import { scrollToTop } from "@/lib/scroll";
import { cartLineKey } from "@/lib/cart";

type PaymentsStatus = {
  paypal: boolean;
  stripe: boolean;
  businessName?: string;
  businessEmail?: string;
};

type PayMethod = "paypal" | "stripe" | null;

function orderHeaders(accessToken: string): HeadersInit {
  return { "X-Order-Access-Token": accessToken };
}

/** Phone/tablet → same-tab redirect; desktop → payment popup. */
function openPayment(url: string, name = "csh_pay"): Window | null {
  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobile) {
    window.location.href = url;
    return null;
  }
  const w = Math.min(520, screen.availWidth - 40);
  const h = Math.min(720, screen.availHeight - 80);
  const left = Math.max(0, Math.round((screen.availWidth - w) / 2));
  const top = Math.max(0, Math.round((screen.availHeight - h) / 2));
  const popup = window.open(
    url,
    name,
    `popup=yes,width=${w},height=${h},left=${left},top=${top},noopener,noreferrer`
  );
  if (!popup) {
    // Popup blocked → fall back to same-tab redirect
    window.location.href = url;
    return null;
  }
  try {
    popup.focus();
  } catch {
    /* ignore */
  }
  return popup;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [payments, setPayments] = useState<PaymentsStatus | null>(null);
  const [paypalUrl, setPaypalUrl] = useState<string | null>(null);
  const [payingPaypal, setPayingPaypal] = useState(false);
  const [payingStripe, setPayingStripe] = useState(false);
  const [lockedMethod, setLockedMethod] = useState<PayMethod>(null);

  useEffect(() => {
    void fetch("/api/payments/status")
      .then((r) => r.json())
      .then((data: PaymentsStatus) => setPayments(data))
      .catch(() => setPayments({ paypal: false, stripe: false }));
  }, []);

  async function fetchPaypalUrl(id: string, token: string): Promise<string | null> {
    const qrRes = await fetch(`/api/orders/${encodeURIComponent(id)}/paypal-qr`, {
      headers: orderHeaders(token),
    });
    const qrData = await qrRes.json();
    const url = (qrData.paypalUrl || qrData.paypalQrUrl) as string | undefined;
    if (qrRes.ok && url) {
      setPaypalUrl(url);
      setLockedMethod("paypal");
      return url;
    }
    toast(qrData.error ?? "PayPal-Zahlung fehlgeschlagen.");
    return null;
  }

  async function startPaypal(id: string, token: string) {
    if (lockedMethod === "stripe") {
      toast("Karten-Zahlung bereits gestartet. Bitte Admin fragen, falls du wechseln musst.");
      return;
    }
    setPayingPaypal(true);
    try {
      const url = paypalUrl || (await fetchPaypalUrl(id, token));
      if (!url) return;
      openPayment(url, "csh_paypal");
    } catch {
      toast("Verbindungsfehler bei PayPal.");
    } finally {
      setPayingPaypal(false);
    }
  }

  async function startStripe(id: string, token: string) {
    if (lockedMethod === "paypal") {
      toast("PayPal-Zahlung bereits gestartet. Bitte Admin fragen, falls du wechseln musst.");
      return;
    }
    setPayingStripe(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}/stripe-checkout`, {
        method: "POST",
        headers: orderHeaders(token),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        toast(data.error ?? "Stripe-Checkout fehlgeschlagen.");
        return;
      }
      setLockedMethod("stripe");
      openPayment(data.checkoutUrl as string, "csh_stripe");
    } catch {
      toast("Verbindungsfehler bei Stripe.");
    } finally {
      setPayingStripe(false);
    }
  }

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
      setAccessToken(data.accessToken || null);
      setOrderTotal(typeof data.total === "number" ? data.total : subtotal);
      clearCart();
      toast("Bestellung eingegangen — Weiterleitung zur Zahlung…");

      const token = data.accessToken as string | undefined;
      if (!token) return;

      const hasPaypal = Boolean(payments?.paypal);
      const hasStripe = Boolean(payments?.stripe);
      // One method only → open payment immediately (redirect / popup).
      if (hasPaypal && !hasStripe) {
        await startPaypal(data.orderId, token);
      } else if (hasStripe && !hasPaypal) {
        await startStripe(data.orderId, token);
      }
    } catch {
      toast("Verbindungsfehler. Bitte später erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (orderId) {
    const showPaypal = Boolean(payments?.paypal) && lockedMethod !== "stripe";
    const showStripe = Boolean(payments?.stripe) && lockedMethod !== "paypal";

    return (
      <div className="csh-page">
        <SiteHeader />
        <main className="csh-checkout">
          <div className="csh-checkout__card">
            <p className="csh-label">Bestellung eingegangen</p>
            <h1 className="csh-display csh-display--sm">Danke, {name}!</h1>
            <p className="csh-body">
              Deine Bestellung <strong>{orderId}</strong>
              {orderTotal != null ? (
                <>
                  {" "}
                  über <strong>{orderTotal} €</strong>
                </>
              ) : null}{" "}
              wurde gespeichert. Bitte jetzt bezahlen — die Zahlung öffnet sich direkt
              (Handy: Weiterleitung, PC: Popup-Fenster).
            </p>

            <div className="csh-checkout__pay">
              {showPaypal && (
                <section className="csh-checkout__pay-block">
                  <h2 className="csh-serif">PayPal</h2>
                  <p className="csh-body">
                    Direkt in PayPal bezahlen. Betrag ist vorausgefüllt.
                    {payments?.businessName
                      ? ` Empfänger: ${payments.businessName}.`
                      : ""}{" "}
                    Nach der Zahlung bestätigt die Schülerfirma den Eingang.
                  </p>
                  {accessToken ? (
                    <button
                      type="button"
                      className="csh-btn"
                      disabled={payingPaypal}
                      onClick={() => void startPaypal(orderId, accessToken)}
                    >
                      {payingPaypal ? "PayPal wird geöffnet…" : "Mit PayPal bezahlen"}
                    </button>
                  ) : null}
                </section>
              )}

              {showStripe && (
                <section className="csh-checkout__pay-block">
                  <h2 className="csh-serif">Karte / Apple Pay</h2>
                  <p className="csh-body">Sicher über Stripe bezahlen.</p>
                  <button
                    type="button"
                    className="csh-btn"
                    disabled={payingStripe || !accessToken}
                    onClick={() => accessToken && void startStripe(orderId, accessToken)}
                  >
                    {payingStripe ? "Weiterleitung…" : "Mit Karte bezahlen"}
                  </button>
                </section>
              )}

              {!payments?.paypal && !payments?.stripe && (
                <p className="csh-body">
                  Online-Zahlung ist noch nicht konfiguriert. Zahlung und Abholung erfolgen vor Ort.
                </p>
              )}
            </div>

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
              Nach der Bestellung öffnet sich die Zahlung direkt (PayPal oder Karte). Abholung an der
              CSH.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
