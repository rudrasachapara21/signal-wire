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
  audience: string; // e.g. "184K"
  match: number; // percentage 0–100
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

export interface StoredReport extends StrategyReportResponse {
  id: string;
  status: "Ready" | "Archived";
}

interface ReportContextValue {
  report: StrategyReportResponse | null;
  reports: StoredReport[];
  setReport: (report: StrategyReportResponse) => void;
  selectReport: (id: string) => void;
  clearReports: () => void;
}

const ReportContext = createContext<ReportContextValue | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [report, setReportState] = useState<StrategyReportResponse | null>(null);
  const [reports, setReportsState] = useState<StoredReport[]>([]);

  const setReport = useCallback((newReport: StrategyReportResponse) => {
    setReportState(newReport);
    setReportsState((prev) => {
      const existingIndex = prev.findIndex(
        (r) => r.reportTitle === newReport.reportTitle
      );
      const stored: StoredReport = {
        ...newReport,
        id: `rep-${Date.now()}`,
        status: "Ready",
      };
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = stored;
        return next;
      }
      return [stored, ...prev];
    });
  }, []);

  const selectReport = useCallback((id: string) => {
    setReportsState((prev) => {
      const found = prev.find((r) => r.id === id);
      if (found) {
        setReportState(found);
      }
      return prev;
    });
  }, []);

  const clearReports = useCallback(() => {
    setReportState(null);
    setReportsState([]);
  }, []);

  return (
    <ReportContext.Provider
      value={{
        report,
        reports,
        setReport,
        selectReport,
        clearReports,
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
