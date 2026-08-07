import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  channels,
  creators,
  strategyReport,
  first30Days,
} from "@/lib/mock-data";

export function StrategyReport() {
  const { executiveRecommendation, confidenceScore, title, date } =
    strategyReport;

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Strategy report · {date}
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            A practical channel and creator strategy based on your brand
            profile.
          </p>
        </div>
        <Button
          variant="secondary"
          id="export-report-button"
          className="w-full shrink-0 sm:w-auto"
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
                      style={{ width: `${channel.fit}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {channel.reason}
                  </p>
                </div>
              ))}
            </div>
          </article>

          {/* Creator shortlist — 1 col mobile, 2 col tablet (sm), 3 col desktop (md+) */}
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

        {/* Right sidebar — renders below on mobile/tablet, beside on lg+ */}
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
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              High confidence based on product format, audience intent, budget,
              and category benchmarks.
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
