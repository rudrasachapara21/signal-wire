/**
 * creatorSearch.js
 *
 * Iterative creator-discovery pipeline inspired by the dzhng/deep-research
 * architecture (query generation → parallel search → extraction → synthesis).
 *
 * Key design decisions adapted for our stack:
 *   - Query generation: Groq LLM infers niche expansions from brand description
 *     (no hardcoded keyword dictionary)
 *   - Parallel search: all queries run concurrently via Tavily
 *   - Extraction: second Groq call processes raw search text into structured
 *     Creator objects — ONLY names explicitly present in the source text
 *   - Fallback: if real count < needed, archetype creators fill the gap,
 *     tagged with `verified: false`; real ones get `verified: true`
 *
 * Public API:
 *   searchAndGetCreators(brandProfile, neededCount) → Promise<Creator[]>
 */

import fetch from "node-fetch";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "groq/compound-mini";
const TAVILY_API_URL = "https://api.tavily.com/search";
const SEARCH_TIMEOUT_MS = 12_000;
const GROQ_TIMEOUT_MS = 20_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function validateInstagramUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return null;
  const trimmed = urlStr.trim();
  const match = trimmed.match(/^https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?$/i);
  if (!match) return null;
  const handle = match[1].toLowerCase();
  const reserved = new Set([
    "p", "reels", "reel", "explore", "stories", "tv", "direct", "accounts",
    "developer", "about", "help", "legal", "terms", "privacy", "directory", "download"
  ]);
  if (reserved.has(handle)) return null;
  return `https://www.instagram.com/${handle}/`;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callGroq(systemMsg, userMsg) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    throw new Error("GROQ_API_KEY is not set.");
  }

  const res = await fetchWithTimeout(
    GROQ_API_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 1024,
      }),
    },
    GROQ_TIMEOUT_MS
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Groq API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content.");
  return content;
}

function parseJson(raw) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Step 1 — generateSearchQueries
// ---------------------------------------------------------------------------

/**
 * Uses Groq to generate 4-5 targeted search queries for finding real
 * Instagram/social media creators relevant to the brand.
 *
 * The LLM infers niche expansions from the brand description itself —
 * no hardcoded keyword dictionaries.
 *
 * @param {object} brandProfile  { brand_name, sell_type, description, ideal_customer, monthly_budget }
 * @returns {Promise<string[]>}  Array of search query strings
 */
export async function generateSearchQueries(brandProfile) {
  const { brand_name, sell_type, description, ideal_customer } = brandProfile;

  const systemMsg = `You are an influencer marketing research specialist. 
You generate highly targeted web search queries to find REAL, named social media creators (influencers) on Instagram, YouTube, and similar platforms.
Always respond with valid JSON only — no markdown fences, no prose.`;

  const userMsg = `Generate 4-5 specific web search queries to find REAL, named influencers/creators that would be perfect partners for this brand.

BRAND INFORMATION:
- Brand Name: ${brand_name}
- What they sell: ${sell_type}
- Description: ${description}
- Ideal Customer: ${ideal_customer}

REQUIREMENTS:
- Each query must be targeted at finding NAMED creators/influencers with their Instagram handles or social profiles
- Expand into related niches, sub-categories, and adjacent topics the LLM infers from the description
- Include regional/geographic qualifiers where relevant (infer from description)
- Vary query formats: some "top X influencers", some "best Y content creators", some "Z Instagram handles"
- Queries should find real people searchable on the web, not fictional archetypes
- Include the year 2025 or 2026 in at least 2 queries to get fresh results

Return ONLY a JSON object:
{
  "queries": [
    "query string 1",
    "query string 2",
    "query string 3",
    "query string 4",
    "query string 5"
  ],
  "reasoning": "brief explanation of niche expansions chosen"
}`;

  const raw = await callGroq(systemMsg, userMsg);
  const parsed = parseJson(raw);

  if (!Array.isArray(parsed.queries) || parsed.queries.length === 0) {
    throw new Error("generateSearchQueries: LLM returned no queries.");
  }

  console.log(`[creatorSearch] Generated ${parsed.queries.length} queries. Reasoning: ${parsed.reasoning}`);
  return parsed.queries.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Step 2 — searchCreators
// ---------------------------------------------------------------------------

/**
 * Runs each query through Tavily in parallel, dedupes by URL, and returns
 * all combined result text for the extraction step.
 *
 * Biases a subset of queries specifically to instagram.com while leaving others broad.
 *
 * @param {string[]} queries
 * @returns {Promise<string>}  Combined search result text (deduplicated by URL)
 */
export async function searchCreators(queries) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    throw new Error("TAVILY_API_KEY is not set.");
  }

  // Run all queries in parallel, biasing a subset to instagram.com specifically
  const results = await Promise.allSettled(
    queries.map(async (query, idx) => {
      const bodyObj = {
        api_key: tavilyKey,
        query,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
        max_results: 5,
        topic: "general",
      };

      // Bias the first 3 queries specifically to Instagram
      if (idx < 3) {
        bodyObj.include_domains = ["instagram.com"];
      }

      const body = JSON.stringify(bodyObj);

      const res = await fetchWithTimeout(
        TAVILY_API_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
        SEARCH_TIMEOUT_MS
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "(no body)");
        throw new Error(`Tavily ${res.status}: ${text.slice(0, 100)}`);
      }

      const data = await res.json();
      return { query, results: data.results || [] };
    })
  );

  // Collect all results, dedupe by URL
  const seenUrls = new Set();
  const allSnippets = [];

  for (const settled of results) {
    if (settled.status === "rejected") {
      console.warn(`[creatorSearch] Query failed: ${settled.reason?.message}`);
      continue;
    }

    const { query, results: items } = settled.value;
    allSnippets.push(`\n=== Search: "${query}" ===`);

    for (const item of items) {
      if (seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);
      allSnippets.push(`Source: ${item.url}\n${item.content}`);
    }
  }

  const combined = allSnippets.join("\n\n");
  console.log(
    `[creatorSearch] Got ${seenUrls.size} unique URLs from ${results.filter((r) => r.status === "fulfilled").length}/${queries.length} queries`
  );
  return combined;
}

// ---------------------------------------------------------------------------
// Step 3 — extractCreatorsFromResults
// ---------------------------------------------------------------------------

/**
 * Second Groq LLM call: extracts ONLY creators explicitly named in the
 * search result text. Will NOT invent names.
 *
 * @param {string} searchResults   Raw combined search text from searchCreators()
 * @param {object} brandProfile    Brand context for relevance scoring
 * @returns {Promise<object[]>}    Array of Creator objects with `verified: true`
 */
export async function extractCreatorsFromResults(searchResults, brandProfile) {
  const { brand_name, description } = brandProfile;

  // Truncate to avoid token overflow — keep first 8000 chars
  const truncated = searchResults.slice(0, 8000);

  const systemMsg = `You are an expert at extracting structured data from web search results.
You ONLY extract creators/influencers whose names or handles are EXPLICITLY mentioned in the provided text.
You NEVER invent, fabricate, or hallucinate names not found in the source text.
Always respond with valid JSON only — no markdown fences.`;

  const userMsg = `Extract real social media creators/influencers from these web search results that would be relevant for this brand:

BRAND: ${brand_name}
CONTEXT: ${description}

SEARCH RESULTS:
${truncated}

INSTRUCTIONS:
- Extract ONLY creators whose names or Instagram/social handles are explicitly stated in the text above
- For profile_url: extract the creator's actual Instagram profile URL (e.g. https://www.instagram.com/username/ or instagram.com/username) if mentioned in the snippet text or source URLs. If no direct Instagram profile URL is associated with them, set profile_url to null.
- For the audience field: use the follower count ONLY if it is explicitly stated in the text (e.g. "250K followers", "1.2M subscribers"). If no count is in the text, return null — do NOT guess or make up a number.
- Score match relevance 0-100 based on how well they fit the brand
- If you find fewer than 3, return only what you actually found — do NOT make up extras
- Initials = first 2 letters of their name

Return ONLY this JSON:
{
  "creators": [
    {
      "initials": "string — 2 letters",
      "name": "string — full name or handle as it appeared in the search text",
      "niche": "string — their content category e.g. 'Fitness · Supplements'",
      "audience": "string like '250K' or '1.2M' if mentioned in text, or null if not found",
      "match": number — 0-100 relevance to this brand,
      "profile_url": "string — direct Instagram profile URL like https://www.instagram.com/username/ if present in text/sources, or null"
    }
  ]
}`;

  const raw = await callGroq(systemMsg, userMsg);
  const parsed = parseJson(raw);

  if (!Array.isArray(parsed.creators)) {
    return [];
  }

  // Normalise audience: collapse empty strings, "Unknown", "unknown",
  // "N/A", "n/a", "0", and whitespace-only values to null so the frontend
  // has an unambiguous signal to omit the follower line.
  const UNKNOWN_TOKENS = new Set(["unknown", "n/a", "na", "none", "0", ""]);
  const normaliseAudience = (raw) => {
    if (raw === null || raw === undefined) return null;
    const trimmed = String(raw).trim();
    if (UNKNOWN_TOKENS.has(trimmed.toLowerCase())) return null;
    return trimmed;
  };

  // Tag all real search results as verified and validate profile URL
  return parsed.creators.map((c) => {
    const rawUrl = c.profile_url || c.source_url || null;
    const validUrl = validateInstagramUrl(rawUrl);
    return {
      initials: c.initials,
      name: c.name,
      niche: c.niche,
      audience: normaliseAudience(c.audience),
      match: c.match,
      profileUrl: validUrl,
      verified: true,
    };
  });
}

// ---------------------------------------------------------------------------
// Step 4 — Archetype fallback generator
// ---------------------------------------------------------------------------

/**
 * Generates archetype (AI-invented) creator profiles for the fallback case.
 * These are NOT real people — clearly marked with `verified: false`.
 *
 * @param {object} brandProfile
 * @param {number} count  How many archetypes to generate
 * @returns {Promise<object[]>}  Creator objects with `verified: false`
 */
async function generateArchetypeCreators(brandProfile, count) {
  const { brand_name, sell_type, description, ideal_customer } = brandProfile;

  const systemMsg = `You are an expert digital advertising strategist. Always respond with valid JSON only.`;

  const userMsg = `Generate ${count} realistic but fictional creator archetype profiles for influencer marketing.
These are plausible persona types — NOT real people.

BRAND: ${brand_name}
SELLS: ${sell_type}
DESCRIPTION: ${description}
IDEAL CUSTOMER: ${ideal_customer}

Return ONLY this JSON:
{
  "creators": [
    {
      "initials": "string — 2 letters",
      "name": "string — plausible persona name (NOT a real person)",
      "niche": "string — content niche",
      "audience": "string — follower count range e.g. '84K'",
      "match": number — 0-100
    }
  ]
}`;

  try {
    const raw = await callGroq(systemMsg, userMsg);
    const parsed = parseJson(raw);

    if (!Array.isArray(parsed.creators)) return [];

    return parsed.creators.slice(0, count).map((c) => ({
      ...c,
      profileUrl: null,
      verified: false,
    }));
  } catch (err) {
    console.warn(`[creatorSearch] Archetype fallback failed: ${err.message}`);
    // Last-resort: derive plausible archetypes from the brand profile so they
    // at least match the correct niche — never generic cross-niche placeholders.
    const niche = brandProfile.sell_type || brandProfile.description?.split(" ").slice(0, 3).join(" ") || "Content";
    return Array.from({ length: count }, (_, i) => {
      const suffixes = ["Creator", "Insider", "Collective"];
      const prefixes = ["Lifestyle", "Niche", "Community"];
      return {
        initials: `${String.fromCharCode(65 + i)}C`,
        name: `${prefixes[i] ?? "Brand"} ${niche.split(" ")[0] ?? ""} ${suffixes[i] ?? "Creator"}`.trim(),
        niche: `${niche} · Lifestyle`,
        audience: ["45K", "80K", "120K"][i] ?? "60K",
        match: [72, 68, 65][i] ?? 65,
        profileUrl: null,
        verified: false,
      };
    });
  }
}


// ---------------------------------------------------------------------------
// Main orchestrator — public API
// ---------------------------------------------------------------------------

/**
 * Full pipeline: generate queries → search → extract → fill with archetypes.
 *
 * @param {object} brandProfile  { brand_name, sell_type, description, ideal_customer, monthly_budget }
 * @param {number} neededCount   How many creators the report needs (default 3)
 * @returns {Promise<{creators: object[], meta: object}>}
 *   creators: array of Creator objects (mix of verified:true and verified:false)
 *   meta: diagnostics { queriesGenerated, realFound, archetypesFilled, totalTime }
 */
export async function searchAndGetCreators(brandProfile, neededCount = 3) {
  const startTime = Date.now();

  console.log(`[creatorSearch] Starting pipeline for: ${brandProfile.brand_name}`);

  // Step 1 — Generate search queries
  let queries;
  try {
    queries = await generateSearchQueries(brandProfile);
    console.log(`[creatorSearch] Queries:`, queries);
  } catch (err) {
    console.warn(`[creatorSearch] Query generation failed: ${err.message} — falling back to archetypes`);
    const archetypes = await generateArchetypeCreators(brandProfile, neededCount);
    return {
      creators: archetypes,
      meta: {
        queriesGenerated: 0,
        realFound: 0,
        archetypesFilled: archetypes.length,
        totalTime: Date.now() - startTime,
        error: err.message,
      },
    };
  }

  // Step 2 — Search in parallel
  let searchText;
  try {
    searchText = await searchCreators(queries);
  } catch (err) {
    console.warn(`[creatorSearch] Search failed: ${err.message} — falling back to archetypes`);
    const archetypes = await generateArchetypeCreators(brandProfile, neededCount);
    return {
      creators: archetypes,
      meta: {
        queriesGenerated: queries.length,
        realFound: 0,
        archetypesFilled: archetypes.length,
        totalTime: Date.now() - startTime,
        error: err.message,
      },
    };
  }

  // Step 3 — Extract real creators
  let realCreators = [];
  try {
    realCreators = await extractCreatorsFromResults(searchText, brandProfile);
    console.log(`[creatorSearch] Extracted ${realCreators.length} real creators`);
  } catch (err) {
    console.warn(`[creatorSearch] Extraction failed: ${err.message}`);
    realCreators = [];
  }

  // Step 4 — Fill remainder with archetypes if needed
  const needed = Math.max(0, neededCount - realCreators.length);
  let archetypes = [];
  if (needed > 0) {
    console.log(`[creatorSearch] Filling ${needed} slots with archetypes`);
    archetypes = await generateArchetypeCreators(brandProfile, needed);
  }

  const creators = [...realCreators.slice(0, neededCount), ...archetypes];
  const totalTime = Date.now() - startTime;

  console.log(
    `[creatorSearch] Done in ${totalTime}ms — ${realCreators.length} real, ${archetypes.length} archetype`
  );

  return {
    creators,
    meta: {
      queriesGenerated: queries.length,
      realFound: realCreators.length,
      archetypesFilled: archetypes.length,
      totalTime,
    },
  };
}
