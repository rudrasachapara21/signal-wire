import { ChevronRight, FileClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pastReports, type ReportStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: ReportStatus }) {
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
  return (
    <>
      <p className="text-sm font-medium text-primary">Strategy library</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Past reports</h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        Return to earlier recommendations and compare how your strategy has
        evolved.
      </p>

      <section
        className="mt-6 overflow-hidden rounded-lg border border-border bg-card sm:mt-8"
        aria-label="Past reports list"
      >
        {pastReports.map((report, i) => (
          <article
            key={report.id}
            className={cn(
              "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 sm:gap-4 sm:p-5",
              i > 0 && "border-t border-border",
            )}
          >
            <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
              <FileClock size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{report.name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{report.date}</p>
                <StatusBadge status={report.status} />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Open ${report.name}`}
              id={`open-report-${report.id}`}
            >
              <ChevronRight size={17} />
            </Button>
          </article>
        ))}
      </section>
    </>
  );
}
