# Changelog

All notable changes to the Signal Wire project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-08-23

### Added
- **Backend Authentication & User Persistence**: Express authentication API supporting user registration, login, and session checks with bcrypt password hashing, JWT `httpOnly` cookies, and SQLite database persistence via Prisma ORM v5.
- **Report Storage & Versioning**: Database models for saving strategy reports, maintaining parent-child refinement chains, and rendering past report history per user.
- **Iterative Strategy Refinement**: Endpoint (`POST /api/reports/:id/refine`) and UI panel allowing logged-in users to request targeted modifications to existing strategy reports without re-filling brand profile forms.
- **Report Feedback Collection**: Endpoints and interactive controls (`PATCH /api/reports/:id/feedback`) for submitting thumbs up/down ratings and optional feedback notes per report.
- **Zod Output Validation & Auto-Repair**: Hardened backend output layer (`reportSchema.js`) with an automated LLM re-prompting feedback loop that repairs invalid JSON responses.
- **Input Contradiction & Vagueness Pre-Flight**: Pre-generation sanity validator (`inputValidator.js`) that detects contradictory product descriptions or unusable vagueness and returns clear 422 clarification suggestions.
- **Deterministic 4-Factor Confidence Scoring**: Scoring engine (`reportScoring.js`) replacing arbitrary AI confidence numbers with an explainable model based on Data Completeness, Budget Realism, Verified Creator Matches, and Market Data Availability.
- **API Rate Limiting**: `express-rate-limit` middleware protecting expensive LLM endpoints (10 req / 15 min / IP) and general API routes (100 req / 15 min / IP) with custom HTTP 429 response handling.
- **Frontend UI Enhancements**: Interactive feedback controls, refinement panels, input clarification banners, and confidence score tooltips.
