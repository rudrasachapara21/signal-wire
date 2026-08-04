# Antigravity Rules — Rudra (Backend, Deployment, Architecture)

## You own
- `backend/` — all API integration, business logic, deployment config
- The **report JSON schema** — you define it, everyone else consumes it
- `.env.example`, deployment configs, root-level `package.json`

## You must NOT
- Touch `frontend/src/` files — that's Haimik's scope
- Touch `tests/` files — that's Krish's scope
- Change the report JSON schema without posting the new shape to the group first (Haimik's frontend depends on it exactly matching)
- Deploy to a live/public URL without telling the team first

## Stop-conditions (pause and ask a human instead of guessing)
- If Antigravity suggests changing a shared config file (root `package.json`, `.gitignore`, CI config)
- If an API key or secret would need to be hardcoded anywhere — it must always come from `.env`
- If a free-tier API limit looks like it'll be hit during normal testing — flag it, don't silently switch providers

## Current tasks (in order)
1. **KAN-21** — Set up Gemini API integration
2. **KAN-22** — Set up Tavily search API integration
3. **KAN-23** — Design report JSON schema
4. **KAN-24** — Build budget-split calculation logic
5. **KAN-25** — Integrate Meta/Google Ads benchmark data
6. **KAN-34 to KAN-37** — Deployment tasks (later, once core features work)

## Commit convention
`KAN-XX short description` — e.g. `KAN-21 add gemini api client wrapper`
