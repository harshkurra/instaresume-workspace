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
| 16 | LinkedIn import — add direct download link alongside GIF | Easy | High | `[ ]` Todo | Keep the animated GIF, but also add a direct link to `https://www.linkedin.com/mypreferences/d/download-my-data`. UI redesign to be done via Claude Design. |
| 17 | Upload dialogs UI overhaul | Medium | Medium | `[ ]` Todo | All upload dialogs (PDF, DOCX, LinkedIn) are visually outdated. Redesign to a modern look consistent with the rest of the app. |
| 18 | Improve resume ATS score journey | Medium | High | `[ ]` Todo | End-to-end UX improvement for the resume scoring flow — clearer score breakdown, better guidance on what to fix, smoother "Improve score" action and result review. |
| 19 | Resume picker dropdown in cover letter generator | Easy | High | `[ ]` Todo | In the "Create cover letter from resume" dialog/flow, add a dropdown listing the user's existing resumes so they can pick one directly instead of having to navigate away. |
| 20 | Anonymous auth funnel — landing page → AI flow without login | High | High | `[ ]` Todo | Use Firebase `signInAnonymously()` to let landing page visitors run the AI creation flow immediately, then upgrade to real account on save/download via `linkWithCredential()`. Full plan in `docs/anonymous-auth-funnel.md`. |
| 21 | Expand pre-filled role templates from 17 → 50 via AI generation script | Medium | High | `[ ]` Todo | Script pipeline: (1) use AI to generate valid resume JSON for each new role, (2) render thumbnail via Puppeteer/Playwright screenshot of the frontend builder or backend PDF→image, (3) upload thumbnail to Firebase/GCS, (4) add template entry to codebase. Target 50 roles covering all major job categories. |

## Session Log
- **2026-05-12**: Roadmap created
- **2026-05-18**: Item 4 done — workspace pushed to `harshkurra/instaresume-workspace`
- **2026-08-21**: Item 1 done — PR #55 merged, nodejs22 live on App Engine production
- **2026-08-22**: Item 2 done — PR #57 merged. Item 3 moved to In Progress — findings captured above.
- **2026-08-26**: Item 5 done — CREATE NEW menus redesigned across all document types, mobile bottom sheet shipped. Items 15–17 added from prod testing findings.
- **2026-08-28**: Item 15 done — zero state shipped for all document types (PR #490). Items 20–21 added — anonymous auth funnel and pre-filled template expansion script.
