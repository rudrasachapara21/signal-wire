import type { BrandProfileFormValues } from "@/pages/BrandProfile";
import type { StrategyReportResponse } from "@/context/ReportContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export async function analyzeBrand(
  profile: BrandProfileFormValues
): Promise<StrategyReportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze-brand`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      brand_name: profile.brandName,
      sell_type: profile.productType,
      description: profile.description,
      ideal_customer: profile.idealCustomer,
      monthly_budget: profile.monthlyBudget,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to analyze brand (${response.status})`
    );
  }

  return response.json();
}
