# CSH Merch — PayPal + Stripe (Cursor on school server)

**Audience:** Cursor / agent running on the **main school server** (same machine as Kaffeeliste).

Payments for the Merch Shop use **the same PayPal and Stripe accounts already configured for Kaffeeliste**. Do **not** create new API keys. Do **not** commit secrets to git.

---

## Where the keys already live

On the school server, open Kaffeeliste’s private env (never commit this file):

```text
Kaffeeliste/config/production.env
```

Copy these variables **as-is** into the Merch Shop server env (e.g. `CSH-Merch-Shop/shop/.env` or whatever process manager you use):

### PayPal

| Variable | Purpose |
|----------|---------|
| `PAYPAL_CLIENT_ID` | Public client id |
| `PAYPAL_CLIENT_SECRET` | Secret |
| `PAYPAL_ENV` | `live` (production) or `sandbox` (tests) |
| `PAYPAL_API_BASE` | Optional — Kaffeeliste derives this from `PAYPAL_ENV` |

### Stripe

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Server secret (`sk_live_…` / `sk_test_…`) |
| `STRIPE_PUBLISHABLE_KEY` | Browser / Checkout (`pk_live_…` / `pk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing (`whsec_…`) when webhooks are wired |

**Rule:** Same values as Kaffeeliste. One school Stripe account, one school PayPal app.

---

## How Kaffeeliste already uses them (reuse this pattern)

Reference implementation on the school server:

- PayPal: `Kaffeeliste/app/paypal_api.py` (+ background poller in `app/__init__.py`)
- Stripe: `Kaffeeliste/app/stripe_api.py` (+ background poller)

For Merch checkout you should:

1. Create an order on the Merch backend (line items, customer, total).
2. Offer **two payment methods**: PayPal **and** Stripe Checkout / Payment Intent.
3. On success webhook/return URL → mark order `paid`.
4. On cancel/fail → leave order `pending` or cancel after timeout (mirror Kaffeeliste pending expiry).

Return / cancel URLs must point at the **Merch** public (or LAN) host, e.g.:

```text
STRIPE_SUCCESS_BASE_URL=https://<merch-host>/kasse/success
STRIPE_CANCEL_BASE_URL=https://<merch-host>/kasse/cancel
```

(Do not reuse Kaffeeliste’s `:5004` success URLs for Merch.)

---

## Env template for Merch (fill from school `production.env`)

```env
# --- Payments: SAME keys as Kaffeeliste/config/production.env ---
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=live

STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Merch-specific return URLs (adjust host / tunnel)
STRIPE_SUCCESS_BASE_URL=
STRIPE_CANCEL_BASE_URL=
```

Copy values from Kaffeeliste’s `production.env`. Leave blanks in any **committed** example file.

---

## Security checklist

- [ ] Never paste live keys into git, chat logs, or public docs
- [ ] Merch `.env` stays gitignored
- [ ] Webhooks verify Stripe signature with `STRIPE_WEBHOOK_SECRET`
- [ ] Prefer server-side Checkout Session / Orders API — never put `STRIPE_SECRET_KEY` or PayPal secret in the browser
- [ ] `STRIPE_PUBLISHABLE_KEY` is the only key safe for client-side Stripe.js if needed

---

## Current shop status

- Cart + `/api/orders` already create orders without charging.
- Checkout UI should offer PayPal **and** Stripe once this wiring is done.
- Hub push (optional): same `HUB_API_KEY` as other school apps → `https://hub.icicles.online/api/ingest/csh-merch`.

When implementing, prefer adapting Kaffeeliste’s PayPal/Stripe helpers over inventing a new payment stack.
