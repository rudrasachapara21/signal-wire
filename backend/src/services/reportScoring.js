/**
 * reportScoring.js
 *
 * Deterministic scoring engine for strategy confidence.
 * Calculates an overall confidence score (0-100) based on 4 explainable factors:
 *   1. Data completeness (0-25)
 *   2. Budget realism (0-25)
 *   3. Creator verification ratio (0-25)
 *   4. Category data availability (0-25)
 */

/**
 * Calculates confidence sub-scores and total score for a brand profile & generated report.
 *
 * @param {object} profile  { brand_name, sell_type, description, ideal_customer, monthly_budget }
 * @param {object} report   { channels, creators, _creatorSearchMeta, ... }
 * @returns {{ calculatedConfidenceScore: number, factors: { completeness: number, budgetRealism: number, creatorVerification: number, categoryDataAvailability: number } }}
 */
export function calculateConfidenceFactors(profile = {}, report = {}) {
  // -------------------------------------------------------------------------
  // 1. Data Completeness Factor (0-25)
  // Evaluates depth & detail across brand_name, sell_type, description, ideal_customer
  // -------------------------------------------------------------------------
  let completeness = 0;

  const descLen = (profile.description ?? "").trim().length;
  if (descLen >= 120) completeness += 10;
  else if (descLen >= 50) completeness += 6;
  else if (descLen >= 10) completeness += 3;

  const customerLen = (profile.ideal_customer ?? "").trim().length;
  if (customerLen >= 40) completeness += 7;
  else if (customerLen >= 15) completeness += 4;
  else if (customerLen >= 1) completeness += 2;

  const sellTypeLen = (profile.sell_type ?? "").trim().length;
  if (sellTypeLen >= 10) completeness += 4;
  else if (sellTypeLen >= 1) completeness += 2;

  const nameLen = (profile.brand_name ?? "").trim().length;
  if (nameLen >= 2) completeness += 4;

  completeness = Math.min(25, Math.max(0, completeness));

  // -------------------------------------------------------------------------
  // 2. Budget Realism Factor (0-25)
  // Evaluates if the monthly_budget is realistic for the recommended channel count.
  // -------------------------------------------------------------------------
  let budgetRealism = 0;

  const rawBudget = (profile.monthly_budget ?? "").toString().replace(/[^0-9.]/g, "");
  const numericBudget = parseFloat(rawBudget) || 0;
  const channelCount = Array.isArray(report.channels) && report.channels.length > 0 ? report.channels.length : 3;

  const budgetPerChannel = numericBudget / channelCount;

  if (numericBudget <= 1000) {
    budgetRealism = 4; // Extremely tight budget for multi-platform ad testing
  } else if (numericBudget < 5000) {
    budgetRealism = 10;
  } else if (budgetPerChannel >= 10000 || numericBudget >= 30000) {
    budgetRealism = 25; // Plausible budget to test multiple ad platforms effectively
  } else if (budgetPerChannel >= 5000 || numericBudget >= 15000) {
    budgetRealism = 20;
  } else {
    budgetRealism = 14;
  }

  budgetRealism = Math.min(25, Math.max(0, budgetRealism));

  // -------------------------------------------------------------------------
  // 3. Creator Verification Factor (0-25)
  // Evaluates proportion of real verified creators vs fallback archetypes
  // -------------------------------------------------------------------------
  let creatorVerification = 0;
  const creators = Array.isArray(report.creators) ? report.creators : [];

  if (creators.length > 0) {
    const verifiedCount = creators.filter((c) => c.verified === true).length;
    const verifiedRatio = verifiedCount / creators.length;
    creatorVerification = Math.round(5 + verifiedRatio * 20);
  } else {
    creatorVerification = 5;
  }

  creatorVerification = Math.min(25, Math.max(0, creatorVerification));

  // -------------------------------------------------------------------------
  // 4. Category Data Availability Factor (0-25)
  // Evaluates whether real market search data was successfully found for the niche
  // -------------------------------------------------------------------------
  let categoryDataAvailability = 0;
  const meta = report._creatorSearchMeta ?? {};

  if (meta.realFound && meta.realFound >= 3) {
    categoryDataAvailability = 25;
  } else if (meta.realFound && meta.realFound > 0) {
    categoryDataAvailability = 18;
  } else if (meta.archetypesFilled && meta.archetypesFilled > 0) {
    categoryDataAvailability = 12;
  } else if (meta.error) {
    categoryDataAvailability = 8;
  } else {
    categoryDataAvailability = 10;
  }

  categoryDataAvailability = Math.min(25, Math.max(0, categoryDataAvailability));

  // -------------------------------------------------------------------------
  // Calculate Total (0-100)
  // -------------------------------------------------------------------------
  const calculatedConfidenceScore = Math.round(
    completeness + budgetRealism + creatorVerification + categoryDataAvailability
  );

  return {
    calculatedConfidenceScore: Math.min(100, Math.max(0, calculatedConfidenceScore)),
    factors: {
      completeness,
      budgetRealism,
      creatorVerification,
      categoryDataAvailability,
    },
  };
}
