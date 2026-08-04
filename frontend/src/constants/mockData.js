/**
 * mockData.js
 * ──────────────────────────────────────────────────────────────
 * Static mock report returned while the real backend is not wired.
 * TODO: replace with parsed response from POST /api/generate-report
 *
 * Schema matches the expected API response shape so that swapping
 * to a real call only requires removing the setTimeout wrapper in
 * App.jsx and pointing at the live endpoint.
 * ──────────────────────────────────────────────────────────────
 */

export const MOCK_REPORT = {
  brand: {
    name: "Brew & Wire Coffee Co.",
    description:
      "A cosy specialty coffee shop in Bengaluru offering single-origin pour-overs, locally sourced pastries, and a calm workspace vibe for remote workers and students.",
    budget: 25000,
  },

  // Section 1 — Best ad platforms
  platforms: [
    {
      name: "Instagram",
      icon: "📸",
      reason:
        "Visual-first platform ideal for food & beverage brands. Reels and Stories reach a young, urban Bengaluru audience at low CPMs.",
      confidence: "High",
    },
    {
      name: "Google Search",
      icon: "🔍",
      reason:
        "Captures high-intent searches like 'specialty coffee near me' or 'work café Bengaluru'. Critical for walk-in conversions.",
      confidence: "High",
    },
    {
      name: "YouTube (Shorts)",
      icon: "▶️",
      reason:
        "Coffee brewing tutorials and ambience clips perform well. Shorts CPM is low and reach is broad among 18-34 demo.",
      confidence: "Medium",
    },
  ],

  // Section 2 — Demand / seasonality signal
  seasonality: {
    currentSignal: "Rising",
    signalStrength: 72, // 0–100
    summary:
      "Search interest for 'specialty coffee' and 'café workspace' peaks in Oct–Feb (post-monsoon cool season) and around exam seasons (Apr, Nov). You are entering an uptick window — now is a strong time to push brand-awareness spend.",
    months: [
      { month: "Jan", index: 88 },
      { month: "Feb", index: 82 },
      { month: "Mar", index: 70 },
      { month: "Apr", index: 76 },
      { month: "May", index: 60 },
      { month: "Jun", index: 54 },
      { month: "Jul", index: 58 },
      { month: "Aug", index: 64 },
      { month: "Sep", index: 68 },
      { month: "Oct", index: 85 },
      { month: "Nov", index: 90 },
      { month: "Dec", index: 95 },
    ],
  },

  // Section 3 — Competitor snapshot
  competitors: [
    {
      name: "Blue Tokai Coffee",
      strength: "Strong nationwide brand, heavy Google Ads presence",
      gap: "Premium pricing alienates casual drinkers",
    },
    {
      name: "Araku Coffee",
      strength: "Tribal-origin story resonates with conscious consumers",
      gap: "Limited urban café footprint",
    },
    {
      name: "Third Wave Coffee",
      strength: "Excellent Instagram Reels engagement",
      gap: "Cookie-cutter interiors — your unique workspace vibe is a differentiator",
    },
  ],

  // Section 4 — Content formats
  contentFormats: [
    {
      format: "Instagram Reels (15–30s)",
      priority: "Primary",
      description: "Barista craft videos, cosy ambience tours, day-in-the-life of regulars.",
    },
    {
      format: "Google Display / Search",
      priority: "Primary",
      description: "Keyword-targeted: 'work café Bengaluru', 'best pour-over near me', 'laptop-friendly café'.",
    },
    {
      format: "User-Generated Content Reposts",
      priority: "Secondary",
      description: "Repost tagged customer photos; run a #BrewAndWire hashtag challenge.",
    },
    {
      format: "YouTube Shorts",
      priority: "Secondary",
      description: "60-second pour-over tutorials, 'a day at the café' vlogs.",
    },
    {
      format: "WhatsApp Broadcast",
      priority: "Tertiary",
      description: "Weekly menu drop to opted-in regulars. Service messages only — not promotional blasts.",
    },
  ],

  // Section 5 — Influencer / creator categories (always "suggested — verify before use")
  influencers: [
    {
      category: "Micro Food Bloggers (5k–50k followers)",
      rationale:
        "High engagement rates, affordable collabs (₹1,000–₹5,000 per post). Look for Bengaluru-based accounts covering 'café hopping'.",
    },
    {
      category: "Remote-Work / Productivity Creators",
      rationale:
        "Audiences actively look for workspace recommendations. A Reel of them working from your café has strong conversion intent.",
    },
    {
      category: "Student Lifestyle Vloggers",
      rationale:
        "University-adjacent audience in Bengaluru. 'Study-with-me' videos from your café can drive organic word-of-mouth.",
    },
  ],

  // Section 6 — Budget split
  budgetSplit: [
    { platform: "Instagram Ads", percentage: 40 },
    { platform: "Google Search", percentage: 35 },
    { platform: "YouTube Shorts", percentage: 15 },
    { platform: "Influencer Collabs", percentage: 10 },
  ],

  // Section 7 — Ad hooks / copy ideas
  adHooks: [
    "Your next great idea is one pour-over away. → Brew & Wire, Bengaluru.",
    "Work. Sip. Repeat. Bengaluru's quietest power outlet has the best espresso.",
    "Single-origin beans. Zero distractions. Your office, upgraded — Brew & Wire.",
    "Skip the chain. Come where the barista knows your order. #BrewAndWire",
  ],

  generatedAt: new Date().toISOString(),
};

/** Color palette for platform budget bars — maps platform name to a CSS color token */
export const PLATFORM_COLORS = {
  "Instagram Ads": "#d97706",      // amber-600
  "Google Search": "#b45309",      // amber-700
  "YouTube Shorts": "#92400e",     // amber-800
  "Influencer Collabs": "#78350f", // amber-900
};
