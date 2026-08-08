/**
 * llmOrchestrator.js
 *
 * Multi-provider LLM fallback chain for the brand analysis feature.
 *
 * Execution order: Groq → OpenRouter → Gemini
 *
 * Failure classification:
 *   - RATE_LIMIT: HTTP 429, or message contains "429", "quota", "rate limit",
 *                 "too many requests", "resource_exhausted"
 *   - OTHER:      Everything else (network failure, invalid key, timeout, etc.)
 *
 * Both types fall through to the next provider, but are logged differently so
 * you can see at a glance whether you're hitting rate limits or config issues.
 *
 * If ALL THREE providers fail, throws an Error with message starting with
 * "ALL_PROVIDERS_FAILED:" so the route handler can return a clean 503.
 *
 * Public export:
 *   analyzeForFrontend(profile) — drop-in replacement for the one that was
 *   in geminiService.js; same input shape, same output schema.
 */

import * as groq from "./llmProviders/groqProvider.js";
import * as openrouter from "./llmProviders/openrouterProvider.js";
import * as gemini from "./llmProviders/geminiProvider.js";

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

/**
 * Returns true if the error looks like a rate-limit / quota issue.
 * We check both the HTTP status prefix our providers inject ("429: ...") and
 * common phrases that appear in provider error bodies.
 */
function isRateLimitError(err) {
  const msg = (err?.message ?? "").toLowerCase();
  return (
    msg.startsWith("429:") ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("rate_limit") ||
    msg.includes("too many requests") ||
    msg.includes("resource_exhausted") ||
    msg.includes("tokens per") ||
    msg.includes("requests per")
  );
}

// ---------------------------------------------------------------------------
// Provider list — order determines fallback priority
// ---------------------------------------------------------------------------

const PROVIDERS = [
  { name: "Groq", module: groq },
  { name: "OpenRouter", module: openrouter },
  { name: "Gemini", module: gemini },
];

// ---------------------------------------------------------------------------
// Core fallback logic
// ---------------------------------------------------------------------------

/**
 * Tries each provider in order. Logs success/failure for every attempt.
 *
 * @param {string} promptText
 * @returns {Promise<string>}  Raw JSON string from whichever provider succeeded
 * @throws {Error}             Starting with "ALL_PROVIDERS_FAILED:" if all fail
 */
async function generateWithFallback(promptText) {
  const failures = [];

  for (const { name, module } of PROVIDERS) {
    try {
      console.log(`[LLM] Attempting provider: ${name} …`);
      const rawText = await module.generateStrategy(promptText);
      console.log(`[LLM] ✅ Served by: ${name}`);
      return rawText;
    } catch (err) {
      const msg = err?.message ?? "Unknown error";

      if (isRateLimitError(err)) {
        console.warn(`[LLM] ⚠️  ${name} RATE LIMITED: ${msg}`);
      } else {
        console.warn(`[LLM] ❌ ${name} FAILED (non-rate-limit): ${msg}`);
      }

      failures.push(`${name}: ${msg}`);
      // Always fall through to next provider regardless of error type
    }
  }

  // All providers exhausted
  const summary = failures.join(" | ");
  throw new Error(
    `ALL_PROVIDERS_FAILED: All AI providers are currently unavailable, please try again in a few minutes. Details — ${summary}`
  );
}

// ---------------------------------------------------------------------------
// Prompt builder (moved here from geminiService.js)
// ---------------------------------------------------------------------------

/**
 * Builds the brand-analysis prompt shared by all providers.
 * The instruction to return JSON is included so even providers without
 * a native JSON mode receive the constraint via the system prompt.
 */
function buildFrontendPrompt({
  brand_name,
  sell_type,
  description,
  ideal_customer,
  monthly_budget,
}) {
  return `You are an expert digital advertising strategist specializing in helping small and medium businesses build effective ad strategies.

Analyze the following brand and generate a practical, actionable advertising strategy report.

BRAND INFORMATION:
- Brand Name: ${brand_name}
- What they sell: ${sell_type}
- Description: ${description}
- Ideal Customer: ${ideal_customer}
- Monthly Ad Budget: ${monthly_budget}

Generate a comprehensive strategy report as a single valid JSON object with the following structure (all fields required):

{
  "reportTitle": "string — concise title e.g. '${brand_name} Launch Strategy'",
  "reportDate": "string — today's date e.g. 'August 8, 2026'",
  "channels": [
    {
      "name": "string — platform name (e.g. Instagram, TikTok, Google Search)",
      "fit": number — 0–100 fit score for this brand,
      "allocation": "string — budget % e.g. '45%' (all must sum to 100%)",
      "reason": "string — 1–2 sentence rationale specific to this brand"
    }
  ],
  "creators": [
    {
      "initials": "string — 2-letter initials",
      "name": "string — plausible archetype name (NOT a real person)",
      "niche": "string — content niche e.g. 'Sustainable fashion · GRWM'",
      "audience": "string — follower count range e.g. '84K'",
      "match": number — 0–100 relevance score
    }
  ],
  "confidenceScore": number — 0–100 overall strategy confidence,
  "executiveRecommendation": {
    "headline": "string — single bold strategic direction",
    "body": "string — 2–3 sentence rationale referencing product, audience, and budget"
  },
  "first30Days": [
    "string — specific action sentence (exactly 4 items)"
  ]
}

CONSTRAINTS:
- channels: 3–4 items, allocations must sum to exactly 100%
- creators: exactly 3 archetype entries (not real people)
- first30Days: exactly 4 items
- All recommendations must be specific to this brand — avoid generic advice
- Return ONLY the JSON object, no markdown fences, no prose`;
}

// ---------------------------------------------------------------------------
// Required field validation
// ---------------------------------------------------------------------------

const REQUIRED_FRONTEND_KEYS = [
  "reportTitle",
  "reportDate",
  "channels",
  "creators",
  "confidenceScore",
  "executiveRecommendation",
  "first30Days",
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * analyzeForFrontend — calls the provider fallback chain and returns a
 * validated report object matching the frontend schema exactly.
 *
 * This is a drop-in replacement for the function previously in geminiService.js.
 *
 * @param {object} profile  { brand_name, sell_type, description, ideal_customer, monthly_budget }
 * @returns {Promise<object>}  Validated report
 */
export async function analyzeForFrontend(profile) {
  const prompt = buildFrontendPrompt(profile);
  const rawText = await generateWithFallback(prompt);

  // Strip any accidental markdown fences (non-JSON-mode providers might add them)
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `LLM returned non-JSON output. First 300 chars: ${cleaned.slice(0, 300)}`
    );
  }

  // Validate required fields
  const missing = REQUIRED_FRONTEND_KEYS.filter((k) => !(k in parsed));
  if (missing.length > 0) {
    throw new Error(
      `LLM response missing required fields: ${missing.join(", ")}`
    );
  }

  // Always stamp the server's real date — never trust model-generated dates
  parsed.reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return parsed;
}
