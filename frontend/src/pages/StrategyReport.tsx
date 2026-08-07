import { useNavigate } from "@tanstack/react-router";
import { BarChart3, BookOpen, Sparkles } from "lucide-react";
import { useReport } from "@/context/ReportContext";
import { Button } from "@/components/ui/button";

export function StrategyReport() {
  const { report } = useReport();
  const navigate = useNavigate();

  if (!report) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-accent text-primary">
          <BarChart3 size={32} />
        </div>
        <h1 className="mt-6 text-2xl font-bold">You haven't generated a strategy yet</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Tell us what you sell, your target audience, and budget to get a custom
          channel allocation, creator shortlist, and 30-day action plan.
        </p>
        <Button
          size="lg"
          className="mt-6"
          onClick={() => void navigate({ to: "/brand-profile" })}
        >
          <Sparkles size={17} className="mr-2" />
          Generate strategy
        </Button>
      </div>
    );
  }

  const {
    reportTitle,
    reportDate,
    executiveRecommendation,
    confidenceScore,
    channels,
    creators,
    first30Days,
  } = report;

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Strategy report · {reportDate}
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{reportTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            A practical channel and creator strategy based on your brand profile.
          </p>
        </div>
        <Button
          variant="secondary"
          id="export-report-button"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => window.print()}
        >
          <BookOpen size={16} />
          Export report
        </Button>
      </div>

      {/* Main content grid — stacks on mobile/tablet, side-by-side on lg+ */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Left column — main content */}
        <div className="space-y-4 sm:space-y-5">
          {/* Executive recommendation — dark card */}
          <article className="rounded-lg bg-foreground p-5 text-background sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Executive recommendation
            </p>
            <h2 className="mt-3 text-lg font-bold sm:text-xl">
              {executiveRecommendation.headline}
            </h2>
            <p className="mt-3 text-sm leading-6 text-background/70">
              {executiveRecommendation.body}
            </p>
          </article>

          {/* Recommended platform mix */}
          <article className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="text-base font-bold sm:text-lg">
              Recommended platform mix
            </h2>
            <div className="mt-4 space-y-5 sm:mt-5">
              {channels.map((channel) => (
                <div key={channel.name}>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
                    <span className="font-semibold">{channel.name}</span>
                    <span className="text-muted-foreground">
                      {channel.allocation} ·{" "}
                      <span className="font-medium text-primary">
                        {channel.fit}% fit
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(0, channel.fit))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {channel.reason}
                  </p>
                </div>
              ))}
            </div>
          </article>

          {/* Creator shortlist */}
          <article className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="text-base font-bold sm:text-lg">Creator shortlist</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:mt-5">
              {creators.map((c) => (
                <div
                  key={c.name}
                  className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {c.initials}
                  </span>
                  <p className="mt-3 text-sm font-semibold">{c.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.niche}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.audience} followers
                  </p>
                  <p className="mt-3 text-xs font-semibold text-primary">
                    {c.match}% relevance
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4 sm:space-y-5">
          {/* Strategy confidence */}
          <article className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">
              Strategy confidence
            </p>
            <p className="mt-3 text-4xl font-bold">
              {confidenceScore}
              <span className="text-xl text-muted-foreground">/100</span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, confidenceScore))}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Calculated based on product format, audience intent, budget, and platform benchmarks.
            </p>
          </article>

          {/* First 30 days */}
          <article className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">
              First 30 days
            </p>
            <ol className="mt-4 space-y-4 text-sm">
              {first30Days.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="leading-5">{step}</span>
                </li>
              ))}
            </ol>
          </article>
        </aside>
      </section>
    </>
  );
}
