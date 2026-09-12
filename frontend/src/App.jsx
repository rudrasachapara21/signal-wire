/**
 * App.jsx
 * ──────────────────────────────────────────────────────
 * Root application component.
 * Controls which screen is shown: form → loading → report.
 *
 * State machine:
 *   'form'    — IntakeForm is visible
 *   'loading' — LoadingScreen is visible while backend generates report
 *   'report'  — ReportScreen is visible with populated data
 */

import { useState } from 'react';
import IntakeForm    from './components/IntakeForm';
import LoadingScreen from './components/LoadingScreen';
import ReportScreen  from './components/ReportScreen';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

export default function App() {
  const [screen, setScreen]     = useState('form');  // 'form' | 'loading' | 'report'
  const [report, setReport]     = useState(null);
  const [formData, setFormData] = useState(null);
  const [error, setError]       = useState(null);

  /**
   * Called by IntakeForm on valid submit.
   * POSTs to /api/generate-report and transitions to the report screen
   * on success, or reverts to the form with an error message on failure.
   */
  async function handleFormSubmit(data) {
    setFormData(data);
    setError(null);
    setScreen('loading');

    try {
      const res = await fetch(`${API_BASE}/api/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName:   data.brandName,
          description: data.description,
          budget:      data.budget,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        // Backend returned a structured error (4xx / 5xx)
        throw new Error(json.error ?? `Server error ${res.status}`);
      }

      setReport(json);
      setScreen('report');
    } catch (err) {
      // Network failure, timeout, or backend error — never strand on loading
      setError(err.message ?? 'Something went wrong. Please try again.');
      setScreen('form');
    }
  }

  /** Resets everything back to the intake form */
  function handleReset() {
    setScreen('form');
    setReport(null);
    setFormData(null);
    setError(null);
  }

  return (
    <>
      {/* Decorative scanline overlay — purely cosmetic */}
      <div className="scanlines" aria-hidden="true" />

      <div className="app-wrapper">
        {/* ── Masthead ─────────────────────────────── */}
        <header className="masthead" role="banner">
          <p className="masthead__service-tag">Advisory Wire Service · Est. 2025</p>
          <h1 className="masthead__title">Signal Wire</h1>
          <p className="masthead__subtitle">AI-Powered Ad Strategy Dispatch</p>
          <p className="masthead__ticker">
            ● LIVE &nbsp;·&nbsp; GEMINI-POWERED &nbsp;·&nbsp; INDIA MARKET FOCUS
          </p>
        </header>

        {/* ── Screen router ────────────────────────── */}
        {screen === 'form' && (
          <>
            {error && (
              <div className="error-banner" role="alert">
                ⚠ {error}
              </div>
            )}
            <IntakeForm onSubmit={handleFormSubmit} />
          </>
        )}

        {screen === 'loading' && (
          <LoadingScreen brandName={formData?.brandName ?? ''} />
        )}

        {screen === 'report' && report && (
          <ReportScreen report={report} onReset={handleReset} />
        )}
      </div>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="site-footer" role="contentinfo">
        SIGNAL WIRE &nbsp;·&nbsp; AI-GENERATED RECOMMENDATIONS &nbsp;·&nbsp; VERIFY BEFORE COMMITTING SPEND
      </footer>
    </>
  );
}
