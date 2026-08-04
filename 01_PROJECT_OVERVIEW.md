# Signal Wire — Project Overview

## What we're building
Signal Wire is an AI-powered ad-strategy advisor. A business owner enters:
- Brand name
- Brand description
- (Optional) budget

The tool then uses AI + live web search to recommend:
1. Best ad platform(s) for that business
2. Demand/seasonality signal
3. Competitor snapshot
4. Best content formats
5. Influencer/creator categories to target
6. Budget split across platforms
7. Ready-to-use ad hooks/copy

Theme: a "wire dispatch / telex briefing" visual style — dark green, gold, and rust color palette, typewriter-style fonts (Special Elite + IBM Plex).

## Why this matters (for our presentation)
Small business owners in India rarely have a clear, data-backed answer to "where should I spend my ad budget?" Signal Wire turns that decision into a 30-second AI-generated briefing.

## Tech stack (all free-tier, no card required)
| Purpose | Service | Free limit |
|---|---|---|
| AI reasoning | Gemini API | ~1,500 requests/day |
| Web research | Tavily API | 1,000 search credits/month |
| Ad cost benchmarks | Meta Marketing API + Google Ads API | Free, no per-call charge |
| Email (if used) | Gmail API | ~500 emails/day |
| Instagram data | Instagram Graph API | Own connected business account only |
| WhatsApp | Meta Cloud API | Service replies only — NOT for marketing (see Rulebook) |

No free influencer-analytics API exists — influencer/creator category suggestions come from Tavily search + AI inference, and must always be labeled "suggested — verify before use."

## Where everything lives
- **Code:** https://github.com/rudrasachapara21/signal-wire
- **Task tracking:** https://rudrasachapara21.atlassian.net/jira/software/projects/KAN/boards/2
- **Local coding tool:** Antigravity (Google's free agentic IDE) — each person codes their part here
- **Planning/prompt tool:** Claude — used to turn docs into a scoped Antigravity prompt, and to unblock issues

## Current status (as of setup)
- ✅ GitHub repo live, all 3 members added as collaborators
- ✅ Jira board live with 6 Epics and 26 tasks, all assigned
- ✅ GitHub ↔ Jira integration connected (commits auto-link to tickets)
- ⏳ Coding not yet started — first task up is KAN-21 (Gemini API integration)

## Team & ownership
| Person | Owns |
|---|---|
| **Rudra Sachapara** (Project Owner) | Architecture, Backend, Deployment, final integration |
| **Haimik Kalathiya** | Frontend/UI |
| **Krish Navadiya** | Research, Testing, Documentation |
