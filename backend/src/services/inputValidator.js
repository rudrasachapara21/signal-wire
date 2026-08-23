/**
 * inputValidator.js
 *
 * Fast input sanity-check step before running full strategy generation.
 * Flags genuine internal contradictions, unusable vagueness, or nonsensical budget fields.
 */

import { z } from "zod";
import * as groq from "./llmProviders/groqProvider.js";
import * as openrouter from "./llmProviders/openrouterProvider.js";
import * as gemini from "./llmProviders/geminiProvider.js";

export const inputCheckSchema = z.object({
  isValid: z.boolean({ required_error: "isValid is required" }),
  issue: z.string().nullable().default(null),
  suggestedClarification: z.string().nullable().default(null),
});

const PROVIDERS = [
  { name: "Groq", module: groq },
  { name: "OpenRouter", module: openrouter },
  { name: "Gemini", module: gemini },
];

function buildCheckPrompt(profile) {
  return `You are a helpful brand analysis assistant. Review this brand description for internal consistency and clarity.

BRAND INFORMATION:
- Brand Name: ${profile.brand_name ?? ""}
- What they sell: ${profile.sell_type ?? ""}
- Description: ${profile.description ?? ""}
- Target Customer: ${profile.ideal_customer ?? ""}
- Monthly Budget: ${profile.monthly_budget ?? ""}

Respond with ONLY a single valid JSON object with the following structure:
{
  "isValid": boolean,
  "issue": "string or null — specific explanation of why the input is invalid",
  "suggestedClarification": "string or null — helpful suggestion for how the user can clarify their description"
}

CRITERIA FOR VALIDATION:
Only flag isValid: false for GENUINE problems:
(a) The description contradicts itself (e.g. claims to sell two completely unrelated product categories as if they are the same core product),
(b) The description is too vague/generic to generate a meaningful strategy (e.g. just 'we sell stuff online' or 'goods for people'),
(c) Required fields are nonsensical (e.g. budget field contains something that isn't a number/amount or random gibberish).

IMPORTANT RULES:
- Do NOT flag things that are just unusual, ambitious, or multi-category on purpose (many real brands legitimately sell varied product lines e.g. skincare + supplements, clothing + home goods).
- Only flag actual internal contradictions or genuine unusable vagueness.
- Err toward isValid: true when in doubt — this check should catch clear problems, not police normal business descriptions.
- Return ONLY the JSON object, no markdown fences, no prose.`;
}

function cleanJson(rawText) {
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

/**
 * Validates brand profile input for internal contradictions or unusable vagueness.
 *
 * @param {object} profile
 * @returns {Promise<{ isValid: boolean, issue: string | null, suggestedClarification: string | null }>}
 */
export async function validateBrandInput(profile) {
  const prompt = buildCheckPrompt(profile);

  for (const { name, module } of PROVIDERS) {
    try {
      const rawText = await module.generateStrategy(prompt);
      const parsed = cleanJson(rawText);
      if (parsed) {
        const result = inputCheckSchema.safeParse(parsed);
        if (result.success) {
          console.log(`[inputValidator] Checked via ${name}: isValid=${result.data.isValid}`);
          return result.data;
        }
      }
    } catch (err) {
      console.warn(`[inputValidator] ${name} check failed: ${err.message}`);
    }
  }

  // Fallback if provider checks fail: err toward isValid: true
  return { isValid: true, issue: null, suggestedClarification: null };
}
