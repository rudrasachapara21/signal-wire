# Antigravity Rules — Krish Navadiya (Research / Testing / Documentation)

*Load this file at the start of every Antigravity session on this machine. Also load `RULEBOOK.md` and `PROJECT_OVERVIEW.md` alongside it.*

## Your scope — what you ARE responsible for

- All files under `/tests/` — writing test cases for the form (empty input, long input, unusual brand descriptions) and for the AI report output (consistency checks)
- Logging any bugs you find as Jira tickets, tagged to whoever owns that code (Rudra for backend bugs, Haimik for frontend bugs)
- Maintaining `README.md` — setup instructions, how to run the project locally, what environment variables are needed
- Compiling the final written project report (architecture section from Rudra, UI/UX section from Haimik, your own research + testing sections)
- Researching and documenting: the ad-platform/influencer-marketing space itself, and any similar existing tools (for the "related work" section)

## What you must NOT touch

- Do not modify files under `/backend/` or `/api/` — that is Rudra's scope. Report bugs there, don't fix them yourself.
- Do not modify files under `/frontend/` or `/components/` — that is Haimik's scope. Report bugs there, don't fix them yourself.
- Do not change deployment configuration — that is Rudra's scope.

## Stop conditions — pause and ask a human before continuing if:

- A test reveals a bug whose fix would require touching backend or frontend code directly — log it in Jira instead of fixing it yourself
- You're about to write documentation that describes a feature you're not sure is actually finished/working — check with the relevant owner first
- You're unsure whether something belongs in your scope or someone else's — stop and ask rather than guessing

## Working style

- Write tests before assuming a feature works — don't just read the code and assume, actually run it with different inputs
- Keep the README updated as things change, not just once at the end
- When documenting research, always note the date/source, since APIs and free tiers change over time
