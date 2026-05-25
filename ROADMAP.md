# instaresume.io Product Roadmap

Ordered by **easy win + importance** — quickest high-impact items first.

## Status Legend
- `[ ]` Todo
- `[~]` In Progress
- `[x]` Done

## Items

| # | Item | Effort | Importance | Status | Notes |
|---|------|--------|------------|--------|-------|
| 1 | Update Node version for backend service | Easy | Low | `[~]` In Progress | PR #54 merged — needs testing + deploy to staging then production |
| 2 | Update deprecated LLM models | Easy | High | `[ ]` Todo | OpenAI SDK in backend — find all model ID strings (e.g. gpt-3.5-turbo variants), upgrade to current supported models |
| 3 | Resolve ads vs paid users conflict | Easy | High | `[ ]` Todo | Paying users / users with credits shouldn't see ads — gate ad serving on subscription/credit status in auth context |
| 4 | Add `noindex` for auth-gated pages (Prerender cost) | Easy | High | `[ ]` Todo | resume-report and other login-required pages are being crawled by Prerender ($49/month plan). Add `<meta name="robots" content="noindex">` for all `/secure/*` routes so Prerender doesn't render and cache them. Direct cost saving. |
| 5 | Set up workspace as GitHub repo with skills/agents | Easy | Medium | `[x]` Done | This repo (`instaresume-workspace`) |
| 6 | Consistent CREATE NEW menu across all document types | Medium | High | `[ ]` Todo | Resume has 8 options; Cover Letters / Resignation Letters have only a plain button; Bio Data has only "Blank Bio Data". All 4 types should have feature parity |
| 7 | Blog creation workflow improvement via Sanity | Medium | Medium | `[ ]` Todo | Streamline the Sanity CMS blog publishing process; reduce manual steps |
| 8 | Operational cost audit and reduction | Medium | High | `[ ]` Todo | Current monthly spend: Prerender $49 (hard to cut without SSR rewrite), Cloudflare $35, Google Cloud ~3000 INR, CA (accounting + GST filing) ~6000 INR (high — explore cheaper CA or DIY GST), Content writer 15000 INR (already relieved), Intern dev 10K INR. Priority targets: CA fees and Cloudflare plan review. |
| 9 | Image upload for resume parsing via LLMs | Medium | High | `[ ]` Todo | Allow users to upload a resume image/photo; parse content via vision LLM and populate the builder |
| 10 | MCP setup for customers on GPT/Claude | Medium | High | `[ ]` Todo | Monetizable — expose an MCP server so users can interact with their resumes via Claude/GPT Desktop |
| 11 | Add new templates to both template repos | Medium | Medium | `[ ]` Todo | `@harshkurra/resume-template-builder` and `@harshkurra/resume-template-builder-v2` |
| 12 | Update website / marketing page designs | High | Medium | `[ ]` Todo | Sanity-backed pages in `src/sanityWebpages/` |
| 13 | Chat interface for quick resume/cover letter creation | High | High | `[ ]` Todo | Conversational UX flow; user answers prompts and a resume/cover letter is assembled |
| 14 | B2B tools for small recruiting agencies / MSME | High | Medium | `[ ]` Todo | Totally unexplored space. Target: small MSME recruiting agencies who manage candidates and need bulk resume tooling. Needs market validation before committing — understand if the ICP is right, what features they need (multi-seat, candidate tracking, white-label?), and whether the revenue potential justifies the build effort. Related to existing widget/tenant infrastructure. |
| 15 | E2E testing via Playwright | High | Low | `[ ]` Todo | Cover critical user flows: create resume, download PDF, AI generation |

## Session Log
- **2026-05-12**: Roadmap created
- **2026-05-18**: Item 4 done — workspace pushed to `harshkurra/instaresume-workspace`
- **2026-05-25**: Added items 4 (Prerender noindex), 8 expanded with cost breakdown, 14 updated with MSME B2B context. Fixed item 1 PR reference to #54.
