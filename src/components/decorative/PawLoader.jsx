/**
 * PawLoader
 * Branded loading indicator: four paw prints that light up in sequence.
 *
 * IMPORTANT — where to use this vs. Button's built-in spinner:
 * Per the site's usability rules, an elaborate/branded animation must never
 * sit on an action the user repeats constantly. Button.jsx already has its
 * own small Loader2 spinner for in-button loading (form submits, etc.) —
 * that one stays a plain spinner on purpose, since it fires on every click.
 *
 * Use <PawLoader /> only for page-level or section-level loading states
 * (e.g. a listing page's initial data fetch, a full-page transition) — the
 * kind of loading a user sees occasionally, not on every interaction.
 * It respects prefers-reduced-motion (falls back to a static, non-animated
 * paw row) via the .paw-loader__dot rule in index.css.
 */
export default function PawLoader({ className = '', label = 'Memuat...' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`} role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="paw-loader__dot text-brand-orange-end"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <ellipse cx="12" cy="15" rx="6" ry="5" fill="currentColor" />
              <ellipse cx="4" cy="8" rx="2.4" ry="3" fill="currentColor" />
              <ellipse cx="9" cy="4.5" rx="2.4" ry="3" fill="currentColor" />
              <ellipse cx="15" cy="4.5" rx="2.4" ry="3" fill="currentColor" />
              <ellipse cx="20" cy="8" rx="2.4" ry="3" fill="currentColor" />
            </svg>
          </span>
        ))}
      </div>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </div>
  );
}