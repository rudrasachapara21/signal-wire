/**
 * geminiService.js
 *
 * Exports two functions:
 *
 *  1. analyzeForFrontend(profile) — NEW
 *     Called by POST /api/analyze-brand.
 *     Uses Gemini with JSON mode to return a schema that matches the frontend
 *     component structure exactly. No Tavily — Gemini's general knowledge is
 *     sufficient for MVP brand strategy generation.
 *
 *  2. generateReport(brandName, description, budget) — LEGACY
 *     Called by POST /api/generate-report.
 *     Fetches live web context via Tavily, then asks Gemini for the richer
 *     report schema (platforms, seasonality, competitors, etc.).
 *     Kept for backward compatibility.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

// ---------------------------------------------------------------------------
// Constants / timeouts
// ---------------------------------------------------------------------------
const TAVILY_API_URL = "https://api.tavily.com/search";
const TAVILY_TIMEOUT_MS = 15_000;
const GEMINI_TIMEOUT_MS = 45_000;

// Top-level keys required by the legacy generateReport schema.
const LEGACY_REQUIRED_KEYS = [
  "brand",
  "platforms",
  "seasonality",
  "competitors",
  "contentFormats",
  "influencers",
  "budgetSplit",
  "adHooks",
  "generatedAt",
];

// ---------------------------------------------------------------------------
// Shared helper: abort-controlled fetch with timeout
// ---------------------------------------------------------------------------
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Shared helper: get a Gemini model instance
// ---------------------------------------------------------------------------
function getGeminiModel(generationConfig = {}) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env file (see .env.example)."
    );
  }
  const genAI = new GoogleGenerativeAI(geminiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig,
  });
}

// ---------------------------------------------------------------------------
// ─── NEW: analyzeForFrontend ─────────────────────────────────────────────────
// ---------------------------------------------------------------------------

/**
 * Frontend-compatible schema that Gemini must return.
 * Mirrors the TypeScript interfaces in src/lib/mock-data.ts exactly.
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
 * Builds the prompt for the /api/analyze-brand endpoint.
 */
function buildFrontendPrompt({ brand_name, sell_type, description, ideal_customer, monthly_budget }) {
  return `You are an expert digital advertising strategist specializing in helping small and medium businesses build effective ad strategies.

Analyze the following brand and generate a practical, actionable advertising strategy report.

BRAND INFORMATION:
- Brand Name: ${brand_name}
- What they sell: ${sell_type}
- Description: ${description}
- Ideal Customer: ${ideal_customer}
- Monthly Ad Budget: ${monthly_budget}

Generate a comprehensive strategy report with the following structure:

1. **reportTitle**: A concise, descriptive title for this strategy report (e.g. "${brand_name} Launch Strategy")

2. **reportDate**: Today's date as a readable string (e.g. "August 7, 2026")

3. **channels**: 3–4 recommended advertising channels/platforms, ordered by priority. For each:
   - name: Platform name (e.g. "Instagram", "TikTok", "Google Search", "YouTube")
   - fit: A percentage 0–100 representing how well this platform fits this brand
   - allocation: Recommended budget percentage as a string (e.g. "45%"). All allocations must sum to 100%.
   - reason: 1–2 sentence explanation tailored specifically to this brand's product, audience, and budget

4. **creators**: 3 archetypal creator/influencer types (NOT real people — generate realistic archetypes that would suit this brand). For each:
   - initials: 2-letter initials based on the archetype name you create
   - name: A plausible creator archetype name (e.g. "Priya Sharma", "Alex Chen")
   - niche: Their content niche (e.g. "Sustainable fashion · GRWM")
   - audience: Typical follower count range (e.g. "84K", "210K")
   - match: A percentage 0–100 representing relevance to this brand

5. **confidenceScore**: An overall strategy confidence score 0–100, based on how well we can predict success given the product type, audience clarity, and budget. Be realistic.

6. **executiveRecommendation**:
   - headline: A single bold, memorable strategic direction sentence
   - body: 2–3 sentences explaining the strategic rationale, referencing the specific product, target audience, and budget

7. **first30Days**: Exactly 4 ordered action strings — specific, practical tasks for the first 30 days of launching this strategy. Each should be a complete sentence.

Make all recommendations specific to this brand — avoid generic advice. Consider the budget, product type, and target audience in every recommendation.`;
}

/**
 * analyzeForFrontend — calls Gemini with JSON mode and returns a response
 * that matches the frontend's rendering schema exactly.
 *
 * @param {object} profile  { brand_name, sell_type, description, ideal_customer, monthly_budget }
 * @returns {Promise<object>}  Validated report matching the frontend schema
 */
export async function analyzeForFrontend(profile) {
  const model = getGeminiModel({
    responseMimeType: "application/json",
    responseSchema: FRONTEND_RESPONSE_SCHEMA,
  });

  const prompt = buildFrontendPrompt(profile);

  // Race the Gemini call against a timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Gemini request timed out after ${GEMINI_TIMEOUT_MS}ms`)),
      GEMINI_TIMEOUT_MS
    )
  );

  let rawText;
  try {
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ]);
    rawText = result.response.text();
  } catch (err) {
    // Re-classify quota errors for clearer messaging
    const msg = err?.message ?? "";
    if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit")) {
      throw new Error(
        "Gemini API quota exceeded. Please wait a minute and try again, or check your API plan."
      );
    }
    throw err;
  }

  // With JSON mode, the SDK guarantees valid JSON — but parse defensively anyway
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Gemini returned non-JSON despite JSON mode. First 300 chars: ${rawText.slice(0, 300)}`
    );
  }

  // Stamp the server's real date — never trust the model's date
  parsed.reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return parsed;
}

// ---------------------------------------------------------------------------
// ─── LEGACY: generateReport (uses Tavily + richer schema) ────────────────────
// ---------------------------------------------------------------------------

async function fetchTavilyContext(brandName, description) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    throw new Error(
      "TAVILY_API_KEY is not set. Add it to your .env file (see .env.example)."
    );
  }

  const query = `${brandName} competitors advertising trends digital marketing 2024 2025`;

  const body = JSON.stringify({
    api_key: tavilyKey,
    query,
    search_depth: "basic",
    include_answer: true,
    include_raw_content: false,
    max_results: 5,
    topic: "general",
  });

  let res;
  try {
    res = await fetchWithTimeout(
      TAVILY_API_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      },
      TAVILY_TIMEOUT_MS
    );
  } catch (err) {
    throw new Error(`Tavily request failed: ${err.message}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(
      `Tavily API returned ${res.status} ${res.statusText}: ${text}`
    );
  }

  const data = await res.json();

  const snippets = (data.results || [])
    .map((r) => `Source: ${r.url}\n${r.content}`)
    .join("\n\n");

  const answer = data.answer ? `Summary: ${data.answer}\n\n` : "";

  return `${answer}${snippets}`.trim() || "No external context available.";
}

async function callGeminiLegacy(prompt) {
  const model = getGeminiModel();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Gemini request timed out after ${GEMINI_TIMEOUT_MS}ms`)),
      GEMINI_TIMEOUT_MS
    )
  );

  const result = await Promise.race([
    model.generateContent(prompt),
    timeoutPromise,
  ]);

  return result.response.text();
}

function parseAndValidateLegacy(rawText) {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Model returned non-JSON output. Raw response (first 300 chars): ${cleaned.slice(0, 300)}`
    );
  }

  const missing = LEGACY_REQUIRED_KEYS.filter((k) => !(k in parsed));
  if (missing.length > 0) {
    throw new Error(
      `Model JSON is missing required fields: ${missing.join(", ")}`
    );
  }

  return parsed;
}

function buildLegacyPrompt(brandName, description, budget, webContext) {
  return `You are an expert digital advertising strategist. Analyze the brand below and produce a comprehensive ad-strategy report.

BRAND INFORMATION:
- Name: ${brandName}
- Description: ${description}
- Monthly Ad Budget (USD): ${budget}

EXTERNAL MARKET CONTEXT (from live web search):
${webContext}

INSTRUCTIONS:
Return ONLY a single valid JSON object. No markdown fences, no explanatory prose, no comments — pure JSON only.
The JSON must match this exact schema (all fields required):

{
  "brand": {
    "name": "string – brand name",
    "description": "string – brand description",
    "budget": number – monthly budget as a number
  },
  "platforms": [
    {
      "name": "string – platform name (e.g. Instagram, TikTok, Google Ads)",
      "icon": "string – a single relevant emoji for the platform",
      "reason": "string – 1-2 sentence rationale",
      "confidence": "string – must be exactly \"High\" or \"Medium\" (no other values)"
    }
  ],
  "seasonality": {
    "currentSignal": "string – e.g. 'Peak Season', 'Off Season', 'Ramp-Up'",
    "signalStrength": number – 0-100,
    "summary": "string – 2-3 sentence seasonal insight",
    "months": [
      { "month": "string – abbreviated month e.g. Jan", "index": number – relative demand 0-100 }
    ]
  },
  "competitors": [
    {
      "name": "string – competitor brand name",
      "strength": "string – their main competitive advantage",
      "gap": "string – opportunity this brand can exploit"
    }
  ],
  "contentFormats": [
    {
      "format": "string – e.g. Short-form Video, Carousel, Story",
      "priority": "string – must be exactly \"Primary\", \"Secondary\", or \"Tertiary\" (no other values)",
      "description": "string – 1 sentence on why this format works"
    }
  ],
  "influencers": [
    {
      "category": "string – e.g. Micro-influencers (10k-100k), Nano-influencers",
      "rationale": "string – why this tier suits the brand and budget"
    }
  ],
  "budgetSplit": [
    {
      "platform": "string – platform name",
      "percentage": number – integer percentage, all must sum to 100
    }
  ],
  "adHooks": [
    "string – a punchy, ready-to-use ad headline or hook (provide 4-6 hooks)"
  ],
  "generatedAt": "string – current ISO 8601 timestamp"
}

Important constraints:
- platforms array: include 3-5 recommended platforms, ordered by priority.
- seasonality.months: include all 12 months.
- competitors: include 2-4 real competitors based on the web context.
- contentFormats: include 3-5 formats.
- influencers: include 2-3 tiers.
- budgetSplit percentages MUST sum to exactly 100.
- adHooks: provide exactly 5 hooks.
- generatedAt must be the actual current UTC time in ISO 8601 format.

Now produce the JSON report:`;
}

/**
 * generateReport — LEGACY. Fetches live web context via Tavily, then asks
 * Gemini to produce the richer ad-strategy JSON report.
 *
 * @param {string} brandName
 * @param {string} description
 * @param {number|string} budget  Monthly budget in USD
 * @returns {Promise<object>}     Validated report object
 */
export async function generateReport(brandName, description, budget) {
  const webContext = await fetchTavilyContext(brandName, description);
  const prompt = buildLegacyPrompt(brandName, description, Number(budget), webContext);
  const rawText = await callGeminiLegacy(prompt);
  const report = parseAndValidateLegacy(rawText);
  report.generatedAt = new Date().toISOString();
  return report;
}
