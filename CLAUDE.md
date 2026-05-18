# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Overview

This workspace contains two repos for **InstaResume.io** — an AI-powered resume builder product:

| Repo | Stack | Purpose |
|---|---|---|
| `resume-builder-frontend/` | React 17, MUI v5, Firebase, CRACO | Web app (instaresume.io) + partner white-label build |
| `resume-builder-service/` | NestJS 8, Firebase Admin, OpenAI | REST API backend deployed on Google App Engine |

Each repo has its own `CLAUDE.md` with full details. Read both when working across the stack.

## How the Two Repos Connect

- The frontend calls the backend at `AppConfig.serviceUrl` (configured per environment in `resume-builder-frontend/src/config/config.js`)
  - Dev/staging: `https://staging-dot-instaresume-backend.el.r.appspot.com/api/v1/`
  - Production: `https://api.instaresu.me/api/v1/`
- All authenticated API calls send a Firebase ID token as `Authorization: Bearer <token>`; the backend's `FirebaseAuthMiddleware` validates it using `firebase-admin`
- Both repos use the **same Firebase project** per environment: `instaresume-backend` (prod) / `resume-builder-d9cb3` (dev/staging)
- Both repos use the **same resume template package**: `@harshkurra/resume-template-builder` — the frontend renders live previews in the browser, the backend renders PDFs server-side using the same templates

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
