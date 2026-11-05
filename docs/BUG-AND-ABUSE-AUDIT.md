# CSH Merch Shop — Bug & Abuse Audit

**Date:** 2026-07-23  
**Status:** Mitigations implemented in code (see “Remediation log” at bottom). Re-test before public launch.  
**Scope:** `shop/server/*`, `shop/client/src` (checkout, cart, admin, vote), `shop/shared`, env/config, Vite API plugins  
**Goal:** List what a normal user, clumsy admin, or attacker can do to break money, stock, data, or trust — with evidence in code.

**Admin password:** store only in local `shop/.env` (gitignored). Never paste real passwords into docs or commits.

---

## How to read this

| Severity | Meaning |
|----------|---------|
| **Critical** | Direct money loss, free merch, or full admin takeover with realistic steps |
| **High** | Overselling, mass spam, easy vote fraud, or serious data loss under load |
| **Medium** | Broken UX / inconsistent state / leaks that help an attacker |
| **Low** | Edge cases, polish, or needs unusual conditions |
| **Info** | Misconfig / ops risk, not a code exploit by itself |

---

## Critical

### C1 — PayPal payment is “trust the customer / admin”, not verified by the shop

**Status:** Mitigated — order id in PayPal note/item; admin mark-paid requires confirm + PayPal reference. Full PayPal API still out of scope.

- **Where:** `shop/server/payments.ts` → `handleOrderPayPalQr`; `shop/client/src/pages/CheckoutPage.tsx`; admin `markOrderPaidByAdmin` / `AdminOrdersPage.tsx`
- **Trigger:**
  1. Place any order and open PayPal (PayPal.me / business email / managed QR).
  2. Pay **nothing**, or pay a **wrong amount**, or pay from another person’s order.
  3. Tell admin “I paid”. Admin clicks **PayPal bezahlt**.
- **Impact:** Order marked `paymentStatus: paid` with **no server check** that money arrived or matched `order.total`. Revenue and fulfillment become wrong.
- **Why:** PayPal link only carries an amount (`paypalCheckoutUrl`). There is **no order id**, webhook, or capture API. Confirmation is 100% manual.
- **Fix:** Prefer Stripe for auto-confirm; or PayPal Orders API + webhook; or require screenshot + reference and never one-click mark-paid without checks. At minimum show order id in PayPal `item_name` / note and train admins.

### C2 — Concurrent checkouts can oversell stock (race)

**Status:** Fixed — shared `shopDataLockKey` around stock + order create.

- **Where:** `shop/server/orders.ts` → `handleCreateOrder` calls `adjustStock` **outside** `withFileLock`; `inventory.ts` → `adjustStock` / `loadInventory` / `saveInventory` have **no** lock; `file-lock.ts` only used for `orders.json` (and payment patches).
- **Trigger:**
  1. Stock for `csh-hoodie-blau|M` = 1.
  2. Two browsers submit checkout for that size at the same time.
  3. Both read stock=1, both write stock=0, both get `201` with an order.
- **Impact:** Two confirmed reservations for one physical item. JSON inventory lies.
- **Fix:** Put stock read-modify-write inside the same lock as order insert (one lock key for both files, or single transactional store). Prefer a DB with row locks later.

---

## High

### H1 — Unlimited fake orders drain stock (no create-order rate limit)

**Status:** Fixed — IP/email rate limits + max open unpaid per email.

- **Where:** `POST /api/orders` in `orders.ts` / `index.ts` / Vite plugin. Rate limiting exists **only** for admin login (`auth.ts`).
- **Trigger:** Script loops `POST /api/orders` with valid catalog slugs/sizes and disposable emails. Each success decrements stock.
- **Impact:** Shop sold out without real buyers; recovery needs admin stock edits. Disk fills with `orders.json`.
- **Fix:** IP (+ optional email) rate limit; CAPTCHA on checkout; max open unpaid orders per email; auto-expire unpaid orders and restore stock.

### H2 — Unpaid orders permanently reserve stock

**Status:** Fixed — unpaid TTL cleanup restores stock (default 120 min).

- **Where:** `orders.ts` deducts stock on create; there is **no** TTL / cleanup job for `pending` + `unpaid`.
- **Trigger:** Student clicks Bestellen, never pays, closes tab. Or attacker from H1.
- **Impact:** Stock locked forever until admin **cancels** (which restores) or edits inventory.
- **Fix:** Cron: after N hours cancel unpaid → restore stock; or don’t deduct until paid (harder with dual payment methods).

### H3 — Vote API still accepts votes while UI says “Coming soon”

**Status:** Fixed — `VOTING_ENABLED` default false; POST returns 403.

- **Where:** UI: `DropVoteSection.tsx` + `vote-designs.ts` (`comingSoon: true`). API: `votes.ts` `handlePost` still live at `POST /api/votes`.
- **Trigger:** `curl -X POST /api/votes -H 'Content-Type: application/json' -d '{"designId":"crest-logo","fingerprint":"aaaaaaaa"}'`
- **Impact:** Tallies / admin vote page / hub snapshot polluted before the real campaign; students think voting is closed.
- **Fix:** Server-side `VOTING_ENABLED=false` (or drop closed flag) that returns 403; don’t rely on UI alone.

### H4 — Vote anti-cheat is trivial to bypass

**Status:** Mitigated — `TRUST_PROXY` gate + vote rate limit; fingerprint still weak without school login.

- **Where:** `votes.ts` — fingerprint client-supplied; cookie `csh_vote`; hash = `sha256(fingerprint|ip)`; IP from `X-Forwarded-For` first hop.
- **Trigger:**
  1. Change `fingerprint` string each request → new hash.
  2. Clear cookie.
  3. Spoof `X-Forwarded-For: 1.2.3.N` (trusted blindly even if not behind a real proxy) → different IP in hash + different login rate-limit bucket.
- **Impact:** Unlimited votes; admin dashboard / hub metrics useless.
- **Fix:** Only trust `X-Forwarded-For` behind a known reverse proxy; require school login / one-time code; rate-limit by real socket IP; optional signed device cookie set by server.

### H5 — Same SKU can be ordered far above the UI “max 10” via API

**Status:** Fixed — merge duplicate lines; max 10 per variant.

- **Where:** `orders.ts` allows up to **20 line items**, each qty 1–10. It does **not** merge duplicate `slug+size`. Cart UI merges lines (`CartContext`).
- **Trigger:** One POST with twenty lines of `{slug:"csh-hoodie-blau", size:"M", quantity:10}` → up to **200** of one size if stock allows.
- **Impact:** Bulk wipe of inventory in one request (combined with H1).
- **Fix:** Aggregate by `slug|size` before stock check; enforce max qty **per variant** (e.g. 10) and max total units.

### H6 — Admin can cancel a **paid** order and stock returns while payment stays “paid”

**Status:** Fixed — cannot cancel paid orders; admin confirms status changes.

- **Where:** `orders.ts` → `updateOrderStatus`: any transition **to** `cancelled` restores stock; does **not** clear `paymentStatus`. Admin UI status `<select>` has no confirm dialog (`AdminOrdersPage.tsx`).
- **Trigger:** Accidental dropdown to “Storniert” on a paid order; or intentional cancel after PayPal mark-paid.
- **Impact:** Inconsistent state: `cancelled` + `paid`. Stock available again → can sell the same physical item twice; money already taken.
- **Fix:** Block cancel if `paymentStatus === "paid"` (or require refund step); confirm dialog; on cancel clear/flag payment.

### H7 — Access token in URL (Stripe return / query) leaks capability

**Status:** Mitigated — return page strips token from URL; confirm ignores client sessionId.

- **Where:** `payments.ts` Stripe `success_url` / `cancel_url` embed `token=...`; `extractAccessToken` also accepts `?accessToken=` / `?token=`; `PaymentReturnPage.tsx` reads query.
- **Trigger:** Browser history, shared screenshot, proxy logs, or `Referer` if any third-party asset loads on the return page.
- **Impact:** Anyone with the link can start PayPal/Stripe flows for that order (and confirm Stripe). Not full admin, but order takeover.
- **Fix:** Prefer header-only token after first land; short-lived one-time confirm codes; strip token from URL via `history.replaceState` immediately (partial mitigation).

---

## Medium

### M1 — Double-click / parallel “Bestellen” creates two orders

- **Where:** `CheckoutPage.tsx` sets `submitting` but a fast double submit before React re-render can fire two POSTs. No idempotency key.
- **Trigger:** Double-click submit on slow network.
- **Impact:** Two stock deductions, two order ids; student confused which to pay; PayPal may be paid once for wrong order.
- **Fix:** Disable button synchronously; server idempotency key (header + short TTL).

### M2 — Cart can exceed remaining stock (UI)

- **Where:** `ProductDetail.tsx` only blocks add when `available <= 0`; does not compare `cart qty + 1` vs stock. `CartContext` allows up to 10 regardless of stock.
- **Trigger:** Stock=2; add until cart shows 10; checkout → `409 Nicht genug Bestand`.
- **Impact:** Frustrating checkout failure; looks like a bug.
- **Fix:** Cap add/update by live stock; re-validate cart on drawer open.

### M3 — Stock fetch failure → treat as unlimited on client

- **Where:** `useStock` / `ProductDetail`: if `/api/stock` fails, `available === null` → sizes not sold-out, add allowed.
- **Trigger:** Kill API briefly; shop still accepts add-to-cart.
- **Impact:** Checkout fails later; or succeeds if stock actually OK — inconsistent UX.
- **Fix:** Fail closed (disable buy) when stock unknown.

### M4 — Payment method lock is sticky and admin-only to fix

- **Where:** `rejectDualMethod` in `payments.ts`; client `lockedMethod` in `CheckoutPage.tsx`.
- **Trigger:** User opens PayPal (sets `paymentMethod: paypal`, `pending`), then wants Stripe → `409`. Refresh still blocked server-side.
- **Impact:** Stuck checkout; needs admin help (no admin “reset payment method” endpoint).
- **Fix:** Allow switch if still unpaid; or admin reset; expire pending method after timeout.

### M5 — Stripe confirm accepts client-supplied `sessionId`

- **Where:** `handleStripeConfirm` uses body `sessionId` **or** order’s stored session.
- **Trigger:** Caller with valid `accessToken` POSTs another Checkout Session id from **this** Stripe account.
- **Impact:** Mitigated if session metadata `order_id` mismatches or amount mismatches (`markStripePaid`). Residual risk if another session exists with **same amount** and **empty** metadata (`if (metaOrder && metaOrder !== order.id)` skips empty).
- **Fix:** Only accept `order.stripeSessionId`; require metadata `order_id === order.id` always (fail if missing).

### M6 — `X-Forwarded-For` spoofs admin login rate limit

- **Where:** `auth.ts` `getClientIp` + `loginAttempts` map.
- **Trigger:** Brute-force password with rotating `X-Forwarded-For`.
- **Impact:** 8 attempts / 15 min per spoofed IP ≈ unlimited guesses from one machine (unless edge proxy overwrites the header).
- **Fix:** Trust proxy config; rate-limit by socket address; optional global backoff / account lockout alert.

### M7 — Session secret tied to admin password

- **Where:** `auth.ts` `ADMIN_SESSION_SECRET ?? ADMIN_PASSWORD`.
- **Trigger:** Weak/reused password; password change forges old math if secret not rotated separately; password leak = forge sessions.
- **Impact:** Long-lived (8h) forged admin cookies if secret known.
- **Fix:** Dedicated random `ADMIN_SESSION_SECRET`; rotate independently; optional server-side session revoke list.

### M8 — Vote POST has no body size limit

- **Where:** `votes.ts` `handlePost`: `for await (const chunk of req) body += chunk` unbounded. Other handlers use `readBody(req, N)`.
- **Trigger:** Huge POST body to `/api/votes`.
- **Impact:** Memory DoS on Node process.
- **Fix:** Use `readBody(req, 4_096)`; reject oversize.

### M9 — Votes file has no lock (lost updates)

- **Where:** `votes.ts` read → push → write without `withFileLock`.
- **Trigger:** Two simultaneous votes.
- **Impact:** One vote silently dropped.
- **Fix:** `withFileLock` around read-modify-write (same as orders).

### M10 — Corrupt / BOM-broken JSON crashes endpoints

- **Where:** `json-store.ts` `JSON.parse` without try/catch; votes/`admin` also `JSON.parse` directly.
- **Trigger:** Manual edit of `inventory.json` / `orders.json` / `votes.json` with trailing comma; half-written file if process killed mid-write (rename helps but not for votes which use direct `writeFileSync`).
- **Impact:** `/api/stock`, checkout, admin dashboard 500 until file fixed.
- **Fix:** try/catch + backup; use atomic write for votes too; health check.

### M11 — Public payments status leaks business identity

- **Where:** `handlePaymentsStatus` returns `businessName`, `businessEmail`.
- **Trigger:** `GET /api/payments/status` (no auth).
- **Impact:** Info disclosure (usually acceptable for PayPal, but aids phishing clones).
- **Fix:** Only return booleans to public; show name after order created.

### M12 — Admin inventory PUT can set absurd stock / wipe

- **Where:** `setStockLevels` allows any integer ≥ 0; UI may allow typos.
- **Trigger:** Admin sets quantity `0` on all sizes or `999999`.
- **Impact:** Shop empty or meaningless stock; no audit log / undo.
- **Fix:** Confirm dialog; max cap; change log.

### M13 — Hub snapshot / push exposes ops metrics if key weak

- **Where:** `hub.ts` Bearer `HUB_API_KEY`; local `.env` still has placeholder `generate-a-long-random-string` if not overridden.
- **Trigger:** Guess/reuse weak key → `GET /api/hub/snapshot` (orders counts, revenue, low stock, vote tallies, config problems).
- **Impact:** Recon for attackers; not full PII of customers in snapshot (good), but revenue/pending useful.
- **Fix:** Strong shared key with Kaffeeliste/hub; disable pull endpoint if only push is used.

### M14 — Manus debug script shipped in `public/`

- **Where:** `shop/client/public/__manus__/debug-collector.js`; Vite injects it only when `NODE_ENV !== "production"`, but file remains statically served in prod.
- **Trigger:** Attacker opens `/__manus__/debug-collector.js`. Dev log endpoint is Vite-only, but leftover tooling increases attack surface / confusion.
- **Fix:** Don’t copy `__manus__` into production `dist`; deny in static hosting.

### M15 — Client vs server catalog can drift

- **Where:** Prices/sizes in `client/.../products.ts` vs `server/catalog.ts` (duplicated).
- **Trigger:** Someone updates only the client price to 1 €; checkout still charges server price (good for money) but UI lies; or client adds a size server rejects.
- **Impact:** Support chaos, failed checkouts.
- **Fix:** Single shared catalog module; CI check that both match.

---

## Low

### L1 — Cart not persisted

- **Where:** `CartContext` memory only.
- **Trigger:** Refresh / close tab.
- **Impact:** Lost cart (annoyance). Not a security bug.
- **Fix:** `sessionStorage` with stock revalidation.

### L2 — Email validation is naive

- **Where:** `orders.ts` regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- **Trigger:** `a@b.c` accepted; no confirmation mail.
- **Impact:** Typos → can’t contact buyer; fake emails for spam orders.
- **Fix:** Stricter validation + optional confirm link.

### L3 — Name / notes length only partially limited

- **Where:** Name min 2, no max; grade ≤ 80; notes ≤ 500.
- **Trigger:** Extremely long name string in JSON (within 16 KB body).
- **Impact:** Ugly admin UI; large `orders.json`.
- **Fix:** Cap name (e.g. 80 chars); sanitize newlines.

### L4 — Admin order PATCH does not URL-decode id (mark-paid does)

- **Where:** `admin.ts` `payMatch` uses `decodeURIComponent`; `orderMatch` passes raw capture.
- **Trigger:** Encoded characters in order id path (unlikely with current id format `CSH-YYYYMMDD-HEX`).
- **Impact:** Rare 404 on status update.
- **Fix:** Decode consistently.

### L5 — Floating-point money

- **Where:** Prices are integers today (15/25); `eurosToCents` uses `Math.round(total * 100)`.
- **Trigger:** Future non-integer prices.
- **Impact:** Off-by-one cent vs Stripe.
- **Fix:** Store cents as integers end-to-end.

### L6 — `SHOP_PUBLIC_BASE_URL` default `http://localhost:5174`

- **Where:** `payments-config.ts` `shopPublicBaseUrl`.
- **Trigger:** Production Stripe without env set → success/cancel URLs point at localhost.
- **Impact:** Paid customers never return to shop; confirm relies on webhook (if configured) or fails UX.
- **Fix:** Refuse to start Stripe session if public base is localhost in `NODE_ENV=production`.

### L7 — Example `production.env.example` embeds LAN IP

- **Where:** `config/production.env.example` (`10.100.5.89`).
- **Trigger:** Copied blindly to wrong network.
- **Impact:** Broken Stripe redirects.
- **Fix:** Placeholders only (`https://shop.example`).

### L8 — No CSRF token on admin cookie auth

- **Where:** Admin cookie `SameSite=Strict` (good). State-changing admin POSTs rely on cookie.
- **Trigger:** Classic CSRF is largely blocked by `SameSite=Strict` + cross-site; less risk on same-site XSS.
- **Impact:** Low today; rises if XSS ever appears in admin UI.
- **Fix:** Keep Strict; add CSRF token if SameSite ever loosened.

### L9 — Logout is cookie-clear only

- **Where:** Stateless HMAC session.
- **Trigger:** Cookie stolen before logout still works until expiry.
- **Impact:** 8h window.
- **Fix:** Server session store or rotating secrets.

### L10 — React admin renders customer notes as text (OK)

- **Where:** `AdminOrdersPage` `{order.customer.notes}` — React escapes. **Not XSS** with current code.
- **Info:** Keep avoiding `dangerouslySetInnerHTML` for customer fields. (`chart.tsx` uses it for CSS only — unrelated.)

---

## Info / ops / “stupid but human”

### I1 — Weak placeholder secrets if left in place

- Local `.env` must use a strong unique `ADMIN_PASSWORD` (never commit it).
- `HUB_API_KEY=generate-a-long-random-string` still placeholder unless overridden by shared vault.
- **Never commit** `shop/.env` or `config/production.env`.

### I2 — Shared Windows path hard-coded

- `payments-config.ts` defaults to `E:\Schülerfirma\shared\csh-payments.env`. Harmless on Mac if missing; on school PC must exist or payments stay “not configured”.

### I3 — Hub push default mode `local` with host `YOUR_MAC_LAN_IP`

- `hub-push-config.ts` — noisy failed pushes every 60s if enabled without real URL.
- Set `HUB_PUSH_MODE=production` or explicit `HUB_PUSH_URL` on the school server.

### I4 — Admin “mark paid” buttons are one click, no confirm

- Easy mis-click (especially next to status dropdown). Add “Bist du sicher?”.

### I5 — No order search / filter in admin

- Long list → wrong order marked paid (process bug).

### I6 — File-based store won’t survive multi-instance

- `withFileLock` is **in-process only**. Two Node processes / two machines sharing `shop/data` via network drive → races again.
- Run **one** shop process writing that folder.

### I7 — Express has no `helmet`, body size global limit, or request timeout

- Rely on per-handler `readBody` caps (good where used). Votes exception (M8).

### I8 — Production static `app.get("*")` SPA fallback

- Correct as long as API routes registered first (they are). Mis-ordering later would break APIs.

---

## What is already done well (keep)

- Server **authoritative prices** from `catalog.ts` (client cannot set `unitPrice`).
- Order create validates slug/size against catalog; qty integer 1–10 per line.
- Admin session: HttpOnly cookie, HMAC, `timingSafeEqual` on password, login rate limit (when IP honest).
- Admin list strips `accessToken`.
- Stripe webhook signature verification when `STRIPE_WEBHOOK_SECRET` set.
- PayPal QR image endpoint allowlists managed QR URL only (`qr.ts` + `isAllowedPaypalQrPayload`).
- Atomic rename writes for `orders.json` / inventory via `writeJsonFile`.
- Dual payment method rejection reduces accidental double-pay attempts (at cost of M4).

---

## Suggested fix order (practical)

1. Lock stock + order create together; merge duplicate line items; rate-limit `POST /api/orders`.
2. Auto-expire unpaid orders → restore stock.
3. Disable vote API until launch; fix IP trust + body limit + file lock.
4. Harden PayPal ops (or require Stripe for auto-paid); confirm dialogs on admin mark-paid / cancel; block cancel of paid orders.
5. Stripe: require metadata order id; don’t trust arbitrary sessionId; set real `SHOP_PUBLIC_BASE_URL` in prod.
6. Dedicated `ADMIN_SESSION_SECRET`; strong `HUB_API_KEY`; remove Manus public leftovers from prod build.

---

## Quick reproduce cheatsheet

```bash
# Vote while UI says coming soon
curl -s -X POST http://localhost:5174/api/votes \
  -H 'Content-Type: application/json' \
  -d '{"designId":"crest-logo","fingerprint":"testfinger"}'

# Oversized same-SKU order (if stock high enough)
# (20 lines × qty 10 of one size)

# Payments public info
curl -s http://localhost:5174/api/payments/status

# Admin login brute with spoofed IP (if no real proxy)
curl -s -X POST http://localhost:5174/api/admin/login \
  -H 'Content-Type: application/json' \
  -H 'X-Forwarded-For: 203.0.113.1' \
  -d '{"password":"wrong"}'
```

---

*End of audit. Re-run after payment/stock hardening before public school launch.*

---

## Remediation log (2026-07-23)

Implemented in code (not a full PayPal Orders API — that would be a product change):

| ID | Fix |
|----|-----|
| C1 | PayPal links embed order id; admin mark-paid requires `confirm` + PayPal reference; UI confirm/prompt |
| C2 | Shared `shopDataLockKey` for stock + orders; adjust unlocked only under that lock |
| H1 | IP + email rate limits; max 3 open unpaid orders per email |
| H2 | Auto-expire unpaid pending orders (`ORDER_UNPAID_TTL_MINUTES`, default 120) + stock restore |
| H3 | `VOTING_ENABLED` default false → POST `/api/votes` returns 403 |
| H4 | `TRUST_PROXY` gate for `X-Forwarded-For`; vote rate limit; fingerprint length cap |
| H5 | Merge duplicate line items; max 10 per variant |
| H6 | Block cancel when `paymentStatus === paid` |
| H7 | Strip token from return URL; keep in sessionStorage for remount |
| M1 | `submittingRef` on checkout |
| M2/M3 | Cart/stock caps; fail closed if stock API fails |
| M4 | Admin `reset-payment` endpoint + UI button |
| M5 | Stripe confirm uses only stored `stripeSessionId`; require metadata `order_id` |
| M6 | Login rate limit uses trusted IP helper |
| M7 | `ADMIN_SESSION_SECRET` in env (+ warn if missing) |
| M8/M9 | Vote body limit + file lock + atomic JSON write |
| M10 | `readJsonFile` corrupt recovery |
| M11 | Payments status returns booleans only |
| M12 | Stock max 500 + admin confirm |
| M13 | Reject placeholder `HUB_API_KEY` |
| M14 | Strip `__manus__` from production build; block route in prod server |
| M15 | Shared `catalog-meta.ts` for prices/sizes |
| L1 | Cart persisted in `sessionStorage` |
| L2/L3 | Stricter email + name max length |
| L4 | URL-decode order ids in admin |
| L6/L7 | Stripe refuses localhost public URL in production; example env uses placeholders |

**Still manual / ops:** Real PayPal webhook capture; set strong `HUB_API_KEY` on school server; set `TRUST_PROXY=1` only behind a reverse proxy; set `VOTING_ENABLED=true` when the vote goes live.
