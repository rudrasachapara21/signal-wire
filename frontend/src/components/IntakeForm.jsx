/**
 * IntakeForm — KAN-16
 *
 * Props:
 *   onSubmit(formData)  — called with { brandName, brandDescription, budget }
 *                         budget is undefined when left blank.
 *   isSubmitting        — when true, disables the submit button (e.g. while
 *                         the parent awaits an async operation). The form
 *                         itself is intentionally unaware of async state.
 *
 * Styling note: intentionally minimal/plain for now.
 * KAN-20 will layer the dark-green / gold / rust "wire dispatch" theme
 * (Special Elite + IBM Plex fonts etc.) on top.
 * KAN-19 will handle full responsive polish.
 */

import { useState } from "react";

// ── constants ────────────────────────────────────────────────────────────────

const DESCRIPTION_MAX_CHARS = 500;

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns an object of field-level error strings (empty string = no error).
 * Only validates required fields; budget is optional.
 */
function validate(fields) {
  const errors = {};

  if (!fields.brandName.trim()) {
    errors.brandName = "Brand name is required.";
  }

  if (!fields.brandDescription.trim()) {
    errors.brandDescription = "Brand description is required.";
  } else if (fields.brandDescription.length > DESCRIPTION_MAX_CHARS) {
    errors.brandDescription = `Description must be ${DESCRIPTION_MAX_CHARS} characters or fewer.`;
  }

  return errors;
}

/** Returns true when there are no validation errors. */
function isFormValid(errors) {
  return Object.keys(errors).length === 0;
}

// ── component ─────────────────────────────────────────────────────────────────

/**
 * IntakeForm
 *
 * Controlled form component that collects brand intake data.
 * Passes validated data up via `onSubmit(formData)` — no API calls here.
 */
export default function IntakeForm({ onSubmit, isSubmitting = false }) {
  // ── field state ────────────────────────────────────────────────────────────
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [budget, setBudget] = useState("");

  // ── touched state: only show errors after the user has interacted ──────────
  const [touched, setTouched] = useState({
    brandName: false,
    brandDescription: false,
  });

  // ── derived ───────────────────────────────────────────────────────────────
  const errors = validate({ brandName, brandDescription });
  const formValid = isFormValid(errors);
  const descCharsLeft = DESCRIPTION_MAX_CHARS - brandDescription.length;
  const descCounterOverLimit = brandDescription.length > DESCRIPTION_MAX_CHARS;

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Mark all required fields as touched so errors surface on submit.
    setTouched({ brandName: true, brandDescription: true });

    if (!formValid || isSubmitting) return;

    const formData = {
      brandName: brandName.trim(),
      brandDescription: brandDescription.trim(),
      // Only include budget when the user actually typed something.
      ...(budget !== "" && { budget: Number(budget) }),
    };

    onSubmit(formData);
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Brand intake form"
      style={styles.form}
    >
      <h2 style={styles.heading}>Tell us about your brand</h2>

      {/* ── Brand Name ─────────────────────────────────────────────────── */}
      <div style={styles.fieldGroup}>
        <label htmlFor="intake-brand-name" style={styles.label}>
          Brand Name <span style={styles.required} aria-hidden="true">*</span>
        </label>
        <input
          id="intake-brand-name"
          type="text"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          onBlur={() => handleBlur("brandName")}
          placeholder="e.g. Signal Wire"
          aria-required="true"
          aria-describedby={
            touched.brandName && errors.brandName
              ? "intake-brand-name-error"
              : undefined
          }
          aria-invalid={touched.brandName && !!errors.brandName}
          style={{
            ...styles.input,
            ...(touched.brandName && errors.brandName ? styles.inputError : {}),
          }}
        />
        {touched.brandName && errors.brandName && (
          <span
            id="intake-brand-name-error"
            role="alert"
            style={styles.errorMsg}
          >
            {errors.brandName}
          </span>
        )}
      </div>

      {/* ── Brand Description ──────────────────────────────────────────── */}
      <div style={styles.fieldGroup}>
        <label htmlFor="intake-brand-description" style={styles.label}>
          Brand Description{" "}
          <span style={styles.required} aria-hidden="true">*</span>
        </label>
        <textarea
          id="intake-brand-description"
          value={brandDescription}
          onChange={(e) => setBrandDescription(e.target.value)}
          onBlur={() => handleBlur("brandDescription")}
          placeholder="Describe your brand, target audience, and core message..."
          rows={5}
          aria-required="true"
          aria-describedby={[
            "intake-brand-description-counter",
            touched.brandDescription && errors.brandDescription
              ? "intake-brand-description-error"
              : null,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={touched.brandDescription && !!errors.brandDescription}
          style={{
            ...styles.input,
            ...styles.textarea,
            ...(touched.brandDescription && errors.brandDescription
              ? styles.inputError
              : {}),
          }}
        />
        {/* Character counter */}
        <span
          id="intake-brand-description-counter"
          style={{
            ...styles.charCounter,
            ...(descCounterOverLimit ? styles.charCounterOver : {}),
          }}
          aria-live="polite"
        >
          {descCharsLeft >= 0
            ? `${descCharsLeft} characters remaining`
            : `${Math.abs(descCharsLeft)} characters over limit`}
        </span>
        {touched.brandDescription && errors.brandDescription && (
          <span
            id="intake-brand-description-error"
            role="alert"
            style={styles.errorMsg}
          >
            {errors.brandDescription}
          </span>
        )}
      </div>

      {/* ── Budget (optional) ──────────────────────────────────────────── */}
      <div style={styles.fieldGroup}>
        <label htmlFor="intake-budget" style={styles.label}>
          Budget{" "}
          <span style={styles.optional}>(optional)</span>
        </label>
        <div style={styles.budgetWrapper}>
          {/* Currency indicator */}
          <span style={styles.currencyPrefix} aria-hidden="true">
            Rs.
          </span>
          <input
            id="intake-budget"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0"
            min="0"
            step="1"
            aria-label="Budget in INR (Indian Rupees)"
            style={{ ...styles.input, ...styles.budgetInput }}
          />
        </div>
        <span style={styles.helpText}>Monthly advertising budget in INR (Rs.)</span>
      </div>

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <div style={styles.submitRow}>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
          style={{
            ...styles.submitButton,
            ...(isSubmitting ? styles.submitButtonDisabled : {}),
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}

// ── inline styles (intentionally minimal — KAN-20 owns theming) ───────────────

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    maxWidth: "640px",
    width: "100%",
    margin: "0 auto",
    padding: "1.5rem",
    boxSizing: "border-box",
  },

  heading: {
    margin: "0 0 0.25rem",
    fontSize: "1.25rem",
    fontWeight: 600,
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },

  label: {
    fontSize: "0.9rem",
    fontWeight: 500,
  },

  required: {
    color: "#c0392b",
    marginLeft: "2px",
  },

  optional: {
    fontSize: "0.8rem",
    fontWeight: 400,
    color: "#666",
    marginLeft: "4px",
  },

  input: {
    padding: "0.5rem 0.6rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  inputError: {
    borderColor: "#c0392b",
  },

  textarea: {
    resize: "vertical",
    minHeight: "7rem",
  },

  charCounter: {
    fontSize: "0.78rem",
    color: "#666",
    textAlign: "right",
  },

  charCounterOver: {
    color: "#c0392b",
    fontWeight: 600,
  },

  errorMsg: {
    fontSize: "0.8rem",
    color: "#c0392b",
  },

  budgetWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0",
    border: "1px solid #ccc",
    borderRadius: "4px",
    overflow: "hidden",
    width: "100%",
    boxSizing: "border-box",
  },

  currencyPrefix: {
    padding: "0.5rem 0.65rem",
    background: "#f4f4f4",
    fontSize: "1rem",
    color: "#444",
    borderRight: "1px solid #ccc",
    userSelect: "none",
    flexShrink: 0,
  },

  budgetInput: {
    border: "none",
    borderRadius: "0",
    flex: 1,
    minWidth: 0,
  },

  helpText: {
    fontSize: "0.78rem",
    color: "#666",
  },

  submitRow: {
    display: "flex",
    justifyContent: "flex-end",
  },

  submitButton: {
    padding: "0.55rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid #333",
    borderRadius: "4px",
    background: "#222",
    color: "#fff",
  },

  submitButtonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
};
