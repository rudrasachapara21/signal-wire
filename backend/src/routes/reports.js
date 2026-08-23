/**
 * reports.js — POST /api/reports  GET /api/reports  GET /api/reports/:id
 *              POST /api/reports/:id/refine
 *
 * All routes require authentication (requireAuth middleware).
 *
 * Reports are stored as JSON blobs (reportData field) so the schema
 * doesn't need to track every field of StrategyReportResponse —
 * it stays flexible as the AI output schema evolves.
 *
 * brandProfile is also stored as a JSON blob so refinements have access
 * to the original form inputs.
 *
 * refinedFromId links a refined report to its parent, forming a chain.
 */

import { Router } from "express";
import prisma from "../lib/prisma.js";
import requireAuth from "../middleware/requireAuth.js";
import { refineReport } from "../services/llmOrchestrator.js";
import { expensiveOperationLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// ── POST /api/reports — Save a new report ────────────────────────────────────

router.post("/reports", requireAuth, async (req, res) => {
  const { brandName, reportData, brandProfile } = req.body ?? {};

  if (!brandName || typeof brandName !== "string") {
    return res.status(400).json({ error: "brandName is required." });
  }
  if (!reportData || typeof reportData !== "object") {
    return res.status(400).json({ error: "reportData must be an object." });
  }

  try {
    const report = await prisma.report.create({
      data: {
        userId: req.user.id,
        brandName: brandName.trim(),
        reportData: JSON.stringify(reportData),
        brandProfile: brandProfile ? JSON.stringify(brandProfile) : null,
      },
    });

    console.log(`[reports] Saved report ${report.id} for user ${req.user.email}`);
    return res.status(201).json(formatReport(report));
  } catch (err) {
    console.error("[reports/POST]", err);
    return res.status(500).json({ error: "Failed to save report." });
  }
});

// ── GET /api/reports — List user's reports (newest first) ────────────────────

router.get("/reports", requireAuth, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(reports.map(formatReport));
  } catch (err) {
    console.error("[reports/GET]", err);
    return res.status(500).json({ error: "Failed to fetch reports." });
  }
});

// ── GET /api/reports/:id — Get a specific report ─────────────────────────────

router.get("/reports/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }
    if (report.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied." });
    }

    return res.status(200).json(formatReport(report));
  } catch (err) {
    console.error("[reports/GET/:id]", err);
    return res.status(500).json({ error: "Failed to fetch report." });
  }
});

// ── POST /api/reports/:id/refine — Refine an existing report ─────────────────

router.post("/reports/:id/refine", expensiveOperationLimiter, requireAuth, async (req, res) => {
  const { id } = req.params;
  const { refinementRequest } = req.body ?? {};

  if (!refinementRequest || typeof refinementRequest !== "string" || !refinementRequest.trim()) {
    return res.status(400).json({ error: "refinementRequest is required." });
  }
  if (refinementRequest.trim().length > 1000) {
    return res.status(400).json({ error: "Refinement request is too long (max 1000 chars)." });
  }

  // Load the original report
  let originalReport;
  try {
    originalReport = await prisma.report.findUnique({ where: { id } });
  } catch (err) {
    console.error("[reports/refine] DB lookup failed:", err);
    return res.status(500).json({ error: "Failed to load report." });
  }

  if (!originalReport) {
    return res.status(404).json({ error: "Report not found." });
  }
  if (originalReport.userId !== req.user.id) {
    return res.status(403).json({ error: "Access denied. You can only refine your own reports." });
  }

  // Parse stored data
  let existingReportData, brandProfile;
  try {
    existingReportData = JSON.parse(originalReport.reportData);
    brandProfile = originalReport.brandProfile
      ? JSON.parse(originalReport.brandProfile)
      : null;
  } catch (err) {
    console.error("[reports/refine] Failed to parse stored report data:", err);
    return res.status(500).json({ error: "Stored report data is malformed." });
  }

  // Run the refinement LLM
  let refinedReportData;
  try {
    console.log(`[refine] Refining report ${id} for user ${req.user.email}: "${refinementRequest.slice(0, 80)}"`);
    refinedReportData = await refineReport({
      brandProfile,
      existingReport: existingReportData,
      refinementRequest: refinementRequest.trim(),
    });
  } catch (err) {
    const errMsg = err?.message ?? "Unknown error";
    console.error("[reports/refine] LLM error:", errMsg);

    if (errMsg.startsWith("ALL_PROVIDERS_FAILED:")) {
      return res.status(503).json({
        error: "All AI providers are currently unavailable. Please try again in a few minutes.",
      });
    }
    return res.status(500).json({ error: "Failed to generate refined report." });
  }

  // Save the refined report as a new row, linked to the original via refinedFromId
  let savedRefinement;
  try {
    savedRefinement = await prisma.report.create({
      data: {
        userId: req.user.id,
        brandName: originalReport.brandName,
        reportData: JSON.stringify(refinedReportData),
        brandProfile: originalReport.brandProfile, // carry forward the original profile
        refinedFromId: id,
      },
    });
    console.log(`[refine] Saved refined report ${savedRefinement.id} (refined from ${id})`);
  } catch (err) {
    console.error("[reports/refine] Failed to save refined report:", err);
    return res.status(500).json({ error: "Failed to save refined report." });
  }

  return res.status(201).json({
    ...formatReport(savedRefinement),
    refinedFromId: savedRefinement.refinedFromId,
  });
});

// ── PATCH /api/reports/:id/feedback — Rate a report ──────────────────────────

router.patch("/reports/:id/feedback", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { rating, feedbackNote } = req.body ?? {};

  // Validate rating value
  const VALID_RATINGS = ["up", "down", null];
  if (!VALID_RATINGS.includes(rating === undefined ? null : rating)) {
    return res.status(400).json({
      error: 'rating must be "up", "down", or null.',
    });
  }
  if (feedbackNote !== undefined && typeof feedbackNote !== "string") {
    return res.status(400).json({ error: "feedbackNote must be a string." });
  }
  if (feedbackNote && feedbackNote.length > 500) {
    return res.status(400).json({ error: "feedbackNote is too long (max 500 chars)." });
  }

  // Load the report to verify ownership
  let report;
  try {
    report = await prisma.report.findUnique({ where: { id } });
  } catch (err) {
    console.error("[reports/feedback] DB lookup failed:", err);
    return res.status(500).json({ error: "Failed to load report." });
  }

  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }
  if (report.userId !== req.user.id) {
    return res.status(403).json({ error: "Access denied. You can only rate your own reports." });
  }

  // Apply feedback — overwrite any existing rating (allows changing up→down and vice versa)
  try {
    const updated = await prisma.report.update({
      where: { id },
      data: {
        rating: rating ?? null,
        feedbackNote: rating ? (feedbackNote?.trim() ?? null) : null, // clear note when rating cleared
        ratedAt: rating ? new Date() : null,
      },
    });

    console.log(
      `[feedback] Report ${id} rated "${rating ?? "cleared"}" by ${req.user.email}` +
      (feedbackNote ? ` — note: "${feedbackNote.slice(0, 60)}"` : "")
    );
    return res.status(200).json(formatReport(updated));
  } catch (err) {
    console.error("[reports/feedback] Update failed:", err);
    return res.status(500).json({ error: "Failed to save feedback." });
  }
});

// ── Formatter — parses the JSON blob and adds metadata ───────────────────────

function formatReport(report) {
  let parsedData;
  try {
    parsedData = JSON.parse(report.reportData);
  } catch {
    parsedData = {};
  }

  return {
    id: report.id,
    brandName: report.brandName,
    createdAt: report.createdAt,
    status: "Ready",
    refinedFromId: report.refinedFromId ?? null,
    rating: report.rating ?? null,
    feedbackNote: report.feedbackNote ?? null,
    ratedAt: report.ratedAt ?? null,
    ...parsedData,
  };
}

export default router;

