/**
 * report.js – Express router for the /api/generate-report endpoint.
 *
 * POST /api/generate-report
 * Body: { brandName: string, description: string, budget: number }
 * Response: JSON report object | { error: string }
 */

import { Router } from "express";
import { generateReport } from "../services/geminiService.js";

const router = Router();

router.post("/generate-report", async (req, res) => {
  const { brandName, description, budget } = req.body ?? {};

  // ── Input validation ────────────────────────────────────────────────────
  const errors = [];
  if (!brandName || typeof brandName !== "string" || !brandName.trim()) {
    errors.push("brandName is required and must be a non-empty string.");
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    errors.push("description is required and must be a non-empty string.");
  }
  if (budget === undefined || budget === null || isNaN(Number(budget)) || Number(budget) < 0) {
    errors.push("budget is required and must be a non-negative number.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  // ── Call service ─────────────────────────────────────────────────────────
  try {
    const report = await generateReport(
      brandName.trim(),
      description.trim(),
      Number(budget)
    );
    return res.status(200).json(report);
  } catch (err) {
    // Classify the error for the consumer without leaking internal stack traces.
    const message = err?.message ?? "Unknown error";
    console.error("[POST /api/generate-report] Error:", message);

    // Missing API keys → 503 (service not configured)
    if (message.includes("_API_KEY is not set")) {
      return res.status(503).json({
        error: "Service not configured: " + message,
      });
    }

    // Timeout errors → 504
    if (message.toLowerCase().includes("timed out")) {
      return res.status(504).json({
        error: "Upstream service timed out. Please try again shortly.",
      });
    }

    // Tavily / Gemini HTTP errors or JSON parse failures → 502 / 500
    if (message.includes("Tavily API returned") || message.includes("Tavily request failed")) {
      return res.status(502).json({ error: "Tavily search failed: " + message });
    }

    if (message.includes("non-JSON output") || message.includes("missing required fields")) {
      return res.status(502).json({
        error: "AI model returned an unexpected response: " + message,
      });
    }

    // Generic fallback – never let the server crash silently.
    return res.status(500).json({ error: "Internal server error: " + message });
  }
});

export default router;
