# Migration Plan: Inline Worker → Repo-based Worker

## Status: ON HOLD — low revenue impact (see decision note below)

---

## Decision Note

**Should we do this?** Probably not right now.

The current live inline CF Worker already handles prerender correctly — that's the only part that has real revenue impact (SEO traffic → organic signups). The new feature this repo adds is **ad-gating for paid users (strip AdSense script via IR_RISE cookie)**. But:

- AdSense revenue is already down ~95%
- Most paying customers use ad blockers anyway — they never see ads regardless
- Deploying carries regression risk on prerender (critical for SEO)
- Net revenue impact of deploying: near zero

**Revisit when:** Either AdSense revenue recovers meaningfully, or the prerender logic needs a change that requires deploying from this repo anyway.

---

## Pre-deployment steps

**1. Set secrets via Wrangler CLI** (run from `cloudflare-worker/` dir):
```bash
# The prerender.io API key from your Prerender dashboard
wrangler secret put PRERENDER_API_KEY
# → enter the key from prerender.io dashboard

# The HMAC signing key — must match what's in the backend (firebase/utils.ts)
wrangler secret put PREMIUM_COOKIE_KEY
# → enter the key from firebase/utils.ts

# Repeat for production env:
wrangler secret put PRERENDER_API_KEY --env production
wrangler secret put PREMIUM_COOKIE_KEY --env production
```

**2. Verify the worker name** — go to Cloudflare Dashboard → Workers & Pages, check what the current inline worker is named. If it matches `eat-cookie` in `wrangler.toml`, deploying will update it in-place. If the name differs, update `wrangler.toml` first.

---

## Test locally before deploying

```bash
cd cloudflare-worker
yarn
yarn local_dev   # starts on http://localhost:8787
```

- **Prerender test**: Set `TEST_PRERENDER = true` in `wrangler.toml`, then `curl -H "User-Agent: googlebot" http://127.0.0.1:8787`
- **Cookie/ad-gating test**: Run `node generateHMAC.js` to generate a test `IR_RISE` cookie, attach it to a request, verify AdSense script is absent in the response HTML

---

## Deploy

```bash
wrangler deploy --env production
```

Rollback is instant from Cloudflare Dashboard → Workers → version history if anything breaks.

---

## Separate backend bug (fix independently, no worker deploy needed)

`IR_RISE` cookie `maxAge` bug in `payments.controller.ts` — passes UNIX seconds instead of milliseconds, so cookie lasts ~55 years instead of 30 days:

```typescript
// Current (wrong):
maxAge: cookie.expiryTimestamp

// Fix:
maxAge: (cookie.expiryTimestamp - Math.floor(Date.now() / 1000)) * 1000
```

Also: `SECRET_KEY` in `firebase/utils.ts` should come from an env var rather than being hardcoded — low urgency but good hygiene.
