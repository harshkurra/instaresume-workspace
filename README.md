# instaresume-workspace

Claude Code workspace for [instaresume.io](https://instaresume.io) — an AI-powered resume builder.

This repo holds the workspace-level config, roadmap, and setup scripts. The actual product code lives in four independent repos cloned by `setup.sh`.

## Getting Started

```bash
git clone https://github.com/harshkurra/instaresume-workspace.git
cd instaresume-workspace
chmod +x setup.sh && ./setup.sh
```

This clones all four repos into the workspace:

| Repo | Purpose |
|------|---------|
| `resume-builder-frontend/` | React 17 web app — instaresume.io + partner white-label build |
| `resume-builder-service/` | NestJS 8 REST API — deployed on Google App Engine |
| `resume-template-builder/` | Legacy template package (`@harshkurra/resume-template-builder`) |
| `resume-template-builder-v2/` | Current template package (`@harshkurra/resume-template-builder-v2`) — use this for new templates |

## Running Locally

```bash
# Frontend (points to staging backend by default)
cd resume-builder-frontend && yarn install && yarn start

# Backend
cd resume-builder-service && npm install && npm run start:dev

# Template development (v2)
cd resume-template-builder-v2/packages && yarn install && yarn watch
cd resume-builder-frontend-v2/demo-app && yarn install && yarn dev
```

## Repo Structure

```
instaresume-workspace/
├── CLAUDE.md       # Codebase guidance for Claude Code
├── ROADMAP.md      # Product roadmap with status tracking
├── README.md       # This file
├── setup.sh        # Bootstraps all sub-repos on a new machine
└── .claude/
    └── settings.json   # Shared Claude Code permissions
```

Each sub-repo has its own `CLAUDE.md` with detailed architecture notes, commands, and conventions.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full list of planned improvements with priority and status.

## Environments

| Environment | Frontend | Backend | Firebase project |
|-------------|----------|---------|-----------------|
| Production | Firebase Hosting (`firebase use prod`) | `gcloud app deploy app.yaml` | `instaresume-backend` |
| Staging | Firebase Hosting (`firebase use dev`) | `gcloud app deploy app.staging.yaml` | `resume-builder-d9cb3` |
