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
- "What's the drop-off between resume_download_click and cover_download_click?" → conversion gap
- "Show tailor_dialog_abandoned grouped by stepName" → where users quit the tailor flow
- "How many jd_tab_fetch_link vs jd_tab_paste_text events last 7 days?" → which JD input method users prefer

### Key events tracked

| Event | What it means |
|---|---|
| `resume_download_click` | Authenticated user downloaded a resume PDF |
| `resume_download_click_demo` | Unauthenticated (demo) user downloaded a resume PDF |
| `cover_download_click` | Cover letter PDF downloaded |
| `bio_data_download_click` | Bio data PDF downloaded |
| `download_dialog_shown` | Download dialog opened |
| `download_completed` | PDF rendered and downloaded successfully (fired from DownloadDialog) |
| `download_failed` | PDF download failed (fired from DownloadDialog) |
| `download_dialog_closed` | Download dialog closed without downloading |
| `use_ai_writer` | AI writer panel opened |
| `generate_with_ai` | AI generation completed |
| `jd_tab_fetch_link` | User chose "Fetch from link" tab |
| `jd_tab_generate_from_title` | User chose "Generate from title" tab |
| `jd_tab_paste_text` | User chose "Paste text" tab |
| `jd_fetch_success` | JD extracted from URL successfully |
| `jd_fetch_error` | JD URL fetch failed (params: `reason`) |
| `jd_generated_from_title` | JD AI-generated from job title completed |
| `tailor_dialog_step_view` | User landed on a tailor dialog step (params: `step`, `stepName`) — stepName values: `personal_details`, `job_description`, `background`, `extras` |
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

---

## Cloudflare MCP

Connects to the Cloudflare account for both zones (`instaresume.io` and `instaresu.me`). Focused on the Workers/Developer Platform — use it for KV, D1, R2, Workers, and analytics.

### Setup

Requires a Cloudflare API token. To configure:

1. Go to [Cloudflare → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token
2. Add these permissions (all Zone scope, All zones):
   - **Zone → Zone WAF → Edit** (WAF custom rules)
   - **Zone → Firewall Services → Edit** (legacy firewall)
   - **Zone → Zone → Read** (zone context for Rulesets API)
   - **Zone → Analytics → Read** (traffic analytics)
   - **Zone → Cache Purge → Purge** (purge cache after deployments)
3. Copy the token and Account ID (`8eda72d72824645740a5119c62956461`)
4. Add to `.mcp.json` — see `.mcp.json.example`

The server runs via `npx @cloudflare/mcp-server-cloudflare run <account_id>` — no install step, npx fetches it automatically.

### Zone IDs

| Domain | Zone ID | Purpose |
|--------|---------|---------|
| `instaresume.io` | `99cbf44ab9acad30a734b1db6348a3e1` | Frontend / marketing site |
| `instaresu.me` | `1031b0cebcc662a742b7779e75d37f18` | API domain (`api.instaresu.me`) |

### How to use it

```
# Check Cloudflare analytics for both zones
Show me Cloudflare traffic analytics for the last 3 days.

# View existing WAF rules
What WAF custom rules exist on instaresume.io?

# Create a firewall rule
Block all requests where the path contains ".env" on instaresume.io.

# Check rate limiting
What are the rate limiting rules on instaresu.me and what are their thresholds?

# Workers / KV / R2
List all Cloudflare Workers in the account.
Show me the KV namespaces.
```

### WAF rules in place

Both zones have a custom WAF rule (created Sep 23, 2026) that blocks:
`.env`, `actuator`, `index.php`, `/.git`, `proc/self`, `sendgrid.env`, `firebase-config.json`, `admin/_payload.json`

**Note:** WAF rules require Cloudflare API (curl/REST) — the MCP server tools cover Workers platform only, not WAF. Use `gcloud`-style curl commands for WAF changes.

---

## Cloud Logging (gcloud CLI)

Not an MCP server — accessed via `gcloud` CLI directly. Use it to query App Engine backend logs, count API calls per endpoint, and investigate errors.

### Prerequisites

```bash
gcloud auth login          # one-time login
gcloud config set project instaresume-backend
```

### How to use it

Ask Claude in plain English — it runs `gcloud logging read` automatically.

```
# API call counts per endpoint (last 24h)
Show me API call counts per endpoint from App Engine logs for the last 24 hours.

# Error rates
What endpoints have the highest error rates in the last 24h?

# Investigate a specific endpoint
Show me the error logs for POST /api/v1/secure/ats-checker/resume/score today.

# Bot / scanner traffic
Who are the bots hitting our server? Show IPs and user agents.

# Latency
What are the slowest API endpoints by average latency this week?
```

### Key details

- **Project**: `instaresume-backend` (production)
- **Log name**: `appengine.googleapis.com/request_log`
- **Resource type**: `gae_app`, module `default`
- All IPs in logs are **Cloudflare edge IPs** (not real client IPs) — real client IP is in the `cf-connecting-ip` header, which App Engine request logs don't capture
- Country data for API calls → use GA4 or Cloudflare Analytics instead

---

## What You Can Do From the CLI — Quick Reference

This is a summary of everything achievable via natural language prompts in Claude Code across all integrations:

### Product Analytics (GA4)
| Goal | Example prompt |
|------|---------------|
| Traffic trends | "How is traffic trending over the last 7 days vs the prior week?" |
| Feature adoption | "How many users triggered resume_download_click last month?" |
| Funnel drop-off | "Show the tailor dialog funnel by step for last 30 days" |
| JD input preference | "Which JD input method are users picking — fetch link, paste, or generate?" |
| Error tracking | "Show jd_fetch_error breakdown by reason for last 7 days" |
| Top pages | "Which pages get the most views this month?" |
| Geo breakdown | "Top countries by active users in the last 7 days" |
| Traffic spike investigation | "Traffic feels up — what's the trigger?" |

### Infrastructure & Logs (gcloud)
| Goal | Example prompt |
|------|---------------|
| API usage | "Show API call counts per endpoint for the last 24h" |
| Error investigation | "What errors is the ATS checker endpoint throwing?" |
| Bot identification | "Who are the bots hitting our server?" |
| Latency audit | "What are the slowest endpoints today?" |
| Request volume | "How many requests did /api/v1/live/resume get today?" |

### Security & Cache (Cloudflare via API)
| Goal | Example prompt |
|------|---------------|
| View WAF rules | "What WAF rules are active on instaresume.io?" |
| Create block rule | "Block requests where path contains X on instaresume.io" |
| Check rate limits | "What are the rate limiting thresholds on instaresu.me?" |
| Traffic overview | "Show Cloudflare analytics for the last 3 days — requests, threats, cache rate" |
| **Purge cache** | **"Purge Cloudflare cache for instaresume.io"** — run after every frontend deployment |

### Customer Feedback (Canny)
| Goal | Example prompt |
|------|---------------|
| Top requests | "Show me the top 10 open feature requests by votes" |
| Status check | "List all posts with status planned" |
| Create post | "Create a Canny post titled X on board Y" |
| Read feedback | "What are users saying about the resume templates?" |
