# Signal Wire — AI Ad Strategy Advisor

A tool that takes a brand's name, description, and budget, and returns an AI-generated,
web-search-backed advertising strategy report: best platforms, demand signal,
competitor snapshot, content formats, creator/influencer categories, budget split,
and ad hooks.

## Team

- Rudra Sachapara — Project Owner (Backend / API / Deployment)
- Haimik Kalathiya — Frontend / UI
- Krish Navadiya — Research / Testing / Documentation

## Read this first

Before writing any code, read the docs in this order:

1. [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — what we're building and why
2. [`docs/RULEBOOK.md`](docs/RULEBOOK.md) — git, coding, and communication rules
3. [`docs/TASK_DIVISION.md`](docs/TASK_DIVISION.md) — who owns what
4. Your own `docs/antigravity-rules-<yourname>.md`
5. [`docs/PROMPT_GUIDE.md`](docs/PROMPT_GUIDE.md) — the Claude ↔ Antigravity workflow

## Project structure

```
signal-wire/
├── frontend/           # React app — Haimik's scope
│   └── src/
│       ├── components/ # ReportCard, PlatformFit, BudgetSplitBar, etc.
│       └── pages/       # IntakeForm page, Report page
├── backend/            # API integration — Rudra's scope
│   └── src/
│       ├── routes/      # e.g. /analyze endpoint
│       └── services/    # gemini.js, tavily.js, reportSchema.js
├── tests/              # Krish's scope
├── docs/               # All planning documents (this is the source of truth)
├── .env.example        # Copy to .env and fill in your own keys — never commit .env
└── .gitignore
```

## Setup (once code exists)

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your own `GEMINI_API_KEY` and `TAVILY_API_KEY`
3. `cd backend && npm install`
4. `cd frontend && npm install`
5. Run backend and frontend dev servers (commands to be added here once the base app exists)

## Status

Skeleton only — no application code yet. See `docs/TASK_DIVISION.md` for what comes next.
