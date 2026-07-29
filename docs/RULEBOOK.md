# Rulebook — Common Rules for All Three Members

*Every one of us follows this file exactly the same way, regardless of which laptop or Claude account we're using. If our AI outputs feel inconsistent, the first fix is: re-paste this file into the chat.*

---

## 1. Tech Stack (fixed — do not change without team agreement)

- Frontend: React (web) — matches Rudra's existing stack experience
- Backend/logic: Node.js (or serverless functions if we deploy on Vercel)
- AI: Gemini API (Flash / Flash-Lite models — free tier)
- Web search: Tavily API (free tier — 1,000 credits/month)
- Database (if needed for saving reports/history): Supabase
- Version control: GitHub
- Task tracking: Jira
- Coding tool: Antigravity (all three members use this, not a mix of different AI IDEs)

## 2. Git / GitHub Rules

- **One repository**, one `main` branch. Nobody pushes directly to `main`.
- Branch naming: `name/feature` — e.g. `haimik/report-ui`, `krish/testing-setup`, `rudra/api-integration`
- Commit message format: `[JIRA-ID] short description` — e.g. `[SW-12] add budget split component`
- Before merging into `main`: open a Pull Request, at least one other teammate reviews it
- Never commit API keys or `.env` files — use `.env.example` with placeholder values only
- Pull latest `main` before starting new work each day to avoid merge conflicts

## 3. Coding Style Rules

- Use clear, descriptive variable/function names (no `x1`, `temp2`)
- One component/function should do one clear thing
- Comment only where the "why" isn't obvious — don't over-comment obvious lines
- Keep files organized by feature, not by file type dump (e.g. `/report/ReportCard.jsx`, not everything in one `/components` folder unsorted)
- Every new feature branch should include at least a basic manual test note in its PR description ("tested with X input, got Y output")

## 4. Jira Rules

- Every task must sit under one of these Epics: `Research`, `Frontend`, `Backend`, `Testing`, `Documentation`, `Deployment`
- Task statuses: `To Do → In Progress → In Review → Done`
- Move a task yourself when you start/finish it — don't wait for someone else to update it
- Every task assigned to a person must have a due date

## 5. Communication Rules

- When a task is assigned: sender emails the assignee with task name, Jira link, and expected date
- When a task is completed: assignee emails back "Completed: [task name] — [Jira link]" and moves the Jira card to Done
- Any blocker (stuck on something for more than a day) gets flagged to Rudra (Project Owner) immediately — don't sit on it silently

## 6. AI Usage Rules (Claude + Antigravity)

- All three of us use **Claude** for planning/prompt-generation, and **Antigravity** for actually writing code — no mixing in other AI coding tools, to keep code style consistent
- Before starting a new Claude chat session, paste in: this Rulebook + the Project Overview + your own task file, so the AI has full context again
- Antigravity should only work within the boundaries defined in your personal `antigravity-rules-<yourname>.md` file — if it tries to touch another member's area, stop it and flag it in Jira/standup
- Never let AI auto-deploy or auto-push to `main` without a human reviewing the diff first

## 7. What we will NOT do (guardrails)

- We will not use WhatsApp for marketing/promotional auto-messages — Meta charges for every such message, and there is no free tier for it. WhatsApp is fine for structured customer-reply automation only, if we get to that stage.
- We will not claim precise influencer follower/engagement stats unless the API/source we used actually provides verified numbers — anything sourced from general web search should be labeled "suggested — verify before use."
- We will not skip documentation "for later" — write it as we go, not at the end.
