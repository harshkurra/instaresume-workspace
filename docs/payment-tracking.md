# Payment Funnel Tracking — Spec

**Roadmap item:** #28  
**Priority:** Critical  
**Context:** All payments from 2026-09-29 onwards are either cancelled or failed. We have zero visibility into why — no GA events at checkout steps, no Razorpay webhook recording outcomes to Firestore, no context on what triggered the payment attempt.

---

## What We Need to Know

1. **Which feature triggered the payment?** (ATS score paywall? Credits exhausted in AI writer? Download dialog?)
2. **At which step do users bail?** (Saw the paywall? Clicked pay? Entered card? Submitted?)
3. **Why do payments fail?** (Card declined? Timeout? UPI failure?)
4. **What's the success rate per plan?**

---

## Part 1 — GA4 Events (Frontend)

### New events to add

All events should include a `context` param indicating what triggered the payment flow.

```js
// Context values
// 'ats_score'        — ATS score paywall in builder
// 'ai_credits'       — AI credits exhausted (writing features)
// 'ru_credits'       — RU credits exhausted (ATS/tailor)
// 'download_dialog'  — "Help us stay free" row in download dialog (item #29)
// 'upgrade_page'     — direct visit to pricing/upgrade page

payment_hook_shown      // params: { context }
// Where: wherever setPaymentMode(true) is called in builder.js and other paywall triggers

checkout_started        // params: { context, plan, amount }
// Where: when Razorpay checkout modal opens (Razorpay `modal.ondismiss` won't fire here — fire on open)

checkout_abandoned      // params: { context, plan, step }
// Where: Razorpay `modal.ondismiss` callback (fires when user closes without paying)
// step values: 'before_upi' | 'upi_pending' | 'card_entry' | 'unknown'

payment_completed       // params: { context, plan, amount, payment_id }
// Where: Razorpay `handler` success callback (fires client-side before server verification)

payment_failed          // params: { context, plan, reason }
// Where: Razorpay `modal.ondismiss` after a failed attempt (check response.error)
// reason: 'card_declined' | 'upi_timeout' | 'bank_error' | 'unknown'
```

### Existing event to enrich

```js
payment_click   // already fired — add { context, plan } params
```

### GA4 Funnel to build (Explore → Funnel exploration)

```
payment_hook_shown
→ payment_click
→ checkout_started
→ payment_completed   (success path)
   OR
→ checkout_abandoned  (drop-off — look at { step } breakdown)
   OR
→ payment_failed      (look at { reason } breakdown)
```

---

## Part 2 — Razorpay Webhook (Backend)

### Why needed

GA4 client-side events can be lost (ad blockers, page close, network issues). Razorpay webhooks are server-to-server — authoritative source of truth.

### Setup steps

1. **Create webhook endpoint** in backend: `POST /payments/razorpay-webhook`
2. **Register in Razorpay Dashboard** → Webhooks → Add new webhook URL → select events:
   - `payment.captured` (success)
   - `payment.failed`
   - `order.paid`
3. **Verify signature** using `razorpay-signature` header + `RAZORPAY_WEBHOOK_SECRET` env var
4. **Write to Firestore** on each event:
   - `payments/{paymentId}` — `{ uid, plan, amount, status, context, timestamp, razorpayOrderId }`
   - Update `users/{uid}` — `{ lastPaymentAt, lastPaymentStatus, lastPaymentPlan }`
5. **Add RU/AI credits on `payment.captured`** — same logic as existing credit addition, but triggered by webhook instead of (or in addition to) client callback

### Firestore schema

```
payments/{razorpay_payment_id}
  uid: string
  plan: string           // 'basic' | 'pro' | 'ru_5' | 'ru_15' | 'ru_35' (for item #29)
  amount: number         // in paise
  currency: string       // 'INR'
  status: string         // 'captured' | 'failed' | 'pending'
  context: string        // which feature triggered it
  createdAt: timestamp
  updatedAt: timestamp
  razorpayOrderId: string
  errorCode: string?     // on failure
  errorDescription: string?
```

### Context param propagation

The `context` value needs to flow from frontend → Razorpay order creation → webhook. Options:
- Pass `context` as `notes.context` in the Razorpay order creation request (Razorpay passes `notes` back in webhook payload)
- This means `createOrder` API call in backend needs a `context` field in the request body

---

## Part 3 — Admin Visibility (item #30)

Once webhook data is in Firestore, build a simple GA4 Looker Studio report or Firestore query covering:

- Daily payment attempts vs completions vs failures
- Success rate by plan
- Drop-off step distribution (from `checkout_abandoned.step`)
- Failure reason distribution (from `payment_failed.reason`)
- Revenue by context (which feature drives most conversions)

---

## Implementation Order

1. **GA4 events** — frontend only, no backend needed. Add in same PR as or immediately after download dialog revamp.
2. **Razorpay webhook** — backend work. Creates the authoritative payment record.
3. **Context in order creation** — small backend + frontend change to pass `context` through to Razorpay notes.
4. **Admin report** — after data accumulates (1–2 weeks post webhook).

---

## Files to Touch

### Frontend (`resume-builder-frontend`)
- `src/utils/eventTracking/eventName.js` — add new event name constants
- Wherever `setPaymentMode(true)` is called → fire `payment_hook_shown`
- Wherever Razorpay checkout is initialised → fire `checkout_started`, wire `ondismiss` / `handler`
- `src/pages/Builder/builder.js` — add `context` to `payment_click` event

### Backend (`resume-builder-service`)
- `src/payments/payments.controller.ts` — add `POST /payments/razorpay-webhook` endpoint
- `src/payments/payments.service.ts` — webhook signature verification + Firestore write + credit addition
- `.env` / App Engine env — add `RAZORPAY_WEBHOOK_SECRET`
