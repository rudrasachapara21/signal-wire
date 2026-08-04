/**
 * IntakeForm.jsx
 * ──────────────────────────────────────────────────────
 * Landing / home screen for Signal Wire.
 * Collects brand name, description, and optional budget.
 * Validates inline (no popups) and calls onSubmit when ready.
 */

import { useState } from 'react';

/**
 * @param {{ onSubmit: (formData: {brandName: string, description: string, budget: number|null}) => void }} props
 */
export default function IntakeForm({ onSubmit }) {
  const [brandName, setBrandName]     = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget]           = useState('');
  const [errors, setErrors]           = useState({});

  /** Validate all required fields; returns true if form is valid */
  function validate() {
    const next = {};
    if (!brandName.trim()) {
      next.brandName = 'Brand name is required — every dispatch needs a sender.';
    }
    if (!description.trim()) {
      next.description = 'A short description helps us target the right signals.';
    } else if (description.trim().split(/\s+/).length < 5) {
      next.description = 'Please write at least a sentence or two so the AI has enough context.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      brandName:   brandName.trim(),
      description: description.trim(),
      budget:      budget ? parseFloat(budget) : null,
    });
  }

  return (
    <form
      className="intake-form fade-up"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Signal Wire intake form"
    >
      {/* ── Brand Name ────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="brand-name">
          Brand Name
        </label>
        <input
          id="brand-name"
          type="text"
          className={`form-input${errors.brandName ? ' error' : ''}`}
          placeholder="e.g. Brew & Wire Coffee Co."
          value={brandName}
          onChange={(e) => {
            setBrandName(e.target.value);
            if (errors.brandName) setErrors((prev) => ({ ...prev, brandName: '' }));
          }}
          autoComplete="organization"
          maxLength={120}
        />
        {errors.brandName && (
          <span className="form-error" role="alert">
            ⚠ {errors.brandName}
          </span>
        )}
      </div>

      {/* ── Brand Description ─────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="brand-description">
          Brand Description
        </label>
        <p className="form-hint" style={{ marginBottom: '0.4rem' }}>
          2–3 sentences: what you sell, who buys it, and where you operate.
        </p>
        <textarea
          id="brand-description"
          className={`form-textarea${errors.description ? ' error' : ''}`}
          placeholder="e.g. A cosy specialty coffee shop in Bengaluru offering single-origin pour-overs and a calm workspace vibe for remote workers and students."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
          }}
          maxLength={1000}
        />
        {errors.description && (
          <span className="form-error" role="alert">
            ⚠ {errors.description}
          </span>
        )}
      </div>

      {/* ── Budget (optional) ─────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="budget">
          Monthly Ad Budget
          <span className="optional">optional</span>
        </label>
        <p className="form-hint" style={{ marginBottom: '0.4rem' }}>
          Enter your approximate monthly budget in ₹. We'll calculate a recommended split across platforms.
        </p>
        <div className="currency-wrap">
          <span className="currency-symbol">₹</span>
          <input
            id="budget"
            type="number"
            className="form-input"
            placeholder="25000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min="0"
            step="500"
          />
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────── */}
      <button type="submit" className="btn-dispatch" id="generate-dispatch-btn">
        ▶ Generate Dispatch
      </button>

      {/* Subtle legalese */}
      <p
        style={{
          textAlign: 'center',
          marginTop: '1rem',
          fontSize: '0.68rem',
          color: 'var(--clr-text-dim)',
          letterSpacing: '0.08em',
        }}
      >
        AI-generated recommendations — verify before committing spend.
      </p>
    </form>
  );
}
