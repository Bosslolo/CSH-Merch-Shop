import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { scrollToTop } from "@/lib/scroll";

export default function PaymentReturnPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("order") || "";
  const cancelled = params.get("cancelled") === "1";
  const urlToken = params.get("token") || params.get("accessToken") || "";
  const storageKey = orderId ? `csh-order-token:${orderId}` : "";
  let accessToken = urlToken;
  if (!accessToken && storageKey) {
    try {
      accessToken = sessionStorage.getItem(storageKey) || "";
    } catch {
      accessToken = "";
    }
  }
  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "cancelled" | "error">(
    cancelled ? "cancelled" : !orderId ? "error" : "checking"
  );
  const [message, setMessage] = useState(
    !orderId && !cancelled ? "Bestellnummer fehlt in der Rückkehr-URL." : ""
  );

  useEffect(() => {
    if (cancelled || !orderId) return;
    if (!accessToken) {
      setStatus("error");
      setMessage("Zugangstoken fehlt — öffne den Link aus Stripe erneut oder frage den Admin.");
      return;
    }

    try {
      sessionStorage.setItem(storageKey, accessToken);
      const clean = new URL(window.location.href);
      clean.searchParams.delete("token");
      clean.searchParams.delete("accessToken");
      window.history.replaceState({}, "", `${clean.pathname}${clean.search}${clean.hash}`);
    } catch {
      /* ignore */
    }

    let cancelledFetch = false;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/stripe-confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Order-Access-Token": accessToken,
          },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (cancelledFetch) return;
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Bestätigung fehlgeschlagen.");
          return;
        }
        if (data.paid) {
          setStatus("paid");
          try {
            sessionStorage.removeItem(storageKey);
          } catch {
            /* ignore */
          }
        } else {
          setStatus("pending");
          setMessage(
            "Zahlung noch nicht bestätigt — bitte einen Moment warten oder Admin fragen."
          );
        }
      } catch {
        if (!cancelledFetch) {
          setStatus("error");
          setMessage("Verbindungsfehler.");
        }
      }
    })();
    return () => {
      cancelledFetch = true;
    };
  }, [orderId, cancelled, accessToken, storageKey]);

  return (
    <div className="csh-page">
      <SiteHeader />
      <main className="csh-checkout">
        <div className="csh-checkout__card">
          <p className="csh-label">Zahlung</p>
          {status === "paid" && (
            <>
              <h1 className="csh-display csh-display--sm">Zahlung erhalten</h1>
              <p className="csh-body">
                Danke! Bestellung <strong>{orderId}</strong> ist bezahlt.
                {typeof window !== "undefined" && window.opener
                  ? " Du kannst dieses Fenster schließen."
                  : ""}
              </p>
            </>
          )}
          {status === "cancelled" && (
            <>
              <h1 className="csh-display csh-display--sm">Zahlung abgebrochen</h1>
              <p className="csh-body">
                Du kannst die Bestellung <strong>{orderId || "—"}</strong> später erneut bezahlen.
              </p>
            </>
          )}
          {status === "checking" && (
            <>
              <h1 className="csh-display csh-display--sm">Zahlung wird geprüft…</h1>
              <p className="csh-body">Einen Moment bitte.</p>
            </>
          )}
          {status === "pending" && (
            <>
              <h1 className="csh-display csh-display--sm">Noch nicht bestätigt</h1>
              <p className="csh-body">{message}</p>
            </>
          )}
          {status === "error" && (
            <>
              <h1 className="csh-display csh-display--sm">Fehler</h1>
              <p className="csh-body">{message}</p>
            </>
          )}
          <Link href="/" className="csh-btn" onClick={() => scrollToTop()}>
            Zur Startseite
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
