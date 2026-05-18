# instaresume.io Product Roadmap

Ordered by **easy win + importance** — quickest high-impact items first.

## Status Legend
- `[ ]` Todo
- `[~]` In Progress
- `[x]` Done

## Items

| # | Item | Effort | Importance | Status | Notes |
|---|------|--------|------------|--------|-------|
| 1 | Update Node version for backend service | Easy | Low | `[~]` In Progress | PR #48 merged — needs testing + deploy to production |
| 2 | Update deprecated LLM models | Easy | High | `[ ]` Todo | OpenAI SDK in backend — find all model ID strings (e.g. gpt-3.5-turbo variants), upgrade to current supported models |
| 3 | Resolve ads vs paid users conflict | Easy | High | `[ ]` Todo | Paying users / users with credits shouldn't see ads — gate ad serving on subscription/credit status in auth context |
| 4 | Set up workspace as GitHub repo with skills/agents | Easy | Medium | `[x]` Done | This repo (`instaresume-workspace`) |
| 5 | Consistent CREATE NEW menu across all document types | Medium | High | `[ ]` Todo | Resume has 8 options; Cover Letters / Resignation Letters have only a plain button; Bio Data has only "Blank Bio Data". All 4 types should have feature parity |
| 6 | Blog creation workflow improvement via Sanity | Medium | Medium | `[ ]` Todo | Streamline the Sanity CMS blog publishing process; reduce manual steps |
| 7 | Reduce operational costs | Medium | Medium | `[ ]` Todo | Audit Firebase reads/writes, OpenAI token usage, and other service costs |
| 8 | Image upload for resume parsing via LLMs | Medium | High | `[ ]` Todo | Allow users to upload a resume image/photo; parse content via vision LLM and populate the builder |
| 9 | MCP setup for customers on GPT/Claude | Medium | High | `[ ]` Todo | Monetizable — expose an MCP server so users can interact with their resumes via Claude/GPT Desktop |
| 10 | Add new templates to both template repos | Medium | Medium | `[ ]` Todo | `@harshkurra/resume-template-builder` and `@harshkurra/resume-template-builder-v2` |
| 11 | Update website / marketing page designs | High | Medium | `[ ]` Todo | Sanity-backed pages in `src/sanityWebpages/` |
| 12 | Chat interface for quick resume/cover letter creation | High | High | `[ ]` Todo | Conversational UX flow; user answers prompts and a resume/cover letter is assembled |
| 13 | SAAS offering for small recruiting agencies | High | Medium | `[ ]` Todo | Multi-seat / agency tier; new Firestore data model, billing changes, role management |
| 14 | E2E testing via Playwright | High | Low | `[ ]` Todo | Cover critical user flows: create resume, download PDF, AI generation |

## Session Log
- **2026-05-12**: Roadmap created
- **2026-05-18**: Item 4 done — workspace pushed to `harshkurra/instaresume-workspace`
