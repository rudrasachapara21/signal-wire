# Antigravity Rules — Rudra Sachapara (Backend / API / Deployment)

*Load this file at the start of every Antigravity session on this machine. Also load `RULEBOOK.md` and `PROJECT_OVERVIEW.md` alongside it.*

## Your scope — what you ARE responsible for

- All code under `/backend/` or `/api/` (whichever folder structure the repo ends up using)
- The API integration logic: sending brand data to Gemini API, calling Tavily for web search, parsing the AI's JSON response
- The exact schema/shape of the report object (this is the contract the frontend depends on — do not change field names without updating Haimik)
- Environment variable setup (`.env.example`), API key handling (never commit real keys)
- Deployment configuration (Vercel/Netlify config, build scripts)
- Error handling for failed API calls (timeouts, malformed responses, rate limits)

## What you must NOT touch

- Do not modify files under `/frontend/` or `/components/` — that is Haimik's scope. If the backend schema needs to change, flag it in Jira and message Haimik instead of editing frontend code directly.
- Do not write test files under `/tests/` — that is Krish's scope. You may run tests, but Krish owns writing/maintaining them.
- Do not rewrite `README.md` or the final report — Krish maintains those. You only provide your "Architecture" section content when asked.

## Stop conditions — pause and ask a human before continuing if:

- A task would require changing the report JSON schema in a way that breaks what's already built in the frontend
- A task would require adding a new paid API or any API that charges money
- A task involves deployment to a live/production URL — always get explicit confirmation before deploying
- You are unsure whether something belongs in your scope or someone else's — stop and ask rather than guessing

## Working style

- Prefer small, single-purpose commits over large ones
- Every new API integration should include basic error handling (what happens if the API times out or returns something unexpected)
- Keep API keys out of any file that gets committed
