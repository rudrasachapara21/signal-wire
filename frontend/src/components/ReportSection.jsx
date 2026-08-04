/**
 * ReportSection.jsx
 * ──────────────────────────────────────────────────────
 * Reusable "dispatch card" wrapper used by every section
 * in the full report display.
 */

/**
 * @param {{
 *   label: string,          // short code label (e.g. "SIG-01")
 *   title: string,          // section heading
 *   children: React.ReactNode,
 *   className?: string,     // extra class on the card root (e.g. "span-2")
 *   animDelay?: number,     // fade-up animation delay index (0–7)
 * }} props
 */
export default function ReportSection({ label, title, children, className = '', animDelay = 0 }) {
  const delayClass = animDelay > 0 ? ` fade-up-delay-${animDelay}` : '';

  return (
    <section
      className={`dispatch-card fade-up${delayClass}${className ? ' ' + className : ''}`}
      aria-labelledby={`section-${label}`}
    >
      <p className="dispatch-card__label">{label}</p>
      <h2 className="dispatch-card__title" id={`section-${label}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}
