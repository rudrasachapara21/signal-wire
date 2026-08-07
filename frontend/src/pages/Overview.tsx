import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Instagram,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useReport } from "@/context/ReportContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Button } from "@/components/ui/button";

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const DEFAULT_CHECKLIST_ITEMS = [
  { label: "Brand description", done: false },
  { label: "Product category", done: false },
  { label: "Audience profile", done: false },
  { label: "Target locations", done: false },
  { label: "Monthly budget", done: false },
];

export function Overview() {
  const { user } = useAuth();
  const { report } = useReport();
  const { guard } = useRequireAuth();
  const navigate = useNavigate();

  const greeting = user
    ? `Good afternoon, ${user.name.split(" ")[0]}.`
    : "Good afternoon.";

  const hasReport = Boolean(report);

  const completedCount = hasReport ? 5 : 0;
  const totalCount = 5;
  const progressPct = hasReport ? 100 : 0;

  return (
    <>
      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{todayLabel()}</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            {greeting}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {hasReport
              ? `Your strategy for ${report?.reportTitle} is active. Here's the overall outlook.`
              : user
                ? "Your brand profile is ready to analyze. Complete your details to get your tailored ad plan."
                : "Explore your AI-powered advertising plan. Sign in or analyze your brand to get started."}
          </p>
        </div>
        <Button
          size="lg"
          id="analyze-brand-button"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => guard(() => void navigate({ to: "/brand-profile" }))}
        >
          <Sparkles size={17} />
          {hasReport ? "Update brand strategy" : "Analyze my brand"}
        </Button>
      </header>

      {/* Stat cards */}
      <section
        className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
        aria-label="Brand stats"
      >
        {[
          {
            label: "Brand readiness",
            value: hasReport ? `${report?.confidenceScore}%` : "0%",
            note: hasReport
              ? "High confidence strategy score"
              : "Complete brand profile to analyze",
            icon: Target,
          },
          {
            label: "Best channel",
            value: hasReport ? report?.channels[0]?.name || "—" : "—",
            note: hasReport
              ? `${report?.channels[0]?.fit}% audience fit`
              : "No strategy generated yet",
            icon: Instagram,
          },
          {
            label: "Creator matches",
            value: hasReport ? `${report?.creators.length}` : "—",
            note: hasReport
              ? `Top match: ${report?.creators[0]?.name}`
              : "No matches yet",
            icon: Users,
          },
        ].map(({ label, value, note, icon: Icon }) => (
          <article
            key={label}
            className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon size={18} className="shrink-0 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
            <p className="mt-2 text-xs font-medium text-primary">{note}</p>
          </article>
        ))}
      </section>

      {/* Advisor priority — dark card */}
      <section
        className="mt-4 overflow-hidden rounded-lg bg-foreground p-5 text-background sm:mt-5 sm:p-6 lg:p-8"
        aria-label="Advisor priority"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-accent">
              <span className="signal-dot size-2 rounded-full bg-accent" />
              Your advisor's priority
            </div>
            <h2 className="mt-3 text-xl font-bold sm:text-2xl">
              {hasReport
                ? report?.executiveRecommendation.headline
                : "Generate your first strategy report"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-background/70">
              {hasReport
                ? report?.executiveRecommendation.body
                : "Tell Signal Wire about your product, target demographic, and budget. Our AI model will calculate your ideal channel mix and creator shortlist."}
            </p>
          </div>
          <Button
            className="w-full shrink-0 bg-background text-foreground hover:bg-background/90 sm:w-auto"
            onClick={() =>
              void navigate({
                to: hasReport ? "/strategy-report" : "/brand-profile",
              })
            }
            id="open-strategy-button"
          >
            {hasReport ? "Open strategy" : "Analyze my brand"}{" "}
            <ArrowRight size={16} />
          </Button>
        </div>

        {/* Channel cards */}
        {hasReport ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report?.channels.map((channel, index) => (
              <article
                key={channel.name}
                className="rounded-lg border border-background/15 bg-background/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {index + 1}. {channel.name}
                  </span>
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
                    {channel.fit}% fit
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-background/60">
                  {channel.reason}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-background/15 bg-background/5 p-4 text-center text-xs text-background/60">
            Your recommended channel mix will appear here after analysis.
          </div>
        )}
      </section>

      {/* Bottom section */}
      <section className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 lg:grid-cols-[1.2fr_.8fr]">
        {/* Creator matches */}
        <article className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold sm:text-lg">
                Top creator matches
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ranked by audience and content relevance
              </p>
            </div>
            {hasReport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void navigate({ to: "/strategy-report" })}
                id="view-all-creators-button"
              >
                View all <ChevronRight size={15} />
              </Button>
            )}
          </div>

          {hasReport ? (
            <div className="mt-4 divide-y divide-border sm:mt-5">
              {report?.creators.map((creator) => (
                <div
                  key={creator.name}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0 last:pb-0 sm:py-4"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {creator.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {creator.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {creator.niche} · {creator.audience}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {creator.match}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No creator matches yet. Generate a strategy to view recommended creator archetypes.
            </p>
          )}
        </article>

        {/* Launch checklist */}
        <article className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold sm:text-lg">Launch checklist</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedCount} of {totalCount} details complete
          </p>
          {/* Progress bar */}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted sm:mt-5">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Items */}
          <div className="mt-4 space-y-3 sm:mt-5">
            {DEFAULT_CHECKLIST_ITEMS.map(({ label }) => {
              const done = hasReport;
              return (
                <div key={label} className="flex min-h-[28px] items-center gap-3 text-sm">
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : "border border-border"
                    }`}
                  >
                    {done && <Check size={12} />}
                  </span>
                  <span className={done ? "" : "text-muted-foreground"}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <Button
            className="mt-5 h-11 w-full"
            variant="secondary"
            onClick={() =>
              guard(() => void navigate({ to: "/brand-profile" }))
            }
            id="complete-profile-button"
          >
            {hasReport ? "Update brand profile" : "Complete brand profile"}
          </Button>
        </article>
      </section>
    </>
  );
}
