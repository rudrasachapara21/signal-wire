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

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import reportRouter from "./routes/report.js";
import speechRouter from "./routes/speech.js";
import authRouter from "./routes/auth.js";
import reportsRouter from "./routes/reports.js";
import { generalApiLimiter } from "./middleware/rateLimiters.js";

// ---------------------------------------------------------------------------
// Validate env keys at startup so failures are obvious immediately.
// GEMINI_API_KEY is required (final fallback). GROQ + OPENROUTER are optional
// but strongly recommended — without them Gemini's rate limits will bite you.
// ---------------------------------------------------------------------------
const REQUIRED_ENV = ["GEMINI_API_KEY"];
const OPTIONAL_ENV = ["GROQ_API_KEY", "OPENROUTER_API_KEY", "TAVILY_API_KEY", "JWT_SECRET"];

const missingJwt = !process.env.JWT_SECRET;
if (missingJwt) {
  console.warn(
    `[startup] WARNING: JWT_SECRET is not set.\n` +
      `  Auth routes will fail until it is configured.\n` +
      `  Set a long random string: JWT_SECRET=your-super-secret-here`
  );
}

const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.warn(
    `[startup] WARNING: Required env vars not set: ${missing.join(", ")}.\n` +
      `  Copy .env.example to .env and fill in the real values.\n` +
      `  The server will start, but /api/analyze-brand will return 503 until they are set.`
  );
}

const missingOptional = OPTIONAL_ENV.filter(
  (k) => !process.env[k] || process.env[k] === "your_key_here"
);
if (missingOptional.length > 0) {
  console.warn(
    `[startup] INFO: Optional provider keys not set: ${missingOptional.join(", ")}.\n` +
      `  Without them, /api/analyze-brand will only use Gemini (tight rate limits).\n` +
      `  Get free keys at https://console.groq.com and https://openrouter.ai`
  );
}

// ---------------------------------------------------------------------------
// Express app setup
// ---------------------------------------------------------------------------
const app = express();

// CORS – explicitly allow the frontend dev origins and the production origin.
const configuredOrigins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
  ...configuredOrigins,
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
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Required for httpOnly cookie exchange
  })
);

// Parse JSON bodies up to 1 MB.
app.use(express.json({ limit: "1mb" }));

// Parse cookies (required for JWT session cookie)
app.use(cookieParser());

// Health-check at /api/health (frontend-compatible path) and root /health
// for deployment probes without touching rate limiters or AI services.
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

// Apply general API rate limiter to all other /api routes
app.use("/api", generalApiLimiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api", authRouter);
app.use("/api", reportsRouter);
app.use("/api", reportRouter);
app.use("/api", speechRouter);

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
  console.log(`   POST http://localhost:${PORT}/api/auth/signup`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
  console.log(`   POST http://localhost:${PORT}/api/reports`);
  console.log(`   GET  http://localhost:${PORT}/api/reports`);
  console.log(`   POST http://localhost:${PORT}/api/analyze-brand`);
  console.log(`   POST http://localhost:${PORT}/api/speech-to-text`);
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
