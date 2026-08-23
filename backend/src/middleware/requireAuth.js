/**
 * requireAuth.js
 *
 * Express middleware that verifies the JWT stored in the `sid` httpOnly cookie.
 * On success: attaches `req.user = { id, email, name }` and calls `next()`.
 * On failure: returns 401 with a structured error.
 *
 * Usage:
 *   import requireAuth from "../middleware/requireAuth.js";
 *   router.get("/protected", requireAuth, handler);
 */

import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  const token = req.cookies?.sid;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated. Please log in." });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[requireAuth] JWT_SECRET is not set in environment.");
    return res.status(500).json({ error: "Server misconfiguration." });
  }

  try {
    const payload = jwt.verify(token, secret);
    // payload contains { id, email, name, iat, exp }
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch (err) {
    // Token expired, invalid signature, etc.
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}
