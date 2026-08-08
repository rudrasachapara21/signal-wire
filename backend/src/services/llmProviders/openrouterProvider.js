/**
 * openrouterProvider.js
 *
 * Calls the OpenRouter Chat Completions API (OpenAI-compatible).
 *
 * Model selection (verified against live /api/v1/models on Aug 2026):
 *   Primary:   nvidia/nemotron-3-ultra-550b-a55b:free  (550B params, 1M ctx, free)
 *   Fallback:  google/gemma-4-31b-it:free              (31B, 262K ctx, free)
 *
 * Note: meta-llama/llama-3.3-70b-instruct:free is NO LONGER listed as a free model
 * on OpenRouter as of Aug 2026. The above models are the current best free options
 * verified from the live /api/v1/models endpoint.
 *
 * OpenRouter requires the HTTP-Referer header (can be any URL, used for rate-limit
 * attribution). We use the project name as the referer.
 *
 * Interface: async generateStrategy(promptText) => raw JSON string
 */

import fetch from "node-fetch";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Primary free model — NVIDIA Nemotron 3 Ultra 550B (verified free on OpenRouter Aug 2026)
const OPENROUTER_PRIMARY_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

// Secondary free model — Google Gemma 4 31B (in case primary is overloaded)
const OPENROUTER_FALLBACK_MODEL = "google/gemma-4-31b-it:free";

const OPENROUTER_TIMEOUT_MS = 45_000; // Free tier models can be slower

/**
 * Calls one specific OpenRouter model.
 * @param {string} apiKey
 * @param {string} model
 * @param {string} promptText
 * @returns {Promise<string>}  Raw JSON string
 */
async function callOpenRouterModel(apiKey, model, promptText) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // OpenRouter requires a Referer or X-Title header for attribution
        "HTTP-Referer": "https://signal-wire.app",
        "X-Title": "Signal Wire Brand Analyzer",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            // Do NOT use response_format: json_object here — OpenRouter's free
            // models (e.g. nemotron-3-ultra) reject it and return an empty
            // response. The system prompt instruction is sufficient and reliable.
            content:
              "You are an expert digital advertising strategist. You MUST respond with a single valid JSON object only. Do NOT include any markdown code fences (no ```json), no explanatory text, no comments — pure raw JSON starting with { and ending with }. Any non-JSON output will be rejected.",
          },
          {
            role: "user",
            content: promptText,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(
        `OpenRouter request timed out after ${OPENROUTER_TIMEOUT_MS}ms (model: ${model})`
      );
    }
    throw new Error(`OpenRouter network error: ${err.message}`);
  }

  clearTimeout(timer);

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(
      `${res.status}: OpenRouter API error (model: ${model}) — ${body.slice(0, 300)}`
    );
  }

  const data = await res.json();

  // OpenRouter sometimes returns a "error" field even on 200 responses
  if (data?.error) {
    throw new Error(
      `${data.error?.code ?? 500}: OpenRouter model error — ${data.error?.message ?? JSON.stringify(data.error)}`
    );
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(
      `OpenRouter returned empty content (model: ${model}). Full response: ${JSON.stringify(data).slice(0, 300)}`
    );
  }

  return content;
}

/**
 * Tries the primary free model first, falls back to the secondary free model
 * if the primary is rate-limited or unavailable.
 *
 * @param {string} promptText
 * @returns {Promise<string>}  Raw JSON string
 * @throws {Error}             If both OpenRouter models fail
 */
export async function generateStrategy(promptText) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    throw new Error("OPENROUTER_API_KEY is not set or is a placeholder.");
  }

  // Try primary model
  try {
    const result = await callOpenRouterModel(
      apiKey,
      OPENROUTER_PRIMARY_MODEL,
      promptText
    );
    console.log(`[OpenRouter] ✅ Served by primary model: ${OPENROUTER_PRIMARY_MODEL}`);
    return result;
  } catch (primaryErr) {
    console.warn(
      `[OpenRouter] Primary model (${OPENROUTER_PRIMARY_MODEL}) failed: ${primaryErr.message}`
    );
    console.warn(`[OpenRouter] Trying fallback model: ${OPENROUTER_FALLBACK_MODEL}`);
  }

  // Try fallback model
  const result = await callOpenRouterModel(
    apiKey,
    OPENROUTER_FALLBACK_MODEL,
    promptText
  );
  console.log(`[OpenRouter] ✅ Served by fallback model: ${OPENROUTER_FALLBACK_MODEL}`);
  return result;
}
