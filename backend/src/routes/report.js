/**
 * report.js – Express router for Signal Wire API endpoints.
 *
 * Endpoints:
 *
 *   POST /api/analyze-brand    ← NEW (used by frontend)
 *     Body: { brand_name, sell_type, description, ideal_customer, monthly_budget }
 *     Response: StrategyReportResponse matching the frontend schema
 *
 *   POST /api/generate-report  ← LEGACY (richer Tavily + Gemini report)
 *     Body: { brandName, description, budget }
 *     Response: Legacy report object | { error: string }
 */

import { Router } from "express";
import { analyzeForFrontend, generateReport } from "../services/geminiService.js";
import { validateBrandInput } from "../services/inputValidator.js";
import { expensiveOperationLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/analyze-brand — Frontend-facing endpoint
// ---------------------------------------------------------------------------

router.post("/analyze-brand", expensiveOperationLimiter, async (req, res) => {
  const { brand_name, sell_type, description, ideal_customer, monthly_budget } =
    req.body ?? {};

  // ── Input validation ──────────────────────────────────────────────────────
  const errors = [];

  if (!brand_name || typeof brand_name !== "string" || !brand_name.trim()) {
    errors.push("brand_name is required and must be a non-empty string.");
  }
  if (!sell_type || typeof sell_type !== "string" || !sell_type.trim()) {
    errors.push("sell_type is required and must be a non-empty string.");
  }
  if (!description || typeof description !== "string" || description.trim().length < 10) {
    errors.push("description is required and must be at least 10 characters.");
  }
  if (!ideal_customer || typeof ideal_customer !== "string" || !ideal_customer.trim()) {
    errors.push("ideal_customer is required and must be a non-empty string.");
  }
  if (!monthly_budget || typeof monthly_budget !== "string" || !monthly_budget.trim()) {
    errors.push("monthly_budget is required and must be a non-empty string.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  // ── Call service ──────────────────────────────────────────────────────────
  const profile = {
    brand_name: brand_name.trim(),
    sell_type: sell_type.trim(),
    description: description.trim(),
    ideal_customer: ideal_customer.trim(),
    monthly_budget: monthly_budget.trim(),
  };

  // ── Input Sanity Check ────────────────────────────────────────────────────
  try {
    const inputCheck = await validateBrandInput(profile);
    if (!inputCheck.isValid) {
      console.warn(`[POST /api/analyze-brand] Input flagged as invalid: ${inputCheck.issue}`);
      return res.status(422).json({
        error: "input_needs_clarification",
        issue: inputCheck.issue,
        suggestion: inputCheck.suggestedClarification,
      });
    }
  } catch (err) {
    console.warn(`[POST /api/analyze-brand] Sanity check error, proceeding: ${err.message}`);
  }

  try {
    const report = await analyzeForFrontend(profile);
    return res.status(200).json(report);
  } catch (err) {
    const message = err?.message ?? "Unknown error";
    console.error("[POST /api/analyze-brand] Error:", message);

    // All providers exhausted → 503
    if (message.startsWith("ALL_PROVIDERS_FAILED:")) {
      return res.status(503).json({
        error:
          "All AI providers are currently unavailable. Please try again in a few minutes.",
      });
    }

    // Missing API key → 503
    if (
      message.includes("_API_KEY is not set") ||
      message.includes("is a placeholder")
    ) {
      return res.status(503).json({
        error: "Service not configured: an AI provider API key is missing.",
      });
    }

    // Quota / rate limit → 429 (single-provider, shouldn't reach here normally)
    if (
      message.includes("quota exceeded") ||
      message.toLowerCase().includes("rate limit")
    ) {
      return res.status(429).json({ error: message });
    }

    // Timeout → 504
    if (message.toLowerCase().includes("timed out")) {
      return res.status(504).json({
        error: "The AI model took too long to respond. Please try again.",
      });
    }

    // Non-JSON model output → 502
    if (message.includes("non-JSON") || message.includes("missing required fields")) {
      return res.status(502).json({
        error: "AI model returned an unexpected response. Please try again.",
      });
    }

    // Generic fallback
    return res.status(500).json({ error: "Internal server error: " + message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/generate-report — Legacy endpoint (kept for backward compatibility)
// ---------------------------------------------------------------------------

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
  if (
    budget === undefined ||
    budget === null ||
    isNaN(Number(budget)) ||
    Number(budget) < 0
  ) {
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
    const message = err?.message ?? "Unknown error";
    console.error("[POST /api/generate-report] Error:", message);

    if (message.includes("_API_KEY is not set")) {
      return res.status(503).json({
        error: "Service not configured: " + message,
      });
    }

    if (message.toLowerCase().includes("timed out")) {
      return res.status(504).json({
        error: "Upstream service timed out. Please try again shortly.",
      });
    }

    if (
      message.includes("Tavily API returned") ||
      message.includes("Tavily request failed")
    ) {
      return res.status(502).json({ error: "Tavily search failed: " + message });
    }

    if (
      message.includes("non-JSON output") ||
      message.includes("missing required fields")
    ) {
      return res.status(502).json({
        error: "AI model returned an unexpected response: " + message,
      });
    }

    return res.status(500).json({ error: "Internal server error: " + message });
  }
});

export default router;
