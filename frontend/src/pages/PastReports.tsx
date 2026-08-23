import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileClock, GitBranch, Loader2, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useReport } from "@/context/ReportContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function RefinedBadge() {
  return (
    <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
      <GitBranch size={10} />
      Refined
    </span>
  );
}

function RatingIcon({ rating }: { rating: "up" | "down" }) {
  if (rating === "up") {
    return <ThumbsUp size={11} className="fill-primary text-primary" />;
  }
  return <ThumbsDown size={11} className="fill-destructive text-destructive" />;
}

export function PastReports() {
  const { user } = useAuth();
  const { reports, reportsLoading, selectReport, fetchReports } = useReport();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      void fetchReports();
    }
  }, [user, fetchReports]);

  function handleOpenReport(id: string) {
    selectReport(id);
    void navigate({ to: "/strategy-report" });
  }

  if (!user) {
    return (
      <>
        <p className="text-sm font-medium text-primary">Strategy library</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Past reports</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Return to earlier recommendations and compare how your strategy has evolved.
        </p>
        <section className="mt-6 flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center sm:mt-8">
          <span className="grid size-14 place-items-center rounded-xl bg-accent text-primary">
            <FileClock size={28} />
          </span>
          <h2 className="mt-4 text-xl font-bold">Sign in to see your history</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Create a free account to save your strategies and access them across sessions.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => void navigate({ to: "/login" })} id="login-for-reports-button">
              Sign in
            </Button>
            <Button variant="secondary" onClick={() => void navigate({ to: "/signup" })} id="signup-for-reports-button">
              Create account
            </Button>
          </div>
        </section>
      </>
    );
  }

  // ── Build a grouped structure: originals → their refinements ──────────────

  // Separate top-level reports (no parent) from refinements (have a parent)
  const refinedIds = new Set(reports.filter((r) => r.refinedFromId).map((r) => r.id));
  const topLevel = reports.filter((r) => !r.refinedFromId);
  const refinementsByParent = new Map<string, typeof reports>();

  for (const r of reports) {
    if (r.refinedFromId) {
      const existing = refinementsByParent.get(r.refinedFromId) ?? [];
      refinementsByParent.set(r.refinedFromId, [...existing, r]);
    }
  }

  return (
    <>
      <p className="text-sm font-medium text-primary">Strategy library</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Past reports</h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        Return to earlier recommendations and compare how your strategy has evolved.
      </p>

      {reportsLoading ? (
        <section className="mt-6 flex min-h-[50vh] flex-col items-center justify-center gap-3 sm:mt-8">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your reports…</p>
        </section>
      ) : reports.length === 0 ? (
        <section className="mt-6 flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center sm:mt-8">
          <span className="grid size-14 place-items-center rounded-xl bg-accent text-primary">
            <FileClock size={28} />
          </span>
          <h2 className="mt-4 text-xl font-bold">No reports yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Your generated advertising strategies will be saved here automatically.
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
          className="mt-6 space-y-3 sm:mt-8"
          aria-label="Past reports list"
        >
          {topLevel.map((report) => {
            const children = refinementsByParent.get(report.id) ?? [];
            return (
              <div
                key={report.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                {/* Parent report row */}
                <article
                  onClick={() => handleOpenReport(report.id)}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/40 sm:gap-4 sm:p-5"
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                    <FileClock size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{report.reportTitle}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-muted-foreground">{report.reportDate}</p>
                      <StatusBadge status={report.status} />
                      {report.rating && <RatingIcon rating={report.rating} />}
                      {children.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {children.length} refinement{children.length > 1 ? "s" : ""}
                        </span>
                      )}
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

                {/* Refinement rows, nested */}
                {children.length > 0 && (
                  <div className="border-t border-border bg-muted/20">
                    {children.map((child) => (
                      <article
                        key={child.id}
                        onClick={() => handleOpenReport(child.id)}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] cursor-pointer items-center gap-3 border-t border-border/50 first:border-t-0 px-4 py-3 transition-colors hover:bg-muted/40 sm:gap-4 sm:px-5"
                      >
                        {/* Indent connector */}
                        <div className="flex items-center justify-center">
                          <span className="grid size-8 place-items-center rounded-lg bg-background text-muted-foreground">
                            <GitBranch size={14} />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="truncate text-sm font-medium">{child.reportTitle}</h2>
                            <RefinedBadge />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{child.reportDate}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Open refined report ${child.reportTitle}`}
                          id={`open-report-${child.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReport(child.id);
                          }}
                        >
                          <ChevronRight size={17} />
                        </Button>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
