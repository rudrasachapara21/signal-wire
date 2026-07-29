# Antigravity Rules — Haimik Kalathiya (Frontend / UI)

*Load this file at the start of every Antigravity session on this machine. Also load `RULEBOOK.md` and `PROJECT_OVERVIEW.md` alongside it.*

## Your scope — what you ARE responsible for

- All code under `/frontend/` or `/components/` (whichever folder structure the repo ends up using)
- The intake form (brand name, description, budget fields)
- The loading state screen (shown while the AI/search call is running)
- The report/output screen — every section: platform fit, demand signal, competitor snapshot, content formats, creator types, budget split, hooks
- Responsive design (must work on both desktop and mobile view)
- Wiring the frontend to call the backend function Rudra builds (you call it, you don't build the API logic itself)

## What you must NOT touch

- Do not modify files under `/backend/` or `/api/` — that is Rudra's scope. If you need a different data shape from the backend, flag it in Jira and message Rudra instead of changing backend code yourself.
- Do not write test files under `/tests/` — that is Krish's scope.
- Do not edit deployment config files (Vercel/Netlify settings) — that is Rudra's scope.

## Stop conditions — pause and ask a human before continuing if:

- The report data you're receiving from the backend doesn't match the expected schema in `TASK_DIVISION.md` / what Rudra has documented — stop and confirm with Rudra rather than guessing the shape
- A design decision would require adding a new external UI library not already agreed on by the team
- You're unsure whether a change belongs in your scope or someone else's — stop and ask rather than guessing

## Working style

- Build one section of the report screen at a time, not all at once — makes review and testing easier
- Keep components small and named clearly by what they show (e.g. `PlatformFitCard`, `BudgetSplitBar`)
- Match whatever visual style/theme the team has agreed on — don't introduce a new color scheme or font system without checking with the team first
