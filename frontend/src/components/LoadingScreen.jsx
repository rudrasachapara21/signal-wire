/**
 * LoadingScreen.jsx
 * ──────────────────────────────────────────────────────
 * Shown after form submit while the (mocked) AI report
 * is "being generated". Uses a typewriter-style animated
 * status message and a transmit spinner to stay on-theme.
 */

import { useState, useEffect } from 'react';

/** Steps displayed sequentially as the mock process "runs" */
const STEPS = [
  'Initialising signal wire…',
  'Parsing brand profile…',
  'Scanning demand signals…',
  'Pulling competitor data…',
  'Calibrating platform weights…',
  'Computing budget allocations…',
  'Drafting ad copy hooks…',
  'Compiling dispatch report…',
];

/**
 * @param {{ brandName: string }} props
 */
export default function LoadingScreen({ brandName }) {
  const [stepIndex, setStepIndex] = useState(0);

  /** Advance one status line every ~500 ms */
  useEffect(() => {
    if (stepIndex >= STEPS.length - 1) return;
    const tid = setTimeout(() => setStepIndex((i) => i + 1), 520);
    return () => clearTimeout(tid);
  }, [stepIndex]);

  return (
    <div className="loading-screen fade-up" role="status" aria-live="polite">
      {/* Spinner */}
      <div className="transmit-ring" aria-hidden="true" />

      {/* Title */}
      <h2 className="loading-title">
        Transmitting…
        <span className="typewriter-cursor" aria-hidden="true" />
      </h2>

      <p
        style={{
          fontSize: '0.8rem',
          color: 'var(--clr-text-dim)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Generating dispatch for <strong style={{ color: 'var(--clr-gold)' }}>{brandName}</strong>
      </p>

      {/* Step-by-step progress log */}
      <ul className="progress-steps" aria-label="Processing steps">
        {STEPS.map((step, i) => {
          let state = 'pending';
          if (i < stepIndex) state = 'done';
          if (i === stepIndex) state = 'active';
          return (
            <li key={step} className={state}>
              {step}
            </li>
          );
        })}
      </ul>

      <p
        className="loading-status"
        style={{ color: 'var(--clr-rust-light)', letterSpacing: '0.2em' }}
      >
        — SIGNAL WIRE ADVISORY ENGINE —
      </p>
    </div>
  );
}
