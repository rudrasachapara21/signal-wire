# Signal Wire – Backend

Express API server powering the Signal Wire AI ad-strategy advisor.

## Running locally

```bash
# 1. Copy the example env file and fill in real API keys
cp ../.env.example ../.env

# 2. Install dependencies
npm install

# 3. Start the dev server (auto-restarts on file changes, Node ≥ 18 required)
npm run dev
```

The server starts on **http://localhost:5001** by default.  
Override the port: `PORT=4000 npm run dev`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/generate-report` | Generate an AI ad-strategy report |
| `GET`  | `/health` | Health probe (no AI calls) |

### POST `/api/generate-report`

**Request body (JSON):**
```json
{
  "brandName": "Acme Coffee Co.",
  "description": "Specialty coffee roaster targeting remote workers",
  "budget": 2000
}
```

**Response:** JSON report matching the schema defined in `src/services/geminiService.js`.

## Environment variables

> ⚠️ **Never commit real key values.** Copy `.env.example` (repo root) to `.env` and fill in values locally.  
> On Render, set these in **Dashboard → Service → Environment**.

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google AI Studio key — [aistudio.google.com](https://aistudio.google.com/) |
| `TAVILY_API_KEY` | ✅ Yes | Tavily search key — [tavily.com](https://tavily.com/) |
| `CORS_ORIGIN` | ⚠️ Production | Set to your deployed frontend URL (e.g. `https://your-app.vercel.app`). Defaults to `*` in dev — **must be locked down before going live**. |
| `PORT` | Auto | Injected by Render automatically. Do not set manually on Render. |
| `NODE_ENV` | Recommended | Set to `production` on Render (already configured in `render.yaml`). |

## Deployment (Render)

Deployment config lives at [`render.yaml`](../render.yaml) in the repo root.

**Pre-deployment checklist:**
1. Confirm `render.yaml` is committed and pushed to the default branch.
2. In Render dashboard: create a **Blueprint**, connect this repo, and let it detect `render.yaml`.
3. Set `GEMINI_API_KEY` and `TAVILY_API_KEY` in **Render → Service → Environment** before triggering the first deploy.
4. Set `CORS_ORIGIN` to the deployed frontend URL (get this from Vercel/Netlify/etc. first).
5. Trigger the deploy manually — Render will run `npm install` then `npm start` from the `backend/` directory.
6. Verify the live health check: `curl https://<your-render-url>/health`

**Do not deploy until all three environment variables are set in the Render dashboard.**
