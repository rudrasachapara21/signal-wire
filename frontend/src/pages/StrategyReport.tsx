import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChevronUp,
  GitBranch,
  HelpCircle,
  Loader2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useReport, type StoredReport } from "@/context/ReportContext";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:5001";

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const REFINE_SUGGESTIONS = [
  "Increase budget allocation to ₹80,000",
  "Focus more on TikTok strategy",
  "Also target men aged 25–35",
  "Emphasise regional language content",
  "Add more influencer detail",
];

// ─── RefinePanel ──────────────────────────────────────────────────────────────

interface RefinePanelProps {
  reportId: string;
  onRefined: (report: StoredReport) => void;
}

function RefinePanel({ reportId, onRefined }: RefinePanelProps) {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = request.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/reports/${reportId}/refine`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refinementRequest: trimmed }),
      });

      const data = (await res.json()) as StoredReport & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      onRefined(data);
      setOpen(false);
      setRequest("");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Refinement failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Wand2 size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold">Refine this strategy</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ask for a targeted change — budget, platform focus, audience, tone.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            id="open-refine-panel-button"
            className="shrink-0"
          >
            <Wand2 size={14} />
            Refine
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Wand2 size={16} />
          </span>
          <p className="text-sm font-semibold">What would you like to change?</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setOpen(false); setError(null); }}
          aria-label="Close refine panel"
        >
          <ChevronUp size={16} />
        </Button>
      </div>

      {/* Suggestion chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {REFINE_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRequest(s)}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          id="refinement-request-input"
          rows={3}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="e.g. Increase budget to ₹80,000 and focus more on TikTok…"
          disabled={loading}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring disabled:opacity-60"
        />

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Only the relevant parts of the strategy will change.
          </p>
          <Button
            type="submit"
            size="sm"
            disabled={loading || !request.trim()}
            id="submit-refinement-button"
            className="shrink-0"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Refining…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Apply changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── FeedbackControl ─────────────────────────────────────────────────────────

type Rating = "up" | "down" | null;

interface FeedbackControlProps {
  reportId: string;
  initialRating: Rating;
  initialNote: string | null;
  onFeedback: (rating: Rating, note?: string | null) => void;
}

function FeedbackControl({ reportId, initialRating, initialNote, onFeedback }: FeedbackControlProps) {
  const [rating, setRating] = useState<Rating>(initialRating);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);

  async function submitFeedback(newRating: Rating, noteText?: string) {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${reportId}/feedback`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: newRating,
          feedbackNote: noteText ?? undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        console.error("[feedback]", d.error);
        return;
      }
      setRating(newRating);
      onFeedback(newRating, noteText ?? null);
    } finally {
      setSaving(false);
    }
  }

  function handleThumbsUp() {
    // Toggle: clicking the active rating clears it
    const next: Rating = rating === "up" ? null : "up";
    setShowNote(false);
    void submitFeedback(next);
  }

  function handleThumbsDown() {
    if (rating === "down") {
      // Toggle off
      setShowNote(false);
      void submitFeedback(null);
    } else {
      // Set to down and reveal the optional note
      void submitFeedback("down");
      setShowNote(true);
    }
  }

  async function handleNoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitFeedback("down", note.trim() || undefined);
    setShowNote(false);
  }

  const isUp = rating === "up";
  const isDown = rating === "down";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Was this useful?</span>
        <button
          type="button"
          id="feedback-thumbs-up"
          aria-label="Thumbs up — strategy was useful"
          disabled={saving}
          onClick={handleThumbsUp}
          className={`flex size-8 items-center justify-center rounded-lg border transition-all ${
            isUp
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary"
          } disabled:opacity-50`}
        >
          <ThumbsUp size={15} className={isUp ? "fill-current" : ""} />
        </button>
        <button
          type="button"
          id="feedback-thumbs-down"
          aria-label="Thumbs down — strategy wasn't useful"
          disabled={saving}
          onClick={handleThumbsDown}
          className={`flex size-8 items-center justify-center rounded-lg border transition-all ${
            isDown
              ? "border-destructive bg-destructive text-destructive-foreground"
              : "border-border bg-background text-muted-foreground hover:border-destructive/40 hover:text-destructive"
          } disabled:opacity-50`}
        >
          <ThumbsDown size={15} className={isDown ? "fill-current" : ""} />
        </button>
      </div>

      {/* Optional note — only shown after thumbs-down */}
      {showNote && (
        <form
          onSubmit={handleNoteSubmit}
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
        >
          <input
            id="feedback-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What wasn't useful? (optional)"
            maxLength={500}
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="submit"
            id="feedback-note-submit"
            disabled={saving}
            className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "…" : "Send"}
          </button>
          <button
            type="button"
            onClick={() => setShowNote(false)}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Skip
          </button>
        </form>
      )}
    </div>
  );
}

// ─── RefinedFromBreadcrumb ─────────────────────────────────────────────────────

function RefinedFromBreadcrumb({ refinedFromId, reports }: { refinedFromId: string; reports: { id: string; reportTitle?: string }[] }) {
  const original = reports.find((r) => r.id === refinedFromId);
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <GitBranch size={12} className="shrink-0" />
      <span>Refined from</span>
      <span className="font-medium text-foreground">
        {original?.reportTitle ?? "original report"}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StrategyReport() {
  const { user } = useAuth();
  const { report, currentReportId, reports, applyRefinement, updateFeedback } = useReport();
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

  // Check if the currently active report is a refinement
  const activeStored = currentReportId
    ? reports.find((r) => r.id === currentReportId)
    : null;
  const refinedFromId = activeStored?.refinedFromId ?? null;

  // The refine panel only shows for logged-in users with a real DB-backed report id
  const canRefine = Boolean(user) && Boolean(currentReportId) && !currentReportId?.startsWith("local-");

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-primary">
              Strategy report · {reportDate}
            </p>
            {refinedFromId && (
              <RefinedFromBreadcrumb
                refinedFromId={refinedFromId}
                reports={reports}
              />
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{reportTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            A practical channel and creator strategy based on your brand profile.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Feedback control — shown for logged-in users with a saved report */}
          {user && activeStored && !currentReportId?.startsWith("local-") && (
            <FeedbackControl
              reportId={activeStored.id}
              initialRating={activeStored.rating ?? null}
              initialNote={activeStored.feedbackNote ?? null}
              onFeedback={(r, note) => updateFeedback(activeStored.id, r, note)}
            />
          )}
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
      </div>

      {/* Refine panel — shown above main content for discoverability */}
      {canRefine && currentReportId && (
        <div className="mt-5">
          <RefinePanel
            reportId={currentReportId}
            onRefined={(refined) => applyRefinement(refined)}
          />
        </div>
      )}
      {!user && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Wand2 size={15} className="shrink-0 text-primary" />
          <span>
            <button
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => void navigate({ to: "/login" })}
            >
              Sign in
            </button>{" "}
            to refine this strategy with targeted changes.
          </span>
        </div>
      )}

      {/* Main content grid */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Left column */}
        <div className="space-y-4 sm:space-y-5">
          {/* Executive recommendation */}
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
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold sm:text-lg">
                Recommended platform mix
              </h2>
              <span className="rounded-full bg-accent/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                AI-assessed fit
              </span>
            </div>
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
                  <p className="mt-1 text-xs text-muted-foreground">{c.niche}</p>
                  {c.audience ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.audience} followers
                    </p>
                  ) : null}
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Strategy confidence
              </p>
              <div className="group relative inline-block cursor-help">
                <HelpCircle size={14} className="text-muted-foreground transition-colors hover:text-foreground" />
                <div className="pointer-events-none absolute right-0 top-6 z-20 w-64 rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg opacity-0 transition-opacity group-hover:opacity-100 sm:w-72">
                  <p className="font-semibold text-foreground mb-1">Calculated Signal Score</p>
                  <p className="leading-relaxed text-muted-foreground">
                    Calculated from data completeness, budget realism, verified creator matches, and available market data for your category.
                  </p>
                </div>
              </div>
            </div>
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
              Calculated from data completeness, budget realism, verified creator matches, and category data.
            </p>
          </article>

          {/* First 30 days */}
          <article className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">First 30 days</p>
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
