// Shared type definitions and default form helper for Signal Wire.
// All mock data arrays have been removed — data is generated live via Gemini API.

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

// ─── Default brand profile (pre-fills the brand analysis form) ───────────────

export const defaultBrandProfile: BrandProfile = {
  brandName: "Loom & Leaf",
  productType: "Physical products",
  description:
    "We make affordable, breathable linen clothing for women who want timeless everyday outfits. We sell online across India.",
  idealCustomer: "Women, 22–38, urban, fashion-conscious",
  monthlyBudget: "₹50,000",
};
