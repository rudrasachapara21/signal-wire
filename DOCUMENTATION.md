# Signal Wire — Comprehensive Project Documentation

> **Current Version**: 1.2.1 | **Status**: Live in Production

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Feature List](#4-feature-list)
5. [Live Links](#5-live-links)
6. [Local Development Setup](#6-local-development-setup)
7. [API Endpoint Reference](#7-api-endpoint-reference)
8. [Known Limitations](#8-known-limitations)
9. [Version History](#9-version-history)

---

## 1. Project Overview

**Signal Wire** is an AI-powered digital advertising strategy platform for small and medium businesses. A user fills in a short brand profile (product name, description, target customer, and monthly ad budget), and Signal Wire generates a full, structured strategy report in under 30 seconds.

Each report includes:

- **Platform recommendations** — ranked advertising channels (Instagram, YouTube, Meta Ads, etc.) with fit scores and reasoning
- **Budget allocation breakdown** — how to split the monthly ad budget across channels
- **Creator shortlist** — real Instagram creators whose audience aligns with the brand, with direct profile links and on-demand AI-generated introductions
- **Executive summary** — an opinionated, actionable recommendation in plain language
- **30-day tactical action plan** — concrete week-by-week steps
- **Deterministic confidence score** — a transparent 0–100 score calculated from real signals (data completeness, budget realism, verified creators, market data), not LLM guesswork

Users can **refine** any report iteratively ("add TikTok", "increase Instagram budget") and **rate** reports with thumbs up/down feedback. All reports are persisted to the database, and a history view lets users review past strategies.

The application is deployed as a web app and packaged as a native Android APK.

---

## 2. Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌─────────────────────┐     ┌─────────────────────────────┐   │
│   │  Web Browser        │     │  Android App (Capacitor)    │   │
│   │  (TanStack Start /  │     │  WebView → loads live web   │   │
│   │   React SSR)        │     │  app from Render URL        │   │
│   └──────────┬──────────┘     └──────────────┬──────────────┘   │
└──────────────┼───────────────────────────────┼──────────────────┘
               │ HTTPS                          │ HTTPS
               ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RENDER CLOUD (Free Tier)                      │
│                                                                 │
│  ┌───────────────────────────┐  ┌────────────────────────────┐  │
│  │  signal-wire-frontend     │  │  signal-wire-backend       │  │
│  │  Node.js Web Service      │  │  Node.js Web Service       │  │
│  │  TanStack Start + Nitro   │  │  Express + Prisma          │  │
│  │  (SSR on port 10000)      │  │  (REST API on port 5001)   │  │
│  └───────────────────────────┘  └──────────────┬─────────────┘  │
└──────────────────────────────────────────────── ┼ ───────────────┘
                                                  │
               ┌──────────────────────────────────┤
               │                                  │
               ▼                                  ▼
┌─────────────────────────┐         ┌─────────────────────────────┐
│  Neon PostgreSQL        │         │  External AI & Search APIs  │
│  (Production Database)  │         │                             │
│                         │         │  ┌──────────────────────┐   │
│  • Users                │         │  │  Groq (Primary LLM)  │   │
│  • Reports              │         │  └──────────────────────┘   │
│  • CreatorIntros        │         │  ┌──────────────────────┐   │
│  (Prisma ORM)           │         │  │  OpenRouter (Fallback)│  │
└─────────────────────────┘         │  └──────────────────────┘   │
                                    │  ┌──────────────────────┐   │
                                    │  │  Gemini (Fallback)   │   │
                                    │  └──────────────────────┘   │
                                    │  ┌──────────────────────┐   │
                                    │  │  Tavily Search API   │   │
                                    │  └──────────────────────┘   │
                                    └─────────────────────────────┘
```

### Request Flow

```
User submits brand profile
         │
         ▼
Frontend (TanStack Start SSR)
  POST /api/analyze-brand
         │
         ▼
Backend: inputValidator.js
  (contradiction / vagueness check)
         │ 422 if invalid
         │ 200 continue if valid
         ▼
Backend: reportScoring.js
  (calculate 4-factor confidence score)
         │
         ▼
Backend: LLM Fallback Chain
  Groq → OpenRouter → Gemini
  (generate structured JSON report)
         │
         ▼
Backend: reportSchema.js (Zod)
  (validate output, auto-repair if needed)
         │
         ▼
Backend: creatorSearch.js
  (Tavily search → extract real Instagram profiles)
         │
         ▼
Response: Full strategy report
  (channels, budget, creators, plan, confidence)
         │
         ▼
User optionally saves → POST /api/reports (Neon DB)
User optionally refines → POST /api/reports/:id/refine
User optionally rates  → PATCH /api/reports/:id/feedback
```

---

## 3. Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **TanStack Start** | 1.168.x | Full-stack React SSR framework (Nitro-based, node-server preset) |
| **React** | 19 | UI component library |
| **TanStack Router** | 1.170.x | Type-safe file-based routing |
| **TanStack Query** | 5.x | Server-state management and caching |
| **Tailwind CSS** | 4.x | Utility-first CSS styling |
| **shadcn/ui + Radix UI** | Latest | Accessible component primitives |
| **Lucide React** | 0.575+ | Icon library |
| **Vite** | 8.x | Build tool and dev server |
| **Zod** | 3.x | Form and API response validation |
| **Capacitor** | Latest | Native Android WebView packaging |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | Runtime |
| **Express** | 4.x | HTTP server and routing |
| **Prisma ORM** | 5.x | Database access layer and migrations |
| **PostgreSQL** (Neon) | 16 | Production database (cloud-hosted) |
| **SQLite** | — | Local development database |
| **bcrypt** | — | Password hashing for user authentication |
| **jsonwebtoken** | — | JWT session tokens in `httpOnly` cookies |
| **express-rate-limit** | — | IP-based rate limiting for LLM endpoints |
| **Zod** | 3.x | JSON output schema validation |
| **dotenv** | — | Environment variable loading |

### AI & Search

| Service | Role |
|---|---|
| **Groq** (`compound-mini`) | Primary LLM — fast, free tier |
| **OpenRouter** (`nemotron-3.5-lightning:free`, `gemma-3-27b-it:free`) | Secondary fallback LLM |
| **Google Gemini** (`gemini-2.5-flash`) | Tertiary fallback LLM |
| **Tavily Search API** | Live web search for creator discovery and market signals |

### Infrastructure & Deployment

| Service | Role |
|---|---|
| **Render** (Free Tier) | Hosting for both web services (backend + frontend) |
| **Neon** (Free Tier) | Cloud-hosted PostgreSQL database with connection pooling |
| **GitHub** | Source code and release hosting (APK distributed as Release asset) |
| **Capacitor** | Packages the web app as an installable Android APK |

---

## 4. Feature List

### 🔐 Authentication
- Email/password signup and login
- Passwords hashed with bcrypt (12 salt rounds)
- Sessions managed via signed JWT stored in `httpOnly`, `SameSite=Strict` cookies
- `GET /api/auth/me` session check for persistent login on page reload
- Secure logout clearing the session cookie

### 🤖 AI Strategy Generation
- Accepts brand name, product description, target customer, and monthly budget
- Pre-flight input sanity check detects contradictions (e.g. "premium luxury product" + ₹500 budget) and vagueness before calling LLMs
- Multi-provider LLM fallback chain: Groq → OpenRouter → Gemini — automatically retries the next provider on rate limit or failure
- Structured JSON output enforced by Zod schema with an automatic LLM re-prompting repair loop for malformed responses
- Outputs: channels with fit scores and rationale, budget splits, ad hooks, creator shortlists, executive summary, 30-day tactical plan

### 📊 Deterministic Confidence Scoring
Four calculable factors replace arbitrary LLM-invented confidence numbers:

| Factor | Weight | Signal |
|---|---|---|
| Data Completeness | 25 pts | How substantive (not just non-empty) the input fields are |
| Budget Realism | 25 pts | Whether stated budget is viable for recommended channels |
| Verified Creator Matches | 25 pts | Ratio of creators with real, validated Instagram profile URLs |
| Market Data Availability | 25 pts | Whether Tavily search returned substantive real-world signals |

Each factor score (0–25) is calculated from real data; the LLM is told the final score, not asked to invent one.

### 🔍 Creator Search
- Tavily search queries biased toward `instagram.com` domain for relevant creator discovery
- LLM extraction prompt returns both creator name and profile URL from Tavily result metadata
- Strict regex validation (`/^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/`) filters out non-Instagram or unverified URLs
- Creator cards rendered as clickable links opening Instagram profiles in a new tab

### 💡 On-Demand AI Creator Intros
- "Know more" button triggers `POST /api/creators/intro`
- Tavily web search fetches public information about the creator
- Groq LLM synthesizes a 2–3 sentence intro covering content style, niche, and brand work
- Returns honest `"Limited public information available"` message (not hallucinated details) when search data is sparse
- Results cached in PostgreSQL (`CreatorIntro` table) with 30-day freshness window

### 💾 Report Persistence
- Authenticated users can save any generated report: `POST /api/reports`
- Reports stored in PostgreSQL with full report JSON, brand profile, and metadata
- `GET /api/reports` returns all reports for the current user, newest first
- Parent-child refinement chain preserved via `refinedFromId` foreign key

### 🔄 Report Refinement
- `POST /api/reports/:id/refine` accepts a plain-language refinement request
- Backend loads the original report and brand profile, passes them with the refinement instruction to the LLM
- Produces a new refined report record, preserving the original
- UI renders a refinement panel allowing in-line text submission

### 👍 Feedback Collection
- `PATCH /api/reports/:id/feedback` accepts `rating: "up" | "down"` and optional `feedbackNote`
- Stored per report with timestamp in PostgreSQL
- Frontend thumbs up/down buttons with visual state toggling

### 🚦 API Rate Limiting
- **Expensive endpoints** (`/api/analyze-brand`, `/api/reports/:id/refine`): 10 requests / 15 minutes / IP
- **General API** (`/api/*`): 100 requests / 15 minutes / IP
- Custom HTTP 429 JSON error responses with clear messaging

### 📱 Android App
- Packaged with Capacitor as a native Android WebView app
- Loads from the live deployed Render frontend URL (`server.url` in `capacitor.config.ts`)
- Distributed as a debug APK via GitHub Releases (not Play Store)

---

## 5. Live Links

| Resource | URL |
|---|---|
| 🌐 **Live Web App** | [https://signal-wire-frontend.onrender.com](https://signal-wire-frontend.onrender.com) |
| ⚙️ **Backend API** | [https://signal-wire-backend.onrender.com](https://signal-wire-backend.onrender.com) |
| 🏥 **Health Check** | [https://signal-wire-backend.onrender.com/api/health](https://signal-wire-backend.onrender.com/api/health) |
| 📂 **GitHub Repository** | [https://github.com/rudrasachapara21/signal-wire](https://github.com/rudrasachapara21/signal-wire) |
| 📦 **GitHub Releases** | [https://github.com/rudrasachapara21/signal-wire/releases](https://github.com/rudrasachapara21/signal-wire/releases) |
| 📱 **Android APK Download** | [https://github.com/rudrasachapara21/signal-wire/releases/download/v1.2.0-android/app-debug.apk](https://github.com/rudrasachapara21/signal-wire/releases/download/v1.2.0-android/app-debug.apk) |

> **Note**: Render free-tier services spin down after inactivity. The first request after idle may take 30–60 seconds while the service cold-starts. Subsequent requests are fast.

---

## 6. Local Development Setup

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Git**
- API keys for: Groq, OpenRouter, Google Gemini, Tavily (all offer free tiers)

### Clone & Install

```bash
git clone https://github.com/rudrasachapara21/signal-wire.git
cd signal-wire

# Install root-level dependencies (if any)
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

### Configure Environment Variables

**Backend** — create `backend/.env`:

```env
PORT=5001
NODE_ENV=development

# Database (SQLite for local dev — Prisma auto-creates dev.db)
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET=your-randomly-generated-secret-at-least-32-chars

# AI Providers (configure all three for reliable fallback)
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_gemini_api_key

# Web Search
TAVILY_API_KEY=your_tavily_api_key

# CORS (comma-separated list of allowed frontend origins)
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
```

**Frontend** — create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5001
```

### Database Setup

```bash
cd backend

# Generate Prisma client and run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to inspect data
npx prisma studio
```

### Run Development Servers

```bash
# Terminal 1 — Backend API (port 5001)
cd backend
npm run dev

# Terminal 2 — Frontend Dev Server (port 8080)
cd frontend
npm run dev
```

Open **http://localhost:8080** in your browser.

### Production Build (Frontend)

```bash
cd frontend

# Build with production backend URL
VITE_API_BASE_URL=https://your-backend.onrender.com npm run build

# Start SSR server locally (mirrors production)
node .output/server/index.mjs
```

### Android APK (Local Build)

```bash
cd frontend

# Sync web assets to Android project
npx cap sync android

# Build debug APK
cd android && ./gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

> **Requires**: Android SDK with Build-Tools 35+ and Platform 36+ installed (via Android Studio or `sdkmanager`). Java 17+ required.

---

## 7. API Endpoint Reference

### Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user. Body: `{ email, password, name }`. Returns user object + sets JWT cookie. |
| `POST` | `/api/auth/login` | Authenticate existing user. Body: `{ email, password }`. Returns user object + sets JWT cookie. |
| `GET` | `/api/auth/me` | Check current session. Returns user if JWT cookie is valid; 401 if not. |
| `POST` | `/api/auth/logout` | Clear the JWT session cookie. |

### Strategy Generation

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze-brand` | Generate a strategy report. Body: `{ brand_name, sell_type, description, ideal_customer, monthly_budget }`. **Auth required. Rate limited: 10 req/15 min/IP.** |

### Reports

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/reports` | Save a generated report to the database. Body: `{ brandName, reportData, brandProfile }`. Auth required. |
| `GET` | `/api/reports` | List all reports for the authenticated user, newest first. Auth required. |
| `GET` | `/api/reports/:id` | Fetch a single report by ID. Auth required. |
| `POST` | `/api/reports/:id/refine` | Refine an existing report. Body: `{ refinementRequest: string }`. Creates a new report linked to the parent. **Auth required. Rate limited: 10 req/15 min/IP.** |
| `PATCH` | `/api/reports/:id/feedback` | Submit feedback for a report. Body: `{ rating: "up" \| "down", feedbackNote?: string }`. Auth required. |

### Creators

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/creators/intro` | Generate an AI creator intro. Body: `{ name, niche, profileUrl? }`. Uses Tavily search + LLM. Results cached 30 days in DB. Auth required. |

### System

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint. Returns `{ status: "ok", timestamp, service, version }`. No auth required. |

---

## 8. Known Limitations

### Free-Tier Infrastructure
- **Cold starts**: Render free-tier services spin down after 15 minutes of inactivity. The first request can take 30–60 seconds to wake. Subsequent requests are fast.
- **LLM rate limits**: Groq, OpenRouter, and Gemini all have free-tier quota limits. Under heavy concurrent load, all three providers may exhaust their limits simultaneously. The fallback chain handles single-provider failures gracefully but cannot work around a full quota blackout.

### Creator Search
- Creator discovery is powered by live Tavily web search rather than a curated static database. Results depend on what's publicly indexed at the time of the request. Obscure niches with limited web presence may produce fewer verified creator matches, lowering the confidence score.
- Instagram profile URL extraction relies on URLs appearing in search result snippets. Some creators with strong audiences but limited web mentions outside Instagram may not surface reliably.

### Android App
- The Android APK is not a fully offline app — it loads the live Signal Wire web app from Render via the device's internet connection. If Render is cold-starting or the user is offline, the app will not load.
- The APK is a debug build (not signed for Play Store distribution). Installing requires enabling "Install from unknown sources" on the Android device. Production distribution would require a signing keystore and Play Store submission.

### Analytics & Admin
- User feedback ratings and notes are stored in the database but there is no admin dashboard to aggregate or visualize feedback data. Querying requires direct database access or a custom reporting query.

### Authentication
- No password reset / "forgot password" flow is implemented. Users who forget their password cannot recover access without a manual database intervention.
- No email verification on signup — any valid email format is accepted.

---

## 9. Version History

### v1.0.0 — Initial Release
- Core React frontend with brand profile form
- Single LLM provider (Gemini) generating strategy reports
- Basic channel recommendations, budget allocation, creator suggestions
- No authentication, no persistence — reports lived only in browser memory
- No creator profile URLs or validation

### v1.1.0 — Full-Stack Authentication & Hardened AI Engine
**Added:**
- Real email/password authentication with bcrypt + JWT `httpOnly` cookies
- PostgreSQL/SQLite persistence via Prisma ORM — reports survive page refresh
- Report refinement pipeline — iterative strategy updates without re-filling forms
- Thumbs up/down feedback collection per report
- Multi-provider LLM fallback chain (Groq → OpenRouter → Gemini)
- Zod output validation with automatic LLM re-prompting repair loop
- Input contradiction and vagueness pre-flight detection (422 clarification responses)
- Deterministic 4-factor confidence scoring engine replacing LLM-invented numbers
- API rate limiting (express-rate-limit) protecting expensive LLM endpoints

### v1.2.0 — Creator Intelligence & Production Deployment
**Added:**
- Accurate creator search with Instagram domain-biased Tavily queries
- Real Instagram profile URL extraction and strict regex validation
- Clickable creator cards with verified profile links and Instagram badges
- On-demand AI creator intros ("Know More") via Tavily + LLM synthesis with honest fallback
- Creator intro caching in PostgreSQL (30-day freshness window)
- Production deployment: backend and frontend on Render free tier
- Database migrated from SQLite to Neon cloud PostgreSQL
- `render.yaml` Blueprint configuration for reproducible deployment
- Android APK built with Capacitor and published as GitHub Release asset

### v1.2.1 — Android SSR Fix
**Fixed:**
- Android APK blank screen on launch: configured Capacitor `server.url` to point the WebView at the live Render SSR frontend instead of attempting to run TanStack Start's client code from bundled static assets without a server context.

---

*Signal Wire — Built with React, TanStack Start, Express, Prisma, PostgreSQL, and a multi-provider AI fallback chain.*
