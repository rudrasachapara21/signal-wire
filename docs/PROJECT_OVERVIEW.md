# Project Overview — Signal Wire (Ad Strategy Advisor)

*This document is NOT for coding. It is for all three of us to understand what we are building, why, and in what order. Read this before touching Jira, GitHub, or Antigravity.*

**Team:**
- Rudra Sachapara — Project Owner
- Haimik Kalathiya — Team Member
- Krish Navadiya — Team Member

---

## 1. What is this project?

Signal Wire is a web-based tool for small business owners. A business owner enters their brand name, a short description of what they sell, and (optionally) their monthly ad budget. The tool then:

1. Analyses the brand using AI
2. Searches the live web for current information
3. Returns a report telling the business owner:
   - Which advertising platform(s) suit them best (Instagram, YouTube, Meta Ads, Google Ads, etc.) and why
   - Where demand for their product is currently highest (region, age group, timing/season)
   - Who else (competitors) is currently advertising in their space
   - What content formats work in their category (Reels, unboxing, GRWM, etc.)
   - What type of influencer/creator category fits their brand
   - How to split their ad budget across organic content, paid ads, and influencer collaborations
   - Sample ad hooks/captions to test first

## 2. Why does this project matter?

Most small business owners don't know where to advertise or who to work with. They either guess, or they pay expensive agencies. This tool gives them a fast, AI-generated starting point for free, using only information that is currently, publicly available on the web.

## 3. How does it actually work, step by step?

1. User fills a form (brand name, description, budget)
2. That information is sent to an AI model (Gemini API)
3. The AI is also given access to a web search tool (Tavily API) so it can check current, real information instead of guessing from old training data
4. The AI returns a structured report (platforms, demand, competitors, content formats, creator types, budget split, hooks)
5. The report is displayed to the user in a clean, readable format
6. (Optional, later phase) The user can get automated follow-up — e.g. an email summary, or reminders — using Gmail API / Instagram messaging / WhatsApp (only for replies, not cold marketing — see Rulebook for why)

## 4. What are the main parts of the project?

| Part | What it means in plain words |
|---|---|
| Research | Studying what APIs exist, what's free, what a good ad-advisor should actually tell a user, and what similar tools already exist |
| Frontend / UI | The actual screen the user sees and interacts with — the form and the report |
| Backend / API integration | Connecting the app to Gemini (AI), Tavily (search), and other APIs so real data flows in |
| Testing | Making sure the form works, the AI response is parsed correctly, and nothing breaks when a user enters unusual input |
| Documentation | Writing down how the project works, how to set it up, and what each part does — for our own project report and for anyone else who reads our code later |
| Deployment | Putting the finished project somewhere it can actually be opened and used (a live link), not just running on one person's laptop |

## 5. What tools are we using to manage the work?

- **GitHub** — where all our code lives together, combined from all three laptops
- **Jira** — where our tasks are tracked (who is doing what, and its current status)
- **Email** — for professional-style task handoffs ("assigned", "completed") between the three of us
- **Antigravity** — the AI coding tool each of us will use locally to actually write code, guided by the rules files we're creating
- **Claude** — used to plan, generate the Antigravity instructions/prompts, and review outputs at each step

## 6. What does "done" look like for this college project?

By the end, we should be able to show:
1. A research summary (what we investigated, what we chose, and why)
2. A working app (frontend + backend connected to real APIs)
3. Evidence of testing (what we tested, what bugs we found and fixed)
4. Full documentation (this set of files, plus a final project report)
5. A deployed, working link the professor can open and try themselves
6. A clear record (Jira + GitHub commits) showing who did what

## 7. Reading order for the team

1. This file (`PROJECT_OVERVIEW.md`)
2. `RULEBOOK.md`
3. `TASK_DIVISION.md`
4. Your own `antigravity-rules-<yourname>.md`
5. `PROMPT_GUIDE.md` — only once you're ready to actually start working
