# Signal Wire — Frontend

React + Vite + TanStack Router frontend for [Signal Wire](https://github.com/rudrasachapara21/signal-wire), an AI-powered ad-strategy advisor.

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** + **TanStack Start** (SSR via Nitro/Cloudflare)
- **TanStack Router** (file-based routing, auto-generated route tree)
- **Tailwind CSS v4** + **shadcn/ui** component library
- **react-hook-form** + **zod** for form validation
- **IBM Plex Sans** (body) + **Libre Baskerville** (headings) — core visual signature

## App structure

```
src/
├── context/AuthContext.tsx     ← Auth state + pendingAction pattern
├── hooks/useRequireAuth.ts     ← guard() helper for action-gated auth
├── lib/mock-data.ts            ← Typed mock data (replace with API calls)
├── components/layout/          ← AppLayout, Sidebar, Header
├── pages/                      ← Overview, BrandProfile, StrategyReport, PastReports
│   └── auth/                   ← Login, Signup
└── routes/                     ← TanStack Router file-based routes
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```sh
cp .env.example .env
```

See `.env.example` for required variables. Vite exposes only `VITE_`-prefixed variables to the client bundle — never put raw API keys or secrets in this file without that prefix check.

## Development

You need Node.js 18+ and npm.

```sh
cd signal-wire-frontend
npm install
npm run dev
```

App runs at `http://localhost:3000` (or next available port).

## Build

```sh
npm run build      # production build (Nitro/Cloudflare target)
npm run preview    # preview the production build locally
```

## Backend

The backend lives in the parent [`signal-wire`](https://github.com/rudrasachapara21/signal-wire) repo. Auth functions in `src/context/AuthContext.tsx` are currently mocked — search for `// TODO: replace with real API call to backend auth endpoint` to find the swap points.

This project was originally built with [Lovable](https://lovable.dev).
