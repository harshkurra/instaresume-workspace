# instaresume.io Product Roadmap

Ordered by **easy win + importance** — quickest high-impact items first.

## Status Legend
- `[ ]` Todo
- `[~]` In Progress
- `[x]` Done

## Items

| # | Item | Effort | Importance | Status | Notes |
|---|------|--------|------------|--------|-------|
| 1 | Update Node version for backend service | Easy | Low | `[x]` Done | PR #55 merged; running nodejs22 on App Engine production |
| 2 | Update deprecated LLM models | Easy | High | `[x]` Done | PR #57 merged: centralised AI model config (`src/config/ai-models.config.ts`), migrated `gpt-3.5-turbo-instruct` off legacy completions API, paid users (`adFreeCredits` present) get `gpt-4.1-mini`, free users get `gpt-4o-mini`, B2B tiers use `gpt-4.1-mini`/`gpt-4.1` |
| 3 | Resolve ads vs paid users conflict | Easy | High | `[~]` In Progress | **Findings:** Backend already sets `IR_RISE` HttpOnly cookie after every completed payment (`payments.controller.ts:53`). Paid signal in Firestore: `adFreeCredits` written on every purchase. Two bugs to fix: (1) `maxAge` passes UNIX seconds instead of ms — fix: `(expiryTimestamp - now) * 1000`; (2) `SECRET_KEY` hardcoded in `firebase/utils.ts`, move to env var. Frontend has zero reads of `IR_RISE` — needs wiring to gate ads. |
| 4 | Set up workspace as GitHub repo with skills/agents | Easy | Medium | `[x]` Done | This repo (`instaresume-workspace`) |
| 5 | Consistent CREATE NEW menu across all document types | Medium | High | `[x]` Done | Desktop + mobile menus redesigned: icon boxes, subtitles, teal hover, submenus for template/import flows. Mobile SpeedDial replaced with bottom sheet. PR merged to master. |
| 6 | Blog creation workflow improvement via Sanity | Medium | Medium | `[ ]` Todo | Streamline the Sanity CMS blog publishing process; reduce manual steps |
| 7 | Reduce operational costs | Medium | Medium | `[ ]` Todo | Audit Firebase reads/writes, OpenAI token usage, and other service costs |
| 8 | Image upload for resume parsing via LLMs | Medium | High | `[ ]` Todo | Allow users to upload a resume image/photo; parse content via vision LLM and populate the builder |
| 9 | MCP setup for customers on GPT/Claude | Medium | High | `[ ]` Todo | Monetizable — expose an MCP server so users can interact with their resumes via Claude/GPT Desktop |
| 10 | Add new templates to both template repos | Medium | Medium | `[ ]` Todo | `@harshkurra/resume-template-builder` and `@harshkurra/resume-template-builder-v2` |
| 11 | Update website / marketing page designs | High | Medium | `[ ]` Todo | Sanity-backed pages in `src/sanityWebpages/` |
| 12 | Chat interface for quick resume/cover letter creation | High | High | `[ ]` Todo | Conversational UX flow; user answers prompts and a resume/cover letter is assembled |
| 13 | SAAS offering for small recruiting agencies | High | Medium | `[ ]` Todo | Multi-seat / agency tier; new Firestore data model, billing changes, role management |
| 14 | E2E testing via Playwright | High | Low | `[ ]` Todo | Cover critical user flows: create resume, download PDF, AI generation |
| 15 | Zero state design for listing page | Easy | Medium | `[ ]` Todo | When user has no documents, show an empty state that guides them to create their first resume/cover letter/bio data. Designs to be provided. |
| 16 | LinkedIn import — add direct download link alongside GIF | Easy | High | `[~]` In Progress | Added "Go to LinkedIn → Download my data" button in the upload dialog. Full dialog revamp pending design from Harsh. |
| 17 | Upload dialogs UI overhaul | Medium | Medium | `[ ]` Todo | All upload dialogs (PDF, DOCX, LinkedIn) are visually outdated. Redesign to a modern look consistent with the rest of the app. |
| 18 | Improve resume ATS score journey | Medium | High | `[ ]` Todo | End-to-end UX improvement for the resume scoring flow — clearer score breakdown, better guidance on what to fix, smoother "Improve score" action and result review. |
| 19 | Resume picker dropdown in cover letter generator | Easy | High | `[~]` In Progress | Resume picker dropdown added. Full dialog revamp pending design from Harsh. |
| 20 | Anonymous auth funnel — landing page → AI flow without login | High | High | `[ ]` Todo | Use Firebase `signInAnonymously()` to let landing page visitors run the AI creation flow immediately, then upgrade to real account on save/download via `linkWithCredential()`. Full plan in `docs/anonymous-auth-funnel.md`. |
| 21 | Expand pre-filled role templates from 17 → 50 via AI generation script | Medium | High | `[ ]` Todo | Script pipeline: (1) use AI to generate valid resume JSON for each new role, (2) render thumbnail via Puppeteer/Playwright screenshot of the frontend builder or backend PDF→image, (3) upload thumbnail to Firebase/GCS, (4) add template entry to codebase. Target 50 roles covering all major job categories. |
| 22 | JD URL input — accept a job posting link instead of pasted text | Medium | High | `[ ]` Todo | Wherever a JD text field exists (tailor-to-JD dialog, cover letter from JD, ATS checker), add a "Paste a link" tab. Backend fetches and extracts the JD text server-side (avoids CORS), caches by URL. Covers LinkedIn, Indeed, Glassdoor, and generic job pages. Frontend only needs to pass the URL; extraction is transparent to the user. |
| 23 | Refactor ChatGptAiService — extract shared user-fetch + credit-gate boilerplate | Easy | Low | `[ ]` Todo | Every public method in `chat-gpt-ai.service.ts` copy-pastes the same ~20 lines: getFirebaseUser → fallback updateUserDetails → credit check → throw 6001. Extract into a private helper `resolveUserAndCheckCredits(userId, creditType: 'RUCredits' \| 'AICredits')` that returns `{ firebaseUser, credits }`. Reduces copy-paste risk and makes future credit type changes a one-line edit. |
| 24 | Cover letter nudge + unified resume → cover letter → ATS score journey | Medium | High | `[ ]` Todo | Three connected improvements: (1) After resume download, nudge users with enough resume data to generate a cover letter from that resume ("Your resume looks great — want a matching cover letter?"). (2) Wire resume ↔ cover letter relationship in Firestore so cover letter generator pre-selects the source resume. (3) From cover letter, surface ATS score as a natural next step — completing the full job-application journey in one flow. GA data: resume downloads 5,198 vs cover letter downloads 199 (25× gap) — nudge is the lowest-effort lever to close this. |

## Free Tools (Growth / SEO)

Standalone free tools to drive organic traffic and top-of-funnel signups. Reference: [resumemaker.online/free-tools](https://www.resumemaker.online/free-tools/).

| # | Tool | Effort | Priority | Status | Notes |
|---|------|--------|----------|--------|-------|
| T1 | Resume Checker / Grader | Medium | High | `[ ]` Todo | Score a resume against quality signals (length, keywords, formatting, sections present). Existing ATS score flow is related — could extend it. |
| T2 | Professional Summary Generator | Easy | High | `[ ]` Todo | User pastes role + few bullet points → AI generates 2–3 summary variants. No login required for first use. |
| T3 | Resume Bullet Points Generator | Easy | High | `[ ]` Todo | Job title + company + responsibilities input → AI rewrites as strong, quantified bullet points. High repeat-use potential. |
| T4 | Resume Skills Section Generator | Easy | High | `[ ]` Todo | Role + experience level → curated skills list. Can reuse `SKILL_SUGGESTIONS` logic already in the AI dialog. |
| T5 | Cover Letter Generator | Easy | High | `[ ]` Todo | Resume + JD → cover letter. Already exists as a paid feature inside the app — create a free lite version as a landing page tool. |
| T6 | Resume Keyword Scanner | Medium | High | `[ ]` Todo | Paste resume + JD → highlights matching and missing keywords. ATS-oriented. Closely related to item 18 (ATS score journey). |
| T7 | AI Resume Enhancer | Medium | Medium | `[ ]` Todo | Full resume paste → rewritten, improved version. Heavier AI call; use credit model for logged-in users, rate-limit for anonymous. |
| T8 | Salary Estimator | Medium | Medium | `[ ]` Todo | Role + location + years of experience → salary range. Could use an external API (Levels.fyi, BLS) or LLM knowledge. |
| T9 | Job Application Tracker | High | Low | `[ ]` Todo | Kanban board: Applied → Interviewing → Offer → Rejected. Requires auth + new Firestore collection. High retention if done well. |
| T10 | AI Interview Practice | High | Medium | `[ ]` Todo | Role-specific question bank + AI evaluates user's text/voice answers. Big feature — consider as a separate paid tier. |
| T11 | Resignation Letter Generator | Easy | Low | `[ ]` Todo | Role + reason + last day → polished resignation letter. Quick win, low traffic ceiling. |
| T12 | Resume Translator | Medium | Low | `[ ]` Todo | Paste resume + target language → translated version via LLM. Useful for international job seekers. |
| T13 | Video Resume Generator | High | Low | `[ ]` Todo | Script generation from resume → text-to-speech or teleprompter UI. Complex; revisit when core tools are stable. |

## Session Log
- **2026-05-12**: Roadmap created
- **2026-05-18**: Item 4 done — workspace pushed to `harshkurra/instaresume-workspace`
- **2026-08-21**: Item 1 done — PR #55 merged, nodejs22 live on App Engine production
- **2026-08-22**: Item 2 done — PR #57 merged. Item 3 moved to In Progress — findings captured above.
- **2026-08-26**: Item 5 done — CREATE NEW menus redesigned across all document types, mobile bottom sheet shipped. Items 15–17 added from prod testing findings.
- **2026-08-28**: Item 15 done — zero state shipped for all document types (PR #490). Items 20–21 added — anonymous auth funnel and pre-filled template expansion script.
- **2026-08-29**: Item 22 added — JD URL input as alternative to pasted text.
- **2026-08-30**: Free Tools section added (T1–T13) — SEO/growth tools referenced from resumemaker.online, prioritized by effort and traffic potential.
- **2026-09-01**: AI Create flow (feat/ai-create-flow + feat/ai-create-endpoint) deployed to staging. Backend tech debt noted: extract repeated user-fetch + credit-gate boilerplate in ChatGptAiService into a shared private helper `resolveUserAndCheckCredits(userId, creditType)` — flagged as item 23. Items 16 and 19 in progress — initial changes on feat/linkedin-coverletter-improvements; full dialog revamps pending design.
- **2026-09-06**: GA4 MCP connected. Top product events (30d): resume_download 5,198 · use_ai_writer 840 · scan_tailor 631 · generate_with_ai 309 · cover_download 199. Item 24 added — cover letter nudge + unified resume→cover letter→ATS journey (data: 25× gap between resume and cover letter downloads). Next: item 22 (JD URL input).
