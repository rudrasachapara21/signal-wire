/**
 * index.js – Signal Wire backend entry point.
 *
 * Starts an Express server that:
 *  - Loads env vars from .env
 *  - Applies CORS so the frontend dev server can call it
 *  - Parses JSON bodies
 *  - Mounts /api routes (analyze-brand, generate-report)
 *  - Exposes GET /api/health for connectivity checks
 *  - Listens on PORT (default 5001)
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import reportRouter from "./routes/report.js";

// ---------------------------------------------------------------------------
// Validate critical env keys at startup so failures are obvious immediately.
// ---------------------------------------------------------------------------
const REQUIRED_ENV = ["GEMINI_API_KEY"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.warn(
    `[startup] WARNING: The following environment variables are not set: ${missing.join(", ")}.\n` +
      `  Copy .env.example to .env and fill in the real values.\n` +
      `  The server will start, but /api/analyze-brand will return 503 until they are set.`
  );
}

// ---------------------------------------------------------------------------
// Express app setup
// ---------------------------------------------------------------------------
const app = express();

// CORS – explicitly allow the frontend dev origins and the production origin.
// In production, lock this down to the deployed frontend URL.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:4173",
  ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
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

// Health-check at /api/health (frontend-compatible path) and root /health
// for deployment probes without touching the AI services.
function healthHandler(_req, res) {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "signal-wire-backend",
    version: "1.0.0",
  });
}

app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

// 404 catch-all for unknown routes.
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Global error handler (catches anything that slips through with next(err)).
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[global error handler]", err);
  // CORS errors get a clearer message
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: "Unexpected server error." });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT ?? 5001);

const server = app.listen(PORT, () => {
  console.log(`✅  Signal Wire backend listening on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/analyze-brand`);
  console.log(`   POST http://localhost:${PORT}/api/generate-report`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
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
