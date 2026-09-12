/**
 * creatorIntroService.js
 *
 * Generates and caches on-demand AI intros for creators using public web search (Tavily + Groq).
 */

import prisma from "../lib/prisma.js";
import { searchCreators, validateInstagramUrl } from "./creatorSearch.js";
import fetch from "node-fetch";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "groq/compound-mini";
const GROQ_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function getOrGenerateCreatorIntro({ name, niche, profileUrl }) {
  const normName = (name || "").trim();
  const normNiche = (niche || "").trim();

  if (!normName) {
    throw new Error("Creator name is required.");
  }

  // 1. Check cache (valid for 30 days)
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - THIRTY_DAYS_MS);

  try {
    const cached = await prisma.creatorIntro.findUnique({
      where: {
        name_niche: {
          name: normName,
          niche: normNiche,
        },
      },
    });

    if (cached && cached.createdAt > cutoffDate) {
      console.log(`[creatorIntro] Cache hit for "${normName}" (${normNiche})`);
      return {
        name: cached.name,
        niche: cached.niche,
        introText: cached.introText,
        sourcesFound: cached.sourcesFound,
        cached: true,
      };
    }
  } catch (cacheErr) {
    console.warn(`[creatorIntro] Cache read error: ${cacheErr.message}`);
  }

  // 2. Not cached -> Build 2-3 targeted search queries
  const queries = [
    `"${normName}" Instagram content style audience`,
    `"${normName}" ${normNiche} creator brand collaborations`,
  ];

  const validProfileUrl = validateInstagramUrl(profileUrl);
  if (validProfileUrl) {
    const match = validProfileUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)\//);
    if (match && match[1]) {
      queries.push(`"${match[1]}" instagram creator`);
    }
  }

  console.log(`[creatorIntro] Searching web for "${normName}" with queries:`, queries);

  let searchResults = "";
  try {
    searchResults = await searchCreators(queries);
  } catch (err) {
    console.warn(`[creatorIntro] Search failed for "${normName}": ${err.message}`);
  }

  let introText = "Limited public information available about this creator.";
  let sourcesFound = false;

  if (searchResults && searchResults.trim().length > 100) {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey !== "your_key_here") {
      const systemMsg = `You are a digital marketing research assistant.
Summarize key facts about the creator based ONLY on the provided web search results.
Always respond with valid JSON only — no markdown fences.`;

      const userMsg = `CREATOR NAME: ${normName}
NICHE: ${normNiche}

SEARCH RESULTS:
${searchResults.slice(0, 6000)}

INSTRUCTIONS:
1. Check if the search results contain any real, specific details about the creator "${normName}" (e.g. content style, workout/fitness focus, follower/engagement info, business ventures, or brand work).
2. If real information about "${normName}" IS present in the text above:
   - Set "sourcesFound": true
   - Set "introText": A concise 2-3 sentence overview of their content style, niche focus, and key accomplishments mentioned in the search results.
3. If no real or useful information about "${normName}" is present in the search results:
   - Set "sourcesFound": false
   - Set "introText": "Limited public information available about this creator."

Return ONLY valid JSON:
{
  "introText": "string",
  "sourcesFound": boolean
}`;

      try {
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
              temperature: 0.3,
              max_tokens: 300,
            }),
          },
          GROQ_TIMEOUT_MS
        );

        if (res.ok) {
          const data = await res.json();
          const rawContent = data?.choices?.[0]?.message?.content;
          console.log(`[creatorIntro] Groq raw content for "${normName}":`, rawContent);
          if (rawContent) {
            const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
            const parsed = JSON.parse(cleaned);
            if (parsed.introText && typeof parsed.introText === "string") {
              introText = parsed.introText.trim();
              sourcesFound = Boolean(parsed.sourcesFound);
            }
          }
        } else {
          const errText = await res.text().catch(() => "");
          console.warn(`[creatorIntro] Groq API returned ${res.status}: ${errText}`);
        }
      } catch (llmErr) {
        console.warn(`[creatorIntro] LLM generation failed: ${llmErr.message}`);
      }
    }
  }

  // 3. Cache result in database
  try {
    const record = await prisma.creatorIntro.upsert({
      where: {
        name_niche: {
          name: normName,
          niche: normNiche,
        },
      },
      update: {
        introText,
        sourcesFound,
        createdAt: new Date(),
      },
      create: {
        name: normName,
        niche: normNiche,
        introText,
        sourcesFound,
      },
    });

    return {
      name: record.name,
      niche: record.niche,
      introText: record.introText,
      sourcesFound: record.sourcesFound,
      cached: false,
    };
  } catch (dbErr) {
    console.warn(`[creatorIntro] DB save error: ${dbErr.message}`);
    return {
      name: normName,
      niche: normNiche,
      introText,
      sourcesFound,
      cached: false,
    };
  }
}
