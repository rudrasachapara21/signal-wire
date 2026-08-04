/**
 * index.js – Signal Wire backend entry point.
 *
 * Starts an Express server that:
 *  - Loads env vars from .env (relative to the repo root, one level up)
 *  - Applies CORS so the frontend dev server can call it
 *  - Parses JSON bodies
 *  - Mounts /api routes
 *  - Listens on PORT (default 5000)
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import reportRouter from "./routes/report.js";

// ---------------------------------------------------------------------------
// Validate critical env keys at startup so failures are obvious immediately.
// ---------------------------------------------------------------------------
const REQUIRED_ENV = ["GEMINI_API_KEY", "TAVILY_API_KEY"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.warn(
    `[startup] WARNING: The following environment variables are not set: ${missing.join(", ")}.\n` +
      `  Copy .env.example to .env and fill in the real values.\n` +
      `  The server will start, but /api/generate-report will return 503 until they are set.`
  );
}

// ---------------------------------------------------------------------------
// Express app setup
// ---------------------------------------------------------------------------
const app = express();

// CORS – in production you'd lock this down to your frontend origin.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies up to 1 MB.
app.use(express.json({ limit: "1mb" }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api", reportRouter);

// Health-check – useful for deployment probes without touching the AI services.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 catch-all for unknown routes.
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Global error handler (catches anything that slips through with next(err)).
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[global error handler]", err);
  res.status(500).json({ error: "Unexpected server error." });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT ?? 5001);

const server = app.listen(PORT, () => {
  console.log(`✅  Signal Wire backend listening on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/generate-report`);
  console.log(`   GET  http://localhost:${PORT}/health`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[startup] ERROR: Port ${PORT} is already in use.\n` +
        `  Set a different port via the PORT env var (e.g. PORT=5002 npm run dev).`
    );
  } else {
    console.error("[startup] Server error:", err);
  }
  process.exit(1);
});
