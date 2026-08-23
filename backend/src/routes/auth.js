/**
 * auth.js — POST /api/auth/signup  /login  /logout  GET /api/auth/me
 *
 * Session strategy: JWT in a `sid` httpOnly cookie.
 * - httpOnly: JS cannot read it (XSS protection)
 * - sameSite: 'lax': works for same-origin SPA, prevents most CSRF
 * - secure: true in production (HTTPS only)
 *
 * Never returns passwordHash in any response.
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = Router();

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRES_IN = "30d"; // Long-lived session; user doesn't need to re-login constantly
const COOKIE_NAME = "sid";

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function issueTokenCookie(res, user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    path: "/",
  });
}

function safeUser(user) {
  // Strip passwordHash — never expose it
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    initials: deriveInitials(user.name),
    createdAt: user.createdAt,
  };
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────

router.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body ?? {};

  // Server-side validation
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      },
    });

    issueTokenCookie(res, user);
    console.log(`[auth] Signup: new user ${user.email} (${user.id})`);
    return res.status(201).json({ user: safeUser(user) });
  } catch (err) {
    console.error("[auth/signup]", err);
    return res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Use a constant-time comparison to avoid timing attacks
    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    issueTokenCookie(res, user);
    console.log(`[auth] Login: ${user.email}`);
    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    console.error("[auth/login]", err);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  return res.status(200).json({ ok: true });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

router.get("/auth/me", async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfiguration." });
  }

  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    return res.status(401).json({ error: "Session expired." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      // User was deleted but token still valid — clear it
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(401).json({ error: "Account not found." });
    }
    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    console.error("[auth/me]", err);
    return res.status(500).json({ error: "Failed to fetch user." });
  }
});

export default router;
