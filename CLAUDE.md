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
