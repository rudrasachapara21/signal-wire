# Prompt Guide — How the Claude ↔ Antigravity Loop Works

*Read this last, only once you're ready to actually start building.*

## The workflow, step by step

1. Open a fresh Claude chat.
2. Attach/paste these files: `PROJECT_OVERVIEW.md`, `RULEBOOK.md`, `TASK_DIVISION.md`, and your own `antigravity-rules-<yourname>.md`.
3. Paste your starter prompt (below — pick the one with your name).
4. Claude will give you back a specific, scoped instruction — this is what you paste into Antigravity.
5. Run it in Antigravity. Let it plan, code, and verify.
6. Copy whatever Antigravity reports back (its summary/output/errors) and paste it into the same Claude chat.
7. Claude reads that output and gives you the next step's prompt.
8. Repeat 5–7 until your current task is done, then commit + push to GitHub, update Jira, and move to the next task.

**Why this works:** Claude acts as the "thinking" layer that keeps track of the plan and checks Antigravity's output makes sense; Antigravity is the "hands" that actually writes and tests code. Keeping the same reference documents in every session is what keeps three separate people's AI sessions consistent — not any special setting.

## A few ground rules for this loop

- If Antigravity's output touches a file outside your scope (see your `antigravity-rules-*.md`), stop and paste that concern into Claude before continuing — don't let it proceed.
- If a Claude chat starts feeling "off" or forgetful after a long session, don't fight it — open a new chat and re-paste the four reference files plus a one-line summary of what you were doing. It'll pick the thread back up.
- Always read Antigravity's plan/summary before letting it proceed to the next step — don't blindly approve.

---

## Starter Prompt — Rudra (Backend / API / Deployment)

```
I'm Rudra, Project Owner on our college project "Signal Wire" — an AI ad-strategy
advisor tool. I'm attaching our Project Overview, Rulebook, Task Division, and my
own Antigravity scope file.

My current task is: [describe the specific task from TASK_DIVISION.md you're
starting, e.g. "build the function that sends brand info to Gemini API and Tavily
API and returns a parsed JSON report"].

Please give me a clear, scoped instruction I can paste directly into Antigravity
to start this task. Keep it specific to my scope only (backend/API/deployment) —
don't include frontend or testing work in the instruction.
```

## Starter Prompt — Haimik (Frontend / UI)

```
I'm Haimik, working on our college project "Signal Wire" — an AI ad-strategy
advisor tool. I'm attaching our Project Overview, Rulebook, Task Division, and my
own Antigravity scope file.

My current task is: [describe the specific task from TASK_DIVISION.md you're
starting, e.g. "build the report output screen showing platform fit, demand
signal, budget split, and hooks"].

Please give me a clear, scoped instruction I can paste directly into Antigravity
to start this task. Keep it specific to my scope only (frontend/UI) — don't
include backend or testing work in the instruction.
```

## Starter Prompt — Krish (Research / Testing / Documentation)

```
I'm Krish, working on our college project "Signal Wire" — an AI ad-strategy
advisor tool. I'm attaching our Project Overview, Rulebook, Task Division, and my
own Antigravity scope file.

My current task is: [describe the specific task from TASK_DIVISION.md you're
starting, e.g. "write test cases for the intake form covering empty and unusual
inputs" or "draft the README setup instructions"].

Please give me a clear, scoped instruction I can paste directly into Antigravity
(or a research/documentation task list if it's not a coding task) to start this
task. Keep it specific to my scope only (research/testing/documentation) — don't
include backend or frontend build work in the instruction.
```
