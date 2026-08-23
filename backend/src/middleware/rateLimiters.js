/**
 * rateLimiters.js
 *
 * Express rate limiting middleware using express-rate-limit.
 *
 * Rate limiting strategy:
 *   - IP-based limiting (req.ip) is used as the simple, effective baseline protection.
 *   - NOTE: In the future, per-user limiting (using req.user.id) can be added as an optional
 *     enhancement for authenticated endpoints once auth middleware is guaranteed to run prior.
 */

import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for expensive LLM-generating endpoints:
 *   - POST /api/analyze-brand
 *   - POST /api/reports/:id/refine
 *
 * Limit: 10 requests per 15 minutes per IP.
 */
export const expensiveOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res /*, next, options */) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfter = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : 900;

    res.status(429).json({
      error: "rate_limited",
      message: "You're doing that a bit too often — please wait a few minutes and try again.",
      retryAfter,
    });
  },
});

/**
 * Baseline rate limiter for all other /api/ endpoints.
 *
 * Limit: 100 requests per 15 minutes per IP.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res /*, next, options */) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfter = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : 900;

    res.status(429).json({
      error: "rate_limited",
      message: "Too many requests from this IP, please try again later.",
      retryAfter,
    });
  },
});
