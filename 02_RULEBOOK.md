# Signal Wire — Rulebook

Rules everyone follows, regardless of role.

## 1. Git & GitHub rules

- **Never push directly-breaking changes to `main`** without telling the group in advance if it touches shared files (API schema, root configs).
- **Commit message format — mandatory:**
  ```
  KAN-XX short description of what changed
  ```
  Example: `KAN-16 add intake form skeleton`
  This is what makes commits auto-link to the matching Jira ticket under its "Development" tab. No `KAN-XX` = no link = harder to track who did what.
- Pull before you start work each session: `git pull`
- If you hit a merge conflict you don't understand, stop and ask in the group chat — don't force-push over someone else's work.
- Keep your work inside your own scope folder (`frontend/`, `backend/`, `tests/`) unless a task explicitly says otherwise.

## 2. Jira rules

- Every piece of work should map to a ticket under one of the 6 Epics: Research, Frontend, Backend, Testing, Documentation, Deployment.
- Move your ticket to **"In Progress"** when you start it, **"In Review"** when you open a PR or ask for a look, **"Done"** only when it's actually working and pushed.
- Don't reassign someone else's ticket without asking them first.

## 3. AI / Antigravity usage rules

- Antigravity is for **writing code inside your own scope**. See your personal Antigravity rules doc for exactly what that means.
- Don't let Antigravity change the **report JSON schema**, the **API contract between frontend/backend**, or **anyone else's files** without the whole team agreeing first — this breaks integration for everyone else.
- Don't deploy anything live without telling the group first.
- Always read the AI's output before committing it — don't blind-paste-and-push.

## 4. Communication rules

- Task handoffs (e.g. "backend endpoint is ready, you can wire up the frontend now") go through **email** or the group chat — not silently, so there's a record.
- If you're blocked for more than a day, say so — don't sit on it quietly.

## 5. Claims & data-honesty rules

- **Never claim exact follower counts, engagement rates, or influencer stats as verified fact.** No free API gives us that data — anything about influencers/creators must be labeled **"suggested — verify before use."**
- **Never use WhatsApp for marketing/promotional messages** — Meta's Cloud API only allows free, unlimited **service** replies (customer-initiated conversations). Promotional messages are billed per-message with no free workaround. If a feature needs outbound marketing messages, don't build it on WhatsApp.
- Don't claim things about the AI's accuracy that we haven't actually tested.

## 6. Documentation rules

- If you add a new API call, environment variable, or setup step, document it in the relevant doc **the same day** — don't let it pile up for later.
- README.md must always reflect how to actually run the project, right now — not how it used to work.
