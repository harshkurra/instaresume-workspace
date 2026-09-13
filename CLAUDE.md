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

## MCP Integrations

The workspace has MCP servers configured in `.mcp.json` (gitignored — machine-local). They let Claude query live data from external services directly in the conversation without manual exports. All servers start automatically when you open this workspace in Claude Code.

---

## Google Analytics 4 MCP

Connects to the instaresume.io GA4 property via a service account. Use it to pull live usage data and make data-driven product decisions.

### Setup

Requires a service account key at:

```
config/gcloud/analytics-sa.json   ← gitignored, never commit
```

To set it up on a new machine:
1. Go to [Google Cloud Console](https://console.cloud.google.com) → IAM & Admin → Service Accounts
2. Find the analytics service account (`analytics-mcp@...`) and download a JSON key
3. Place it at `config/gcloud/analytics-sa.json`
4. The server uses `pipx run analytics-mcp` (official Google package). If `pipx` is missing: `brew install pipx && pipx ensurepath`

### GA4 Property

- **Property ID**: `330273037` (instaresume-backend)
- **Account**: instaresume.io production GA4

### How to use it

Ask Claude in plain English — it calls `mcp__google-analytics__run_report` automatically.

```
# Top events in the last 30 days
What are the top 10 user events in GA4 over the last 30 days?

# Compare feature usage
How many times was 'use_ai_writer' vs 'generate_with_ai' fired last month?

# Funnel analysis
Show me the tailor dialog funnel: tailor_dialog_step_view by stepName for last 30 days.

# JD fetch error breakdown
What are the jd_fetch_error counts grouped by reason param in the last 7 days?

# Traffic by page
Which pages get the most views this month?

# Top countries
What are the top countries by active users in the last 7 days?
```

**While working on a feature:**
- "What's the drop-off between resume_download and cover_download?" → conversion gap
- "Show tailor_dialog_abandoned grouped by stepName" → where users quit the tailor flow
- "How many jd_tab_fetch_link vs jd_tab_paste_text events last 7 days?" → which JD input method users prefer

### Key events tracked

| Event | What it means |
|---|---|
| `resume_download` | PDF downloaded |
| `use_ai_writer` | AI writer panel opened |
| `scan_tailor` | ATS/tailor scan started |
| `generate_with_ai` | AI generation completed |
| `cover_download` | Cover letter PDF downloaded |
| `jd_tab_fetch_link` | User chose "Fetch from link" tab |
| `jd_tab_generate_from_title` | User chose "Generate from title" tab |
| `jd_tab_paste_text` | User chose "Paste text" tab |
| `jd_fetch_success` | JD extracted from URL successfully |
| `jd_fetch_error` | JD URL fetch failed (params: `reason`) |
| `tailor_dialog_step_view` | User landed on a tailor dialog step (params: `step`, `stepName`) |
| `tailor_dialog_abandoned` | User closed tailor dialog before generating (params: `atStep`, `stepName`) |

---

## Canny MCP

Connects to the Canny customer feedback board. Use it to read feature requests, check top-voted posts, and create new posts — without leaving the editor.

### Setup

Requires a Canny API key. To configure:

1. Go to [Canny Settings → API](https://instaresume.canny.io/admin/settings/api) and copy your API key
2. Open `.mcp.json` in the workspace root and replace `YOUR_CANNY_API_KEY_HERE` with the actual key
3. Restart Claude Code to pick up the change

The server runs as a local Node.js script at `config/canny-mcp.js` — no external dependencies, no install step.

### How to use it

```
# See all boards
List all Canny boards.

# Read top feature requests
Show me the top 10 open posts on the <board name> board sorted by votes.

# Check planned items
List all posts with status "planned" on the feedback board.

# Read a specific post
Get Canny post <id>.

# Create a feature request
Create a Canny post titled "..." with details "..." on board <id>.
```

### Tools available

| Tool | What it does |
|---|---|
| `canny_list_boards` | List all boards with post counts |
| `canny_list_posts` | List posts — filter by board, status, or search term |
| `canny_get_post` | Fetch full post details by ID |
| `canny_create_post` | Create a new feature request post |
