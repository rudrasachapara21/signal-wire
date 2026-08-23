/**
 * groqProvider.js
 *
 * Calls the Groq Chat Completions API (OpenAI-compatible).
 * Model: openai/gpt-oss-120b — verified live on Groq's model list.
 * Rate limits: ~30 RPM / 14,400 RPD on the free tier (far more generous than Gemini).
 *
 * Interface: async generateStrategy(promptText) => raw JSON string
 */

import fetch from "node-fetch";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_TIMEOUT_MS = 30_000;

/**
 * @param {string} promptText  The full user prompt (JSON instructions included)
 * @returns {Promise<string>}  Raw JSON string from the model
 * @throws {Error}             Tagged with HTTP status if available (e.g. "429: ...")
 */
export async function generateStrategy(promptText) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    throw new Error("GROQ_API_KEY is not set or is a placeholder.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert digital advertising strategist. Always respond with valid JSON only — no markdown fences, no prose. Your entire response must be a single valid JSON object.",
          },
          {
            role: "user",
            content: promptText,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(`Groq request timed out after ${GROQ_TIMEOUT_MS}ms`);
    }
    throw new Error(`Groq network error: ${err.message}`);
  }

  clearTimeout(timer);

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`${res.status}: Groq API error — ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response content.");
  }

  return content;
}
