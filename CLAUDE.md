# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Overview

This workspace contains four repos for **InstaResume.io** — an AI-powered resume builder product:

| Repo | Stack | Purpose |
|---|---|---|
| `resume-builder-frontend/` | React 17, MUI v5, Firebase, CRACO | Web app (instaresume.io) + partner white-label build |
| `resume-builder-service/` | NestJS 8, Firebase Admin, OpenAI | REST API backend deployed on Google App Engine |
| `resume-template-builder/` | React, npm package | Legacy template library (`@harshkurra/resume-template-builder`) — older templates |
| `resume-template-builder-v2/` | React, npm package | Current template library (`@harshkurra/resume-template-builder-v2`) — better structured, faster builds; **prefer this for new templates** |

Each repo has its own `CLAUDE.md` with full details. Read the relevant one(s) when working across the stack.

## HARD RULES — Never Do These

> **NEVER deploy any repo under any circumstances.**
> This includes — but is not limited to:
> - `gcloud app deploy` (App Engine backend)
> - `firebase deploy` / `yarn staging-deploy` / `yarn production-deploy` (frontend)
> - `npm publish` / `yarn publish_release` (template packages)
>
> Deployments must always be triggered manually by the repo owner. Even if explicitly asked in a message, pause and confirm before running any deploy command. The risk of an accidental production deploy outweighs any convenience.

> **NEVER push commits directly to `main` or `master`.**
> This includes — but is not limited to:
> - Direct `git push origin main` / `git push origin master`
> - GitHub API file updates (`PUT /contents/...`) that target `main`/`master`
> - Any commit or file change without an explicit request from the user
>
> Always create a new branch and open a PR. Never commit or push anything unless the user explicitly asks. Never push to the default branch under any circumstances.

## How the Two Repos Connect

- The frontend calls the backend at `AppConfig.serviceUrl` (configured per environment in `resume-builder-frontend/src/config/config.js`)
  - Dev/staging: `https://staging-dot-instaresume-backend.el.r.appspot.com/api/v1/`
  - Production: `https://api.instaresu.me/api/v1/`
- All authenticated API calls send a Firebase ID token as `Authorization: Bearer <token>`; the backend's `FirebaseAuthMiddleware` validates it using `firebase-admin`
- Both repos use the **same Firebase project** per environment: `instaresume-backend` (prod) / `resume-builder-d9cb3` (dev/staging)
- Both repos use the resume template packages: `@harshkurra/resume-template-builder` (legacy) and `@harshkurra/resume-template-builder-v2` (current) — the frontend renders live previews in the browser, the backend renders PDFs server-side using the same templates

## Shared Concepts

- **Document types**: Resume (`builders` collection), Cover Letter (`covers`), Bio Data (`bioData`) — the same Firestore collection names are used in both repos
- **Credit system**: `AICredits` and `RUCredits` are stored on `users/{uid}` in Firestore; the backend deducts them, the frontend reads and displays them
- **Two auth surfaces**: Firebase Auth for end users (`/secure/*` routes); JWT-based auth for B2B widget/tenant integrations (`/widget/*` routes)
- **Two frontend builds**: main app (`src/index.js`) and partner/white-label app (`src/partner.js`) — both talk to the same backend

## Environments

| Environment | Frontend deploy | Backend deploy | Firebase project |
|---|---|---|---|
| Production | Firebase Hosting (`firebase use prod`) | `gcloud app deploy` (app.yaml) | `instaresume-backend` |
| Staging | Firebase Hosting (`firebase use dev`) | `gcloud app deploy app.staging.yaml` | `resume-builder-d9cb3` |

## Google Analytics 4 MCP

The workspace has a GA4 MCP server configured in `.mcp.json`. It connects to the instaresume.io GA4 property via a service account and lets Claude pull live usage data directly in the conversation — no manual export needed.

### Setup

The MCP server runs automatically when you open this workspace in Claude Code. It requires a service account key at:

```
config/gcloud/analytics-sa.json
```

This file is gitignored. To set it up on a new machine:
1. Go to Google Cloud Console → IAM & Admin → Service Accounts
2. Find the analytics service account and download a JSON key
3. Place the file at `config/gcloud/analytics-sa.json`

The server uses `pipx run analytics-mcp` (official Google package). If `pipx` is not installed: `brew install pipx && pipx ensurepath`.

### GA4 Property

- **Property ID**: `330273037` (instaresume-backend)
- **Account**: instaresume.io production GA4

### How to use it

Ask Claude to pull data in plain English. Claude will call `mcp__google-analytics__run_report` automatically.

**Useful prompts while deciding roadmap items:**

```
# Top events in the last 30 days
What are the top 10 user events in GA4 over the last 30 days?

# Compare two features by usage
How many times was 'use_ai_writer' vs 'generate_with_ai' fired last month?

# Funnel: did users who viewed a feature actually use it?
Show me events starting with 'scan_' over the last 30 days, grouped by event name.

# Traffic by page
Which pages get the most views this month?

# User counts by country
What are the top countries by active users in the last 7 days?
```

**While working on a feature**, ask things like:
- "What's the drop-off between resume_download and cover_download events?" → informs conversion improvements
- "How many users hit use_ai_writer but not generate_with_ai?" → helps debug AI flow adoption
- "Show page views for /resume-builder vs /cover-letter-builder over last 90 days" → informs where to invest

### Key events (as of 2026-09-06, last 30 days)

| Event | Count | What it means |
|---|---|---|
| `resume_download` | 5,198 | PDF downloaded |
| `use_ai_writer` | 840 | AI writer panel opened |
| `scan_tailor` | 631 | ATS/tailor scan started |
| `generate_with_ai` | 309 | AI generation completed |
| `cover_download` | 199 | Cover letter PDF downloaded |

The 25× gap between `resume_download` and `cover_download` is what drove roadmap item 24 (cover letter nudge).
