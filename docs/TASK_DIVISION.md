# Task Division — Signal Wire Project

*Roles are split so each person owns a full vertical (not just one narrow job), so workload stays roughly equal and each person has something substantial to present individually.*

---

## Rudra Sachapara — Project Owner (Architecture, Backend/API, Deployment)

**Owns:** overall system design, all API integrations, final build, deployment

| Epic | Tasks |
|---|---|
| Research | Finalize API choices (Gemini, Tavily), confirm free-tier limits, document architecture decisions |
| Backend | Build the API-calling logic (send brand info → Gemini + Tavily → structured JSON report); handle errors/retries |
| Backend | Design the report data schema (the exact fields every report must contain) shared with Haimik so frontend matches |
| Deployment | Set up hosting (Vercel/Netlify), environment variables, domain/link |
| Deployment | Final integration — merge frontend + backend, do the last end-to-end check before demo |
| Documentation | Write the "Architecture" section of the final report |

## Haimik Kalathiya — Frontend / UI

**Owns:** everything the user actually sees and interacts with

| Epic | Tasks |
|---|---|
| Research | Look at 2-3 similar tools' UI (not to copy, just to see what layout patterns work) |
| Frontend | Build the intake form (brand name, description, budget) |
| Frontend | Build the loading state (while AI + search runs) |
| Frontend | Build the report/output screen (platform fit, demand signal, competitors, content formats, creator types, budget split, hooks) — matches the schema Rudra defines |
| Frontend | Make it responsive (works on mobile + laptop, since this will be demoed on a projector and possibly a phone) |
| Documentation | Write the "UI/UX decisions" section of the final report |

## Krish Navadiya — Research, Testing, Documentation

**Owns:** the credibility and polish of the project — proving it actually works and is well explained

| Epic | Tasks |
|---|---|
| Research | Research the ad-platform and influencer-marketing space itself (what actually helps a small brand decide where to advertise) — this feeds the AI prompt design |
| Research | Research competitor tools/products (if any similar tool exists) for the final report's "related work" section |
| Testing | Test the form with different inputs (empty fields, very long descriptions, unusual brand types) and log bugs in Jira |
| Testing | Test the AI report output for consistency (run the same brand twice, check if answers stay reasonable) |
| Documentation | Maintain the main `README.md` — setup steps, how to run the project locally |
| Documentation | Write the final project report (compiling everyone's sections, formatting, proofreading) |
| Documentation | Prepare the presentation/demo script for submission day |

---

## Shared responsibility (all three)

- Attending weekly check-ins / standups
- Updating your own Jira tasks (status + comments)
- Reviewing each other's Pull Requests before merge
- Contributing to the final presentation slides (each explains their own part)

## Suggested Jira Epics to create

1. `Research`
2. `Frontend`
3. `Backend`
4. `Testing`
5. `Documentation`
6. `Deployment`

Each task above becomes a Jira ticket under its Epic, assigned to the right person, with a due date.
