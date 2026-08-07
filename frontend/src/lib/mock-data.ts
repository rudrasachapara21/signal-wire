// Mock data for Signal Wire — structured as typed exports.
// Replace these with real API responses when the backend is ready.

export interface Channel {
  name: string;
  fit: number; // percentage 0–100
  allocation: string; // e.g. "45%"
  reason: string;
}

export interface Creator {
  initials: string;
  name: string;
  niche: string;
  audience: string; // e.g. "184K"
  match: number; // percentage 0–100
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export type ReportStatus = "Ready" | "Archived";

export interface PastReport {
  id: string;
  name: string;
  date: string;
  status: ReportStatus;
}

export interface BrandProfile {
  brandName: string;
  productType: string;
  description: string;
  idealCustomer: string;
  monthlyBudget: string;
}

export interface StrategyReportData {
  title: string;
  date: string;
  executiveRecommendation: {
    headline: string;
    body: string;
  };
  confidenceScore: number;
}

// ─── Channels ────────────────────────────────────────────────────────────────

export const channels: Channel[] = [
  {
    name: "Instagram",
    fit: 94,
    allocation: "45%",
    reason:
      "Visual discovery and strong fashion purchase intent among your target demographic.",
  },
  {
    name: "TikTok",
    fit: 89,
    allocation: "35%",
    reason:
      "GRWM and styling content can build rapid awareness with minimal ad spend.",
  },
  {
    name: "Google Search",
    fit: 72,
    allocation: "20%",
    reason:
      "Capture high-intent shoppers already searching for linen and sustainable clothing.",
  },
];

// ─── Creators ────────────────────────────────────────────────────────────────

export const creators: Creator[] = [
  {
    initials: "AM",
    name: "Aanya Mehta",
    niche: "Sustainable style · GRWM",
    audience: "184K",
    match: 96,
  },
  {
    initials: "RS",
    name: "Riya Styles",
    niche: "Affordable fashion reviews",
    audience: "92K",
    match: 91,
  },
  {
    initials: "NK",
    name: "Neha Kapoor",
    niche: "Capsule wardrobe creator",
    audience: "61K",
    match: 87,
  },
];

// ─── Launch checklist ────────────────────────────────────────────────────────

export const checklistItems: ChecklistItem[] = [
  { label: "Brand description", done: true },
  { label: "Product category", done: true },
  { label: "Audience profile", done: true },
  { label: "Target locations", done: false },
  { label: "Monthly budget", done: false },
];

// ─── Past reports ────────────────────────────────────────────────────────────

export const pastReports: PastReport[] = [
  {
    id: "rep-001",
    name: "Loom & Leaf launch plan",
    date: "Aug 6, 2026",
    status: "Ready",
  },
  {
    id: "rep-002",
    name: "Monsoon collection campaign",
    date: "Jul 18, 2026",
    status: "Ready",
  },
  {
    id: "rep-003",
    name: "Summer audience research",
    date: "Jun 29, 2026",
    status: "Archived",
  },
];

// ─── First 30 days plan ──────────────────────────────────────────────────────

export const first30Days: string[] = [
  "Brief 8 micro-creators on product and tone",
  "Launch 3 Instagram Reel concepts",
  "Retarget video viewers with carousel ads",
  "Review saves, shares, and purchase conversions",
];

// ─── Default brand profile (pre-fills the form) ──────────────────────────────

export const defaultBrandProfile: BrandProfile = {
  brandName: "Loom & Leaf",
  productType: "Physical products",
  description:
    "We make affordable, breathable linen clothing for women who want timeless everyday outfits. We sell online across India.",
  idealCustomer: "Women, 22–38, urban, fashion-conscious",
  monthlyBudget: "₹50,000",
};

// ─── Strategy report data ────────────────────────────────────────────────────

export const strategyReport: StrategyReportData = {
  title: "Loom & Leaf launch plan",
  date: "August 6, 2026",
  executiveRecommendation: {
    headline: "Build trust through relatable styling content first.",
    body: "Put 80% of the launch budget into Instagram and TikTok. Partner with 5–8 micro-creators whose audiences actively save outfit ideas. Use Google Search only to capture existing demand — don't lead with it.",
  },
  confidenceScore: 91,
};

// ─── Overview advisor priority card ─────────────────────────────────────────

export const advisorPriority = {
  headline:
    "Launch with creator-led styling videos, not broad display ads.",
  body: "Your product is visual, consideration-led, and easiest to understand when worn. Start with Instagram Reels and TikTok creators who already publish outfit reviews and \"get ready with me\" content.",
};

// ─── Stat cards for overview ─────────────────────────────────────────────────

export const overviewStats = {
  brandReadiness: { value: "82%", note: "Add target locations to reach 90%" },
  bestChannel: { value: "Instagram", note: "94% audience fit" },
  creatorMatches: { value: "18", note: "3 high-confidence matches" },
};
