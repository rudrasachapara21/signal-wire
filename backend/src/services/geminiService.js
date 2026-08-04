/**
 * geminiService.js
 *
 * Exports generateReport(brandName, description, budget).
 *
 * Flow:
 *  1. Validate env keys up-front so failures are obvious.
 *  2. Call Tavily Search API to pull competitor/trend context.
 *  3. Build a Gemini prompt that includes that context.
 *  4. Parse the raw model output as JSON, validate the top-level schema.
 *  5. Return the structured report object.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

// ---------------------------------------------------------------------------
// Constants / timeouts
// ---------------------------------------------------------------------------
const TAVILY_API_URL = "https://api.tavily.com/search";
const TAVILY_TIMEOUT_MS = 15_000;
const GEMINI_TIMEOUT_MS = 30_000;

// The exact top-level keys that must be present in the model's JSON output.
const REQUIRED_KEYS = [
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
// Helper: abort-controlled fetch with a timeout
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
// Step 1 – Tavily search
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

  // Collect the top result snippets as context paragraphs.
  const snippets = (data.results || [])
    .map((r) => `Source: ${r.url}\n${r.content}`)
    .join("\n\n");

  const answer = data.answer ? `Summary: ${data.answer}\n\n` : "";

  return `${answer}${snippets}`.trim() || "No external context available.";
}

// ---------------------------------------------------------------------------
// Step 2 – Gemini call with timeout
// ---------------------------------------------------------------------------
async function callGemini(prompt) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env file (see .env.example)."
    );
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  // Wrap the SDK call in a manual timeout race because the SDK does not expose
  // a built-in AbortSignal option in all versions.
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

// ---------------------------------------------------------------------------
// Step 3 – Parse & validate the model's JSON
// ---------------------------------------------------------------------------
function parseAndValidate(rawText) {
  // Strip accidental markdown fences the model might emit despite instructions.
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

  // Validate top-level keys.
  const missing = REQUIRED_KEYS.filter((k) => !(k in parsed));
  if (missing.length > 0) {
    throw new Error(
      `Model JSON is missing required fields: ${missing.join(", ")}`
    );
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Step 4 – Build Gemini prompt
// ---------------------------------------------------------------------------
function buildPrompt(brandName, description, budget, webContext) {
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
      "confidence": "string – must be exactly \"High\" or \"Medium\" (no other values)",
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

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------
/**
 * generateReport – fetches live web context via Tavily, then asks Gemini to
 * produce a structured ad-strategy JSON report for the given brand.
 *
 * @param {string} brandName
 * @param {string} description
 * @param {number|string} budget  Monthly budget in USD
 * @returns {Promise<object>}     Validated report object
 */
export async function generateReport(brandName, description, budget) {
  // 1. Fetch live web context (fail loudly so the caller can handle it)
  const webContext = await fetchTavilyContext(brandName, description);

  // 2. Build the prompt
  const prompt = buildPrompt(brandName, description, Number(budget), webContext);

  // 3. Call Gemini
  const rawText = await callGemini(prompt);

  // 4. Parse & validate
  const report = parseAndValidate(rawText);

  // 5. Override generatedAt with the real server timestamp.
  //    LLMs have no real clock — they confabulate plausible-looking but wrong
  //    dates. Never trust the model's value; always use the server clock.
  report.generatedAt = new Date().toISOString();

  return report;
}
