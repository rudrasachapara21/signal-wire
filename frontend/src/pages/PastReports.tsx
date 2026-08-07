import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileClock, Sparkles } from "lucide-react";
import { useReport } from "@/context/ReportContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// TODO: Persistent storage across browser sessions requires a backend database integration.
// Currently, generated reports are stored in session memory via ReportContext.

function StatusBadge({ status }: { status: "Ready" | "Archived" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        status === "Ready"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function PastReports() {
  const { reports, selectReport } = useReport();
  const navigate = useNavigate();

  function handleOpenReport(id: string) {
    selectReport(id);
    void navigate({ to: "/strategy-report" });
  }

  return (
    <>
      <p className="text-sm font-medium text-primary">Strategy library</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Past reports</h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        Return to earlier recommendations and compare how your strategy has
        evolved.
      </p>

      {reports.length === 0 ? (
        <section className="mt-6 flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center sm:mt-8">
          <span className="grid size-14 place-items-center rounded-xl bg-accent text-primary">
            <FileClock size={28} />
          </span>
          <h2 className="mt-4 text-xl font-bold">No reports yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Your generated advertising strategies will appear here during your active session.
          </p>
          <Button
            className="mt-6"
            onClick={() => void navigate({ to: "/brand-profile" })}
          >
            <Sparkles size={16} className="mr-2" />
            Generate your first report
          </Button>
        </section>
      ) : (
        <section
          className="mt-6 overflow-hidden rounded-lg border border-border bg-card sm:mt-8"
          aria-label="Past reports list"
        >
          {reports.map((report, i) => (
            <article
              key={report.id}
              onClick={() => handleOpenReport(report.id)}
              className={cn(
                "grid grid-cols-[auto_minmax(0,1fr)_auto] cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/40 sm:gap-4 sm:p-5",
                i > 0 && "border-t border-border",
              )}
            >
              <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                <FileClock size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{report.reportTitle}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{report.reportDate}</p>
                  <StatusBadge status={report.status} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Open ${report.reportTitle}`}
                id={`open-report-${report.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenReport(report.id);
                }}
              >
                <ChevronRight size={17} />
              </Button>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
