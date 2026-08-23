/**
 * speech.js – POST /api/speech-to-text
 *
 * Accepts a multipart audio file upload, forwards it to Groq's
 * Whisper large-v3 translation endpoint, and returns the English
 * text transcription.
 *
 * Groq's /audio/translations endpoint:
 *   - Accepts any supported audio format (webm, mp3, mp4, wav, ogg, flac, m4a)
 *   - model: "whisper-large-v3"
 *   - Returns English text regardless of input language (translate, not just transcribe)
 *   - Free tier limit: 25MB per file
 *
 * Errors handled:
 *   - No file uploaded: 400
 *   - File exceeds 25MB: 413
 *   - GROQ_API_KEY missing: 503
 *   - Groq API error: 502
 */

import { Router } from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";

const router = Router();

const GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/translations";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

// ── Multer: store in memory (buffer) ──────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    // Accept any audio mimetype, or application/octet-stream for webm blobs
    // from the browser's MediaRecorder API
    const allowed = [
      "audio/",
      "video/webm", // MediaRecorder sometimes uses video/webm for audio-only
      "application/octet-stream",
    ];
    if (allowed.some((prefix) => file.mimetype.startsWith(prefix))) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ── POST /api/speech-to-text ─────────────────────────────────────────────────

router.post(
  "/speech-to-text",
  (req, res, next) => {
    // Run multer; convert MulterError to a clean response
    upload.single("audio")(req, res, (err) => {
      if (!err) return next();

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: `Audio file exceeds the 25MB limit. Please record a shorter clip.`,
        });
      }
      if (err.message?.includes("Unsupported file type")) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    });
  },
  async (req, res) => {
    // ── Validate file present ───────────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({
        error: "No audio file provided. Send the file as 'audio' field in a multipart/form-data request.",
      });
    }

    // ── Check API key ───────────────────────────────────────────────────────
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || groqKey === "your_key_here") {
      return res.status(503).json({
        error: "GROQ_API_KEY is not configured on the server.",
      });
    }

    // ── Build multipart form for Groq ───────────────────────────────────────
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "recording.webm",
      contentType: req.file.mimetype || "audio/webm",
    });
    form.append("model", "whisper-large-v3");
    // Optional: response_format defaults to json which includes { text: "..." }

    // ── Call Groq Whisper translation endpoint ──────────────────────────────
    let groqRes;
    try {
      groqRes = await fetch(GROQ_AUDIO_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          ...form.getHeaders(),
        },
        body: form,
      });
    } catch (err) {
      console.error("[speech] Network error calling Groq:", err.message);
      return res.status(502).json({
        error: `Failed to reach Groq API: ${err.message}`,
      });
    }

    // ── Handle Groq error response ──────────────────────────────────────────
    if (!groqRes.ok) {
      const body = await groqRes.text().catch(() => "(no body)");
      console.error(`[speech] Groq returned ${groqRes.status}: ${body.slice(0, 300)}`);

      if (groqRes.status === 429) {
        return res.status(429).json({
          error: "Groq Whisper rate limit reached. Please wait a moment and try again.",
        });
      }
      if (groqRes.status === 400) {
        return res.status(400).json({
          error: `Invalid audio file: ${body.slice(0, 200)}`,
        });
      }

      return res.status(502).json({
        error: `Groq API error ${groqRes.status}: ${body.slice(0, 200)}`,
      });
    }

    // ── Parse and return the text ───────────────────────────────────────────
    const data = await groqRes.json();
    const text = data?.text;

    if (!text) {
      return res.status(502).json({
        error: "Groq returned an empty transcription. Check that the audio contains speech.",
      });
    }

    console.log(`[speech] Transcribed ${req.file.size} bytes → "${text.slice(0, 80)}…"`);
    return res.status(200).json({ text });
  }
);

export default router;
