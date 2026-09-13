# Anonymous Auth Funnel — Implementation Plan

Convert landing page visitors directly into active users by letting them run the AI
creation flow before signing up, using Firebase Anonymous Auth as the invisible
session layer.

---

## Problem

Current flow:
```
Landing page CTA → /resumes → login screen → builder
```

The login wall kills momentum. Users haven't seen the product work yet, so they
have no reason to commit. Bounce rate at the login screen is the primary conversion
leak from paid/organic traffic.

## Goal

```
Landing page CTA → AI creation flow (no login visible)
                 → User sees their generated resume
                 → "Sign up to save & download" prompt
                 → Signup → anonymous account upgraded → data preserved
```

---

## How Firebase Anonymous Auth Fits

`signInAnonymously()` creates a real Firebase user with a real UID and ID token.
The backend's `FirebaseAuthMiddleware` validates it identically to a real account —
**no backend changes required for most of the flow**.

On real signup, `linkWithCredential()` converts the anonymous UID to a permanent
account. The Firestore documents written under the anonymous UID are preserved as-is.

---

## Implementation Plan

### Phase 1 — Silent Anonymous Session (Frontend)

**Trigger**: When an unauthenticated user clicks any landing page CTA that leads to
the AI creation flow or builder.

1. Check `getAuth().currentUser` — if null, call `signInAnonymously()` before routing.
2. Store a flag in Firestore `users/{uid}` → `{ isAnonymous: true }` so the app
   knows this is a guest session.
3. Route the user to the AI creation flow (JD dialog / resume-from-JD) directly,
   skipping `/resumes`.

**Files to touch:**
- `src/config/config.js` — auth lifecycle hooks (`onAuthStateChanged`)
- Landing page CTA handlers (Sanity-backed pages in `src/sanityWebpages/`)
- `src/pages/Auth/` or wherever redirect-to-login logic lives

---

### Phase 2 — Gate Premium Actions, Not the Flow

Anonymous users can:
- Run the AI creation flow (JD → resume draft)
- View and edit the generated resume in the builder
- Switch templates (view only)

Anonymous users cannot:
- Download / export PDF
- Save to their account (it's already saved, but they can't see the list)
- Use AI credits beyond the initial generation
- Access the `/resumes` dashboard

**Implementation:**
- Add `isAnonymous` check wherever download/export is triggered — show upgrade
  prompt instead.
- Limit AI calls: write a `guestAiUsed: true` flag to Firestore on first AI call;
  backend or frontend blocks subsequent calls and shows the upgrade prompt.

**Files to touch:**
- `src/pages/Builder/builder.js` — download button handler
- `src/utils/service.js` — optionally add guest guard at API layer
- Backend: no changes needed for basic flow; optionally add a check in
  `chat-gpt-ai.service.ts` if server-side rate limiting is preferred

---

### Phase 3 — Upgrade Prompt & Account Linking

Trigger the prompt at natural moments:
- User clicks Download
- User tries to leave the builder (beforeunload / route change away)
- After 3–4 minutes in the builder (time-based nudge)
- User tries to access the dashboard

**Prompt copy (suggestion):**
> "Your resume is ready — sign up to save it, download it, and access it anytime."

**On signup:**
```js
// After user completes Google / email signup
const credential = GoogleAuthProvider.credentialFromResult(result);
await linkWithCredential(getAuth().currentUser, credential);
// currentUser.uid stays the same — Firestore docs are already there
```

**Files to touch:**
- New component: `src/components/common/UpgradePrompt.js` (modal or bottom sheet)
- `src/config/config.js` — handle `linkWithCredential` in auth flow
- `src/pages/Builder/builder.js` — trigger prompt on download / exit

---

### Phase 4 — Rate Limiting & Abuse Prevention (optional but recommended)

Without this, anyone can generate unlimited resumes by clearing browser state.

**Approach:**
- On first AI generation for an anonymous user, write `guestAiUsed: true` to
  `users/{uid}` in Firestore.
- Frontend checks this flag before opening the AI dialog for anonymous users.
- If flag is set, show upgrade prompt instead of the AI flow.
- One AI generation per anonymous session is generous enough to demonstrate value.

---

## Data Flow Summary

```
Anonymous UID created
  │
  ├─ Firestore: users/{anonUid} → { isAnonymous: true, guestAiUsed: false }
  ├─ Firestore: builders/{docId} → { uid: anonUid, ... resume data ... }
  │
  ▼
User signs up (Google / email)
  │
  ├─ linkWithCredential() → anonUid becomes permanent, UID unchanged
  ├─ Firestore docs under anonUid are now owned by real account
  └─ isAnonymous flag can be cleared or left (no-op)
```

---

## Edge Cases

| Scenario | Handling |
|---|---|
| User clears browser / cookies before signing up | Session and draft are lost. Mitigate by prompting to sign up early (after generation, not after editing). |
| User already has an account and clicks landing CTA | Check `currentUser` first — if already logged in, skip anonymous auth entirely. |
| User opens app on second device before signing up | Anonymous session is device-local; draft not accessible elsewhere. Expected — upgrade prompt explains this. |
| `linkWithCredential` fails (email already exists) | Firebase returns `auth/email-already-in-use`. Offer to sign in to existing account and merge manually (edge case, low priority). |
| Anonymous account hits Firestore security rules | Rules must allow `isAnonymous == true` users to read/write their own docs. Update Firestore rules. |

---

## Firestore Rules Change

Current rules likely require `request.auth != null && request.auth.uid == userId`.
Anonymous auth satisfies this — no rule changes needed for basic read/write.

If rules explicitly check for non-anonymous users (e.g. `request.auth.token.firebase.sign_in_provider != 'anonymous'`),
those checks need to be relaxed for the builder and AI collections.

---

## Effort Estimate

| Phase | Effort | Notes |
|---|---|---|
| Phase 1 — Silent anonymous session | S | ~1 day; mostly frontend routing |
| Phase 2 — Gate premium actions | S–M | ~1–2 days; scattered touch points |
| Phase 3 — Upgrade prompt + linking | M | ~2 days; new UI component + auth flow |
| Phase 4 — Rate limiting | S | ~0.5 day; Firestore flag check |

Total: ~1 week of focused frontend work. Backend changes are minimal to none.

---

## Open Questions

- Should the landing page CTA go directly to the AI flow (JD dialog), or to a
  simplified "quick start" page?
- Do we want to A/B test this against the current login-first flow before fully
  committing?
- Should anonymous users be able to pick a template, or always start with the
  default?
