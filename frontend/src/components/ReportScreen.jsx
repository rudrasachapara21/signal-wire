/**
 * ReportScreen.jsx
 * ──────────────────────────────────────────────────────
 * Full report display screen.
 * Renders all seven dispatch sections from the report data
 * object, plus a "Copy Report" button.
 *
 * The `report` prop shape is documented in
 * src/constants/mockData.js (MOCK_REPORT).
 */

import { useState, useEffect } from 'react';
import ReportSection from './ReportSection';
import { PLATFORM_COLORS } from '../constants/mockData';

/** Format a number as Indian rupees */
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Build a plain-text version of the report for clipboard copy */
function buildPlainText(report) {
  const hr = '─'.repeat(50);
  const hasBudget = report.brand.budget != null;

  const platformsText = report.platforms
    .map((p) => `  ${p.icon} ${p.name} [${p.confidence}]\n     ${p.reason}`)
    .join('\n');

  const competitorsText = report.competitors
    .map(
      (c) =>
        `  ▸ ${c.name}\n     Strength: ${c.strength}\n     Gap: ${c.gap}`
    )
    .join('\n');

  const formatsText = report.contentFormats
    .map((f) => `  [${f.priority}] ${f.format}\n     ${f.description}`)
    .join('\n');

  const influencersText = report.influencers
    .map((inf) => `  ▸ ${inf.category}\n     ${inf.rationale}`)
    .join('\n');

  const budgetText = hasBudget
    ? report.budgetSplit
        .map(
          (b) =>
            `  ${b.platform}: ${b.percentage}% = ${formatINR((b.percentage / 100) * report.brand.budget)}`
        )
        .join('\n')
    : '  No budget entered.';

  const hooksText = report.adHooks.map((h, i) => `  ${i + 1}. ${h}`).join('\n');

  return `
SIGNAL WIRE — AD STRATEGY DISPATCH
${hr}
Brand:       ${report.brand.name}
Description: ${report.brand.description}
${hasBudget ? `Budget:      ${formatINR(report.brand.budget)}/month` : ''}
Generated:   ${new Date(report.generatedAt).toLocaleString('en-IN')}
${hr}

[SIG-01] BEST AD PLATFORMS
${platformsText}

[SIG-02] DEMAND / SEASONALITY SIGNAL
  Signal: ${report.seasonality.currentSignal} (strength ${report.seasonality.signalStrength}/100)
  ${report.seasonality.summary}

[SIG-03] COMPETITOR SNAPSHOT
${competitorsText}

[SIG-04] RECOMMENDED CONTENT FORMATS
${formatsText}

[SIG-05] INFLUENCER / CREATOR CATEGORIES (suggested — verify before use)
${influencersText}

[SIG-06] BUDGET SPLIT
${budgetText}

[SIG-07] AD HOOKS / COPY IDEAS
${hooksText}

${hr}
Signal Wire Advisory Engine — AI-generated. Verify before committing spend.
`.trim();
}

/**
 * @param {{
 *   report: import('../constants/mockData').MOCK_REPORT,
 *   onReset: () => void
 * }} props
 */
export default function ReportScreen({ report, onReset }) {
  const [copied, setCopied] = useState(false);
  const [barsVisible, setBarsVisible] = useState(false);
  const hasBudget = report.brand.budget != null;

  /** Delay budget bars so CSS width transition plays after mount */
  useEffect(() => {
    const tid = setTimeout(() => setBarsVisible(true), 300);
    return () => clearTimeout(tid);
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildPlainText(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea');
      el.value = buildPlainText(report);
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div>
      {/* ── Report header ──────────────────────────── */}
      <header className="report-header fade-up">
        <p className="report-header__meta">
          SIGNAL WIRE DISPATCH &nbsp;·&nbsp;{' '}
          {new Date(report.generatedAt).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
        <h1 className="report-header__brand">{report.brand.name}</h1>
        <p className="report-header__desc">{report.brand.description}</p>
      </header>

      {/* ── Report sections grid ───────────────────── */}
      <div className="report-grid">

        {/* SIG-01 — Best Ad Platforms */}
        <ReportSection label="SIG-01" title="Best Ad Platforms" animDelay={1}>
          {report.platforms.map((p) => (
            <div className="platform-badge" key={p.name}>
              <span className="platform-badge__icon" aria-hidden="true">{p.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                  <span className="platform-badge__name">{p.name}</span>
                  <span className={`platform-badge__confidence ${p.confidence.toLowerCase()}`}>
                    {p.confidence}
                  </span>
                </div>
                <p className="platform-badge__reason">{p.reason}</p>
              </div>
            </div>
          ))}
        </ReportSection>

        {/* SIG-02 — Demand / Seasonality Signal */}
        <ReportSection label="SIG-02" title="Demand / Seasonality Signal" animDelay={2}>
          <span className={`signal-pill ${report.seasonality.currentSignal.toLowerCase()}`}>
            {report.seasonality.currentSignal} — {report.seasonality.signalStrength}/100
          </span>
          <p style={{ fontSize: '0.82rem', color: 'var(--clr-text)', lineHeight: 1.6 }}>
            {report.seasonality.summary}
          </p>

          {/* Mini bar chart */}
          <div className="season-bars" role="img" aria-label="Monthly demand index chart">
            {report.seasonality.months.map((m) => (
              <div className="season-bar-col" key={m.month}>
                <div
                  className="season-bar__fill"
                  style={{ height: `${m.index}%` }}
                />
                <span className="season-bar__label">{m.month.slice(0, 1)}</span>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* SIG-03 — Competitor Snapshot */}
        <ReportSection label="SIG-03" title="Competitor Snapshot" animDelay={3}>
          {report.competitors.map((c) => (
            <div className="competitor-row" key={c.name}>
              <p className="competitor-name">{c.name}</p>
              <p className="competitor-detail">
                <span className="competitor-tag tag-strength">↑ Strength</span>
                {c.strength}
              </p>
              <p className="competitor-detail">
                <span className="competitor-tag tag-gap">↳ Gap</span>
                {c.gap}
              </p>
            </div>
          ))}
        </ReportSection>

        {/* SIG-04 — Content Formats */}
        <ReportSection label="SIG-04" title="Recommended Content Formats" animDelay={4}>
          <ul className="format-list" style={{ listStyle: 'none' }}>
            {report.contentFormats.map((f) => (
              <li className="format-item" key={f.format}>
                <span className={`format-priority ${f.priority.toLowerCase()}`}>
                  {f.priority}
                </span>
                <div>
                  <p className="format-name">{f.format}</p>
                  <p className="format-desc">{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </ReportSection>

        {/* SIG-05 — Influencer / Creator Categories */}
        <ReportSection label="SIG-05" title="Influencer / Creator Categories" animDelay={5}>
          <span className="influencer-warning">Suggested — verify before use</span>
          {report.influencers.map((inf) => (
            <div className="influencer-item" key={inf.category}>
              <p className="influencer-category">{inf.category}</p>
              <p className="influencer-rationale">{inf.rationale}</p>
            </div>
          ))}
        </ReportSection>

        {/* SIG-06 — Budget Split (only if budget was entered) */}
        {hasBudget && (
          <ReportSection label="SIG-06" title="Budget Split" animDelay={6}>
            <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)', marginBottom: 'var(--space-md)' }}>
              Based on total budget of&nbsp;
              <strong style={{ color: 'var(--clr-gold)' }}>
                {formatINR(report.brand.budget)}
              </strong>
              /month
            </p>
            <div className="budget-rows">
              {report.budgetSplit.map((b, i) => {
                const rupees = (b.percentage / 100) * report.brand.budget;
                const color  = Object.values(PLATFORM_COLORS)[i] || 'var(--clr-gold)';
                return (
                  <div className="budget-row" key={b.platform}>
                    <div className="budget-row__header">
                      <span className="budget-row__platform">{b.platform}</span>
                      <span className="budget-row__amounts">
                        {b.percentage}% · {formatINR(rupees)}
                      </span>
                    </div>
                    <div className="budget-bar-track">
                      <div
                        className="budget-bar-fill"
                        style={{
                          width: barsVisible ? `${b.percentage}%` : '0%',
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ReportSection>
        )}

        {/* SIG-07 — Ad Hooks (full width) */}
        <ReportSection
          label="SIG-07"
          title="Ad Hooks / Copy Ideas"
          animDelay={7}
          className="span-2"
        >
          <ul className="hook-list" style={{ listStyle: 'none' }}>
            {report.adHooks.map((hook, i) => (
              <li className="hook-item" key={i}>
                <span className="hook-num">0{i + 1}</span>
                <p className="hook-text">&ldquo;{hook}&rdquo;</p>
              </li>
            ))}
          </ul>
        </ReportSection>
      </div>

      {/* ── Action bar ─────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
          marginTop: 'var(--space-xl)',
          justifyContent: 'center',
        }}
      >
        <button
          className={`btn-copy${copied ? ' copied' : ''}`}
          onClick={handleCopy}
          id="copy-report-btn"
          aria-label="Copy full report to clipboard"
        >
          {copied ? '✓ Copied!' : '⎘ Copy Report'}
        </button>

        <button
          className="btn-ghost"
          onClick={onReset}
          id="new-dispatch-btn"
          aria-label="Start a new dispatch"
        >
          ↩ New Dispatch
        </button>
      </div>
    </div>
  );
}
