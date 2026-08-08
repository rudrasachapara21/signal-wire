/**
 * test-providers.mjs
 *
 * Step 1 of verification: tests each LLM provider individually.
 * Run with: node test-providers.mjs
 *
 * Set env vars first:
 *   GROQ_API_KEY=... OPENROUTER_API_KEY=... GEMINI_API_KEY=... node test-providers.mjs
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

const TEST_PROMPT = `You are an expert digital advertising strategist.

Generate a brand analysis for this brand as a single valid JSON object:

Brand: "TestBrand Coffee"
Product: Specialty cold brew coffee
Budget: $2000/month
Audience: Urban millennials aged 25-35

Return ONLY this JSON structure (all fields required):
{
  "reportTitle": "string",
  "reportDate": "string",
  "channels": [{"name": "string", "fit": 85, "allocation": "40%", "reason": "string"}],
  "creators": [{"initials": "AB", "name": "string", "niche": "string", "audience": "50K", "match": 80}],
  "confidenceScore": 75,
  "executiveRecommendation": {"headline": "string", "body": "string"},
  "first30Days": ["action 1", "action 2", "action 3", "action 4"]
}`;

async function testProvider(name, providerPath) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log("=".repeat(60));

  try {
    const mod = await import(providerPath);
    const start = Date.now();
    const result = await mod.generateStrategy(TEST_PROMPT);
    const elapsed = Date.now() - start;

    // Try to parse to verify it's valid JSON
    const parsed = JSON.parse(result);

    console.log(`✅ SUCCESS in ${elapsed}ms`);
    console.log(`   reportTitle: ${parsed.reportTitle}`);
    console.log(`   channels: ${parsed.channels?.length ?? "?"} items`);
    console.log(`   confidenceScore: ${parsed.confidenceScore}`);
    console.log(`   Raw length: ${result.length} chars`);
    return true;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    return false;
  }
}

const results = {};

results.groq = await testProvider(
  "Groq (llama-3.3-70b-versatile)",
  "../../backend/src/services/llmProviders/groqProvider.js"
);

results.openrouter = await testProvider(
  "OpenRouter (nvidia/nemotron-3-ultra-550b-a55b:free)",
  "../../backend/src/services/llmProviders/openrouterProvider.js"
);

results.gemini = await testProvider(
  "Gemini (gemini-2.0-flash-lite)",
  "../../backend/src/services/llmProviders/geminiProvider.js"
);

console.log(`\n${"=".repeat(60)}`);
console.log("SUMMARY:");
console.log("=".repeat(60));
for (const [name, ok] of Object.entries(results)) {
  console.log(`  ${ok ? "✅" : "❌"} ${name}`);
}
