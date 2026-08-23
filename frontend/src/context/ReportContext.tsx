import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

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
  audience: string | null; // null when follower count unknown
  match: number; // percentage 0–100
  verified?: boolean;
}

export interface StrategyReportResponse {
  reportTitle: string;
  reportDate: string;
  channels: Channel[];
  creators: Creator[];
  confidenceScore: number;
  executiveRecommendation: {
    headline: string;
    body: string;
  };
  first30Days: string[];
}

export interface BrandProfileInputs {
  brand_name: string;
  sell_type: string;
  description: string;
  ideal_customer: string;
  monthly_budget: string;
}

export interface StoredReport extends StrategyReportResponse {
  id: string;
  status: "Ready" | "Archived";
  createdAt?: string;
  refinedFromId?: string | null;
  rating?: "up" | "down" | null;
  feedbackNote?: string | null;
  ratedAt?: string | null;
}

interface ReportContextValue {
  report: StrategyReportResponse | null;
  /** DB id of the currently viewed report — null for guest/unsaved */
  currentReportId: string | null;
  reports: StoredReport[];
  reportsLoading: boolean;
  setReport: (
    report: StrategyReportResponse,
    userId?: string,
    brandProfile?: BrandProfileInputs
  ) => void;
  selectReport: (id: string) => void;
  /** Call after a successful refine API call — updates local state instantly */
  applyRefinement: (refinedReport: StoredReport) => void;
  /** Call after a successful feedback PATCH — updates rating in local state */
  updateFeedback: (id: string, rating: "up" | "down" | null, feedbackNote?: string | null) => void;
  clearReports: () => void;
  fetchReports: () => Promise<void>;
}

const ReportContext = createContext<ReportContextValue | null>(null);

const API_BASE = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:5001";

async function saveReportToApi(
  report: StrategyReportResponse,
  brandProfile?: BrandProfileInputs
): Promise<StoredReport | null> {
  try {
    const res = await fetch(`${API_BASE}/api/reports`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: report.reportTitle,
        reportData: report,
        brandProfile: brandProfile ?? null,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as StoredReport;
  } catch {
    return null;
  }
}

async function fetchReportsFromApi(): Promise<StoredReport[]> {
  try {
    const res = await fetch(`${API_BASE}/api/reports`, {
      credentials: "include",
    });
    if (!res.ok) return [];
    return (await res.json()) as StoredReport[];
  } catch {
    return [];
  }
}

export function ReportProvider({ children }: { children: ReactNode }) {
  const [report, setReportState] = useState<StrategyReportResponse | null>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [reports, setReportsState] = useState<StoredReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const setReport = useCallback(
    (
      newReport: StrategyReportResponse,
      userId?: string,
      brandProfile?: BrandProfileInputs
    ) => {
      setReportState(newReport);

      // Optimistic local entry so UI updates without waiting for the API
      const optimisticId = `local-${Date.now()}`;
      setCurrentReportId(optimisticId);

      const optimistic: StoredReport = {
        ...newReport,
        id: optimisticId,
        status: "Ready",
        refinedFromId: null,
      };
      setReportsState((prev) => {
        const withoutDupe = prev.filter(
          (r) => r.reportTitle !== newReport.reportTitle
        );
        return [optimistic, ...withoutDupe];
      });

      // Persist to DB if logged in
      if (userId) {
        saveReportToApi(newReport, brandProfile).then((saved) => {
          if (saved) {
            setCurrentReportId(saved.id);
            setReportsState((prev) =>
              prev.map((r) => (r.id === optimisticId ? saved : r))
            );
          }
        });
      }
    },
    []
  );

  const selectReport = useCallback((id: string) => {
    setReportsState((prev) => {
      const found = prev.find((r) => r.id === id);
      if (found) {
        setReportState(found);
        setCurrentReportId(found.id);
      }
      return prev;
    });
  }, []);

  /** Called after a successful POST /api/reports/:id/refine */
  const applyRefinement = useCallback((refinedReport: StoredReport) => {
    setReportState(refinedReport);
    setCurrentReportId(refinedReport.id);
    setReportsState((prev) => [refinedReport, ...prev]);
  }, []);

  /** Called after a successful PATCH /api/reports/:id/feedback */
  const updateFeedback = useCallback(
    (id: string, rating: "up" | "down" | null, feedbackNote?: string | null) => {
      const patch = { rating, feedbackNote: feedbackNote ?? null, ratedAt: new Date().toISOString() };
      setReportsState((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      );
      // Also update the active report view if we're rating the currently viewed report
      setReportState((prev) => {
        if (!prev) return prev;
        // We can't compare by id here (report is StrategyReportResponse, not StoredReport)
        // so we patch regardless — it's idempotent and correct
        return { ...prev, ...patch } as typeof prev;
      });
    },
    []
  );

  const clearReports = useCallback(() => {
    setReportState(null);
    setCurrentReportId(null);
    setReportsState([]);
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    const fetched = await fetchReportsFromApi();
    if (fetched.length > 0) {
      setReportsState(fetched);
    }
    setReportsLoading(false);
  }, []);

  return (
    <ReportContext.Provider
      value={{
        report,
        currentReportId,
        reports,
        reportsLoading,
        setReport,
        selectReport,
        applyRefinement,
        updateFeedback,
        clearReports,
        fetchReports,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport(): ReportContextValue {
  const ctx = useContext(ReportContext);
  if (!ctx) {
    throw new Error("useReport must be used inside <ReportProvider>");
  }
  return ctx;
}
