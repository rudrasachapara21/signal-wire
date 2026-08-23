# Signal Wire — AI Ad Strategy Advisor (v1.1.0)

Signal Wire is an intelligent digital advertising strategy platform designed for small and medium businesses. By analyzing a brand's product offerings, target audience, and monthly advertising budget, Signal Wire generates practical, actionable strategy reports featuring recommended platform mixes, budget allocations, creator shortlists, executive recommendations, and 30-day tactical action plans.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, TanStack Router
- **Backend**: Node.js, Express, Prisma ORM (v5), SQLite, Zod validation, JWT (`httpOnly` cookies), bcrypt password hashing, `express-rate-limit`
- **AI Engine & Search**: Multi-provider LLM fallback chain (Groq → OpenRouter → Gemini) with automated Zod output repair and live market research via Tavily Search API

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- Node.js (v18+ recommended)
- npm or bun

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the project root (or inside `backend/`):
```bash
cp .env.example .env
```

Fill in your configuration:
```env
PORT=5001
JWT_SECRET=your-super-secret-key-change-in-production

# AI Provider API Keys
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
TAVILY_API_KEY=your_tavily_api_key

# Frontend API URL
VITE_API_BASE_URL=http://localhost:5001
```

### 4. Database Setup & Migrations
Run Prisma migrations to initialize the local SQLite database schema:
```bash
cd backend
npx prisma migrate dev
```

### 5. Run Development Servers
Start backend and frontend development servers:

**Backend Server** (Port 5001):
```bash
cd backend
npm run dev
```

**Frontend Dev Server** (Port 8080):
```bash
cd frontend
npm run dev
```

Open `http://localhost:8080` in your browser.

---

## ✨ Features (v1.1.0 Release)

- 🔐 **Real Backend Authentication**: Secure email/password auth using bcrypt password hashing, JWT session management via `httpOnly` cookies, and persistent user accounts in SQLite.
- ⚡ **Multi-Provider AI Fallback Chain**: Robust LLM orchestration that automatically falls through providers (`Groq` → `OpenRouter` → `Gemini`) to guarantee high uptime under free-tier quota limits.
- 🛡️ **Zod Validation & LLM Auto-Repair**: Hardened backend layer enforcing strict schema validation (`reportSchema.js`) with automatic LLM re-prompting feedback loops when JSON errors occur.
- 🔍 **Input Sanity & Contradiction Check**: Fast pre-flight verification (`inputValidator.js`) catching contradictory product descriptions or unusable vagueness before running full strategy generation.
- 📊 **Deterministic Confidence Scoring Engine**: Replaces arbitrary LLM guesses with a transparent 4-factor scoring model (`reportScoring.js`) evaluating Data Completeness, Budget Realism, Verified Creator Matches, and Market Data Availability.
- 🔄 **Report Refinement Pipeline**: Allows logged-in users to request targeted iterative changes (e.g. "increase budget to ₹80,000" or "focus on TikTok") on existing strategy reports.
- 👍 **Feedback Mechanism**: Native thumbs up/down rating controls and optional feedback note collection saved directly to the database per report.
- 🚦 **API Rate Limiting**: IP-based protection (`express-rate-limit`) safeguarding expensive AI endpoints against accidental quota exhaustion or loop spam.

---

## ⚠️ Known Limitations

- **Creator Search Data**: Live creator discovery combines real-time Tavily search results with plausible archetype fallbacks when public creator follower metrics are sparse in specific niches.
- **LLM Provider Quotas**: Free-tier AI provider keys may hit rate limits under heavy concurrent load; configuring all three provider keys (Groq, OpenRouter, Gemini) ensures seamless fallback.
- **Feedback Analytics**: User feedback ratings and notes are persisted per report in SQLite, but an admin aggregation dashboard is deferred to a future release.

---

## 📝 License & Contributing

Distributed under the MIT License. See `LICENSE` for details.
