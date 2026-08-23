/**
 * llmOrchestrator.js
 *
 * Multi-provider LLM fallback chain with Zod schema validation & auto-repair.
 *
 * Execution order: Groq → OpenRouter → Gemini
 *
 * Auto-repair pattern:
 *   If a provider's output fails Zod schema validation (e.g. string instead of number,
 *   markdown syntax leaking into text, channel allocations not summing to ~100%),
 *   the orchestrator logs the specific errors and re-prompts the SAME provider ONCE
 *   with feedback detailing the errors to fix. If repair also fails, it falls through
 *   to the next provider.
 *
 * Public exports:
 *   analyzeForFrontend(profile)
 *   refineReport(params)
 */

import * as groq from "./llmProviders/groqProvider.js";
import * as openrouter from "./llmProviders/openrouterProvider.js";
import * as gemini from "./llmProviders/geminiProvider.js";
import { searchAndGetCreators } from "./creatorSearch.js";
import { validateReport } from "../schemas/reportSchema.js";
import { calculateConfidenceFactors } from "./reportScoring.js";

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

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
// Helper: JSON cleaner & parser
// ---------------------------------------------------------------------------

function tryParseJson(rawText) {
  if (typeof rawText !== "string") return null;
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core fallback & auto-repair logic
// ---------------------------------------------------------------------------

/**
 * Tries each provider in order. Parses JSON, validates output using Zod schema,
 * and attempts an auto-repair re-prompt with the same provider if validation fails.
 *
 * @param {string} promptText
 * @returns {Promise<object>}  Validated, schema-conforming report object
 * @throws {Error}             Starting with "ALL_PROVIDERS_FAILED:" if all fail
 */
async function generateAndValidateWithFallback(promptText) {
  const failures = [];

  for (const { name, module } of PROVIDERS) {
    try {
      console.log(`[LLM] Attempting provider: ${name} …`);
      const rawText = await module.generateStrategy(promptText);
      let parsed = tryParseJson(rawText);

      if (parsed) {
        // Stamp a placeholder date if missing so schema validation passes
        if (!parsed.reportDate) {
          parsed.reportDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }

        const validation = validateReport(parsed);
        if (validation.success) {
          console.log(`[LLM] ✅ Served by: ${name} (valid output)`);
          return validation.data;
        }

        // Validation failed -> log specific errors and attempt AUTO-REPAIR with SAME provider
        console.warn(`[LLM] ⚠️  ${name} validation failed:`, validation.errors);

        const repairPrompt = `${promptText}

IMPORTANT AUTO-REPAIR INSTRUCTION:
Your previous response had these specific validation problems:
${validation.errors.map((err) => `- ${err}`).join("\n")}

Please fix ALL problems listed above and return ONLY a valid JSON object matching the required structure. Plain text only (no markdown symbols *, _, #, \`), correct numeric types for numbers, and channel budget allocations summing to 100%.`;

        console.log(`[LLM] 🔄 Attempting auto-repair with provider: ${name} …`);
        try {
          const repairRawText = await module.generateStrategy(repairPrompt);
          let repairParsed = tryParseJson(repairRawText);

          if (repairParsed) {
            if (!repairParsed.reportDate) {
              repairParsed.reportDate = new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            }

            const repairValidation = validateReport(repairParsed);
            if (repairValidation.success) {
              console.log(`[LLM] ✅ Served by: ${name} (auto-repair succeeded!)`);
              return repairValidation.data;
            }

            console.warn(
              `[LLM] ❌ ${name} auto-repair validation failed:`,
              repairValidation.errors
            );
            failures.push(
              `${name} (repair failed validation: ${repairValidation.errors.join("; ")})`
            );
          } else {
            console.warn(`[LLM] ❌ ${name} auto-repair returned non-JSON output`);
            failures.push(`${name} (repair returned non-JSON)`);
          }
        } catch (repairErr) {
          console.warn(`[LLM] ❌ ${name} auto-repair API call failed: ${repairErr.message}`);
          failures.push(`${name} (repair API error: ${repairErr.message})`);
        }
      } else {
        console.warn(`[LLM] ❌ ${name} returned non-JSON output`);
        failures.push(`${name}: non-JSON response`);
      }
    } catch (err) {
      const msg = err?.message ?? "Unknown error";
      if (isRateLimitError(err)) {
        console.warn(`[LLM] ⚠️  ${name} RATE LIMITED: ${msg}`);
      } else {
        console.warn(`[LLM] ❌ ${name} FAILED: ${msg}`);
      }
      failures.push(`${name}: ${msg}`);
    }
  }

  // All providers exhausted
  const summary = failures.join(" | ");
  throw new Error(
    `ALL_PROVIDERS_FAILED: All AI providers are currently unavailable, please try again in a few minutes. Details — ${summary}`
  );
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

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
      "match": number — 0–100 relevance score,
      "verified": false
    }
  ],
  "confidenceScore": number — 0–100 overall strategy confidence,
  "executiveRecommendation": {
    "headline": "string — one concise plain-text strategic direction (no markdown, no asterisks)",
    "body": "string — 2–3 sentence rationale referencing product, audience, and budget (no markdown)"
  },
  "first30Days": [
    "string — specific action sentence (exactly 4 items, no markdown formatting)"
  ]
}

CONSTRAINTS:
- channels: 3–4 items, allocations must sum to exactly 100%
- creators: exactly 3 archetype entries (not real people)
- first30Days: exactly 4 items; do NOT reference creator names in these steps — write platform and tactic actions only
- executiveRecommendation.headline and body: plain text only, absolutely no ** * _ # or any markdown symbols
- All recommendations must be specific to this brand — avoid generic advice
- Return ONLY the JSON object, no markdown fences, no prose`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * analyzeForFrontend — calls the provider fallback chain with Zod schema validation
 * and returns a validated report object matching the frontend schema.
 *
 * @param {object} profile  { brand_name, sell_type, description, ideal_customer, monthly_budget }
 * @returns {Promise<object>}  Validated report
 */
export async function analyzeForFrontend(profile) {
  const prompt = buildFrontendPrompt(profile);

  const CREATOR_SEARCH_TIMEOUT_MS = 8_000;
  const creatorSearchPromise = Promise.race([
    searchAndGetCreators(profile, 3),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Creator search timed out after 8s")),
        CREATOR_SEARCH_TIMEOUT_MS
      )
    ),
  ]);

  // Main report generation with Zod validation + auto-repair
  const report = await generateAndValidateWithFallback(prompt);

  // Always stamp the server's real date
  report.reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Ensure creators have verified boolean
  if (Array.isArray(report.creators)) {
    report.creators = report.creators.map((c) => ({
      ...c,
      verified: c.verified ?? false,
    }));
  }

  // Merge creator search results if real creators were found
  try {
    const creatorResult = await creatorSearchPromise;
    if (creatorResult?.creators?.length > 0) {
      console.log(
        `[orchestrator] Creator search succeeded: ${creatorResult.meta.realFound} real, ` +
        `${creatorResult.meta.archetypesFilled} archetype, ` +
        `${creatorResult.meta.totalTime}ms`
      );
      report.creators = creatorResult.creators.map((c) => ({
        ...c,
        verified: c.verified ?? false,
      }));
      report._creatorSearchMeta = creatorResult.meta;
    }
  } catch (err) {
    console.warn(`[orchestrator] Creator search skipped: ${err.message}`);
    report._creatorSearchMeta = { error: err.message, realFound: 0 };
  }

  // Calculate deterministic confidence score from real pipeline signals
  const scoring = calculateConfidenceFactors(profile, report);
  report.confidenceScore = scoring.calculatedConfidenceScore;
  report._confidenceFactors = scoring.factors;

  console.log(
    `[orchestrator] Confidence score calculated: ${report.confidenceScore} ` +
    `(completeness=${scoring.factors.completeness}, budgetRealism=${scoring.factors.budgetRealism}, ` +
    `creatorVerification=${scoring.factors.creatorVerification}, dataAvailability=${scoring.factors.categoryDataAvailability})`
  );

  return report;
}

// ---------------------------------------------------------------------------
// Refinement prompt builder
// ---------------------------------------------------------------------------

function buildRefinementPrompt({ brandProfile, existingReport, refinementRequest }) {
  const profileStr = brandProfile
    ? `- Brand Name: ${brandProfile.brand_name ?? ""}
- What they sell: ${brandProfile.sell_type ?? ""}
- Description: ${brandProfile.description ?? ""}
- Ideal Customer: ${brandProfile.ideal_customer ?? ""}
- Monthly Ad Budget: ${brandProfile.monthly_budget ?? ""}`
    : "(original brand profile not available)";

  const existingStr = JSON.stringify(existingReport, null, 2);

  return `You are an expert digital advertising strategist. A user has an existing ad strategy report and wants a specific change applied to it.

ORIGINAL BRAND PROFILE:
${profileStr}

EXISTING STRATEGY REPORT (JSON):
${existingStr}

USER'S REFINEMENT REQUEST:
"${refinementRequest}"

INSTRUCTIONS:
- Apply the user's requested change to the report. Change ONLY what is relevant to their request.
- If they mention budget, update channel allocations accordingly. If they mention a platform, adjust that platform's fit score, allocation and reason. If they mention a new audience, update relevant fields.
- Keep all other sections that are unaffected by the change identical or nearly identical — this is a targeted edit, not a new report.
- Update the executiveRecommendation to reflect the change if applicable.
- Return the FULL updated report as a single valid JSON object with the same structure as the existing report (same keys: reportTitle, reportDate, channels, creators, confidenceScore, executiveRecommendation, first30Days).
- All constraints still apply: channels allocations must sum to 100%, exactly 3 creators, exactly 4 first30Days items, no markdown in any string field.
- Do NOT reference the refinement request itself in the report text — just incorporate the change naturally.
- Return ONLY the JSON object, no markdown fences, no prose.`;
}

/**
 * refineReport — takes an existing report + brand profile + user refinement request,
 * validates output with Zod schema, and auto-repairs if needed.
 *
 * @param {object} params
 * @returns {Promise<object>}  Validated refined report
 */
export async function refineReport({ brandProfile, existingReport, refinementRequest }) {
  const prompt = buildRefinementPrompt({ brandProfile, existingReport, refinementRequest });

  const report = await generateAndValidateWithFallback(prompt);

  report.reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (Array.isArray(report.creators)) {
    report.creators = report.creators.map((c) => ({
      ...c,
      verified: c.verified ?? false,
    }));
  }

  const scoring = calculateConfidenceFactors(brandProfile ?? {}, report);
  report.confidenceScore = scoring.calculatedConfidenceScore;
  report._confidenceFactors = scoring.factors;

  return report;
}
