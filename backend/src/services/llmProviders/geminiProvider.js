/**
 * geminiProvider.js
 *
 * Wraps the existing Gemini logic from geminiService.js as a provider
 * conforming to the same interface as groqProvider and openrouterProvider.
 *
 * This is the FINAL fallback in the chain — it uses the Gemini SDK with
 * JSON mode and responseSchema for the strongest output guarantees.
 *
 * Interface: async generateStrategy(promptText) => raw JSON string
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-2.0-flash-lite";
const GEMINI_TIMEOUT_MS = 45_000;

/**
 * The response schema that Gemini enforces via JSON mode.
 * Must exactly match the frontend's rendering expectations.
 */
const FRONTEND_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reportTitle: { type: "string" },
    reportDate: { type: "string" },
    channels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          fit: { type: "number" },
          allocation: { type: "string" },
          reason: { type: "string" },
        },
        required: ["name", "fit", "allocation", "reason"],
      },
    },
    creators: {
      type: "array",
      items: {
        type: "object",
        properties: {
          initials: { type: "string" },
          name: { type: "string" },
          niche: { type: "string" },
          audience: { type: "string" },
          match: { type: "number" },
        },
        required: ["initials", "name", "niche", "audience", "match"],
      },
    },
    confidenceScore: { type: "number" },
    executiveRecommendation: {
      type: "object",
      properties: {
        headline: { type: "string" },
        body: { type: "string" },
      },
      required: ["headline", "body"],
    },
    first30Days: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "reportTitle",
    "reportDate",
    "channels",
    "creators",
    "confidenceScore",
    "executiveRecommendation",
    "first30Days",
  ],
};

/**
 * @param {string} promptText
 * @returns {Promise<string>}  Raw JSON string
 * @throws {Error}             Tagged with status where possible (429 for quota)
 */
export async function generateStrategy(promptText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: FRONTEND_RESPONSE_SCHEMA,
    },
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Gemini request timed out after ${GEMINI_TIMEOUT_MS}ms`)),
      GEMINI_TIMEOUT_MS
    )
  );

  let result;
  try {
    result = await Promise.race([model.generateContent(promptText), timeoutPromise]);
  } catch (err) {
    const msg = err?.message ?? "";
    // Normalize quota/rate-limit errors so the orchestrator can classify them
    if (
      msg.includes("429") ||
      msg.toLowerCase().includes("quota") ||
      msg.toLowerCase().includes("rate limit") ||
      msg.toLowerCase().includes("resource_exhausted")
    ) {
      throw new Error(`429: Gemini quota exceeded — ${msg}`);
    }
    throw err;
  }

  return result.response.text();
}
