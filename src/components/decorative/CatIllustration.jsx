/**
 * CatIllustration
 * One shared, friendly cat illustration used everywhere a cute illustration
 * is called for (empty states, About Us / Login supporting visual, OTP and
 * success screens). Keeping this as a single component — instead of a
 * one-off SVG per page — is what keeps the "cute" consistent and avoids
 * duplicated assets across the site.
 *
 * `mood`:
 *  - 'calm'      : sitting, eyes open — good for security-relevant screens
 *                  (Login/Register side panel) where "welcoming" beats "silly".
 *  - 'happy'     : default, gentle smile — good for empty states / hero support.
 *  - 'celebrate' : party-ish (small confetti flecks) — reserve for one-time
 *                  moments (success screens), never for repeated actions.
 */
export default function CatIllustration({ className = '', mood = 'happy' }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Ilustrasi kucing FurKeeper"
    >
      {mood === 'celebrate' && (
        <g aria-hidden="true">
          <circle cx="30" cy="30" r="4" fill="#F4A261" />
          <circle cx="170" cy="40" r="3" fill="#6B2C2C" />
          <circle cx="20" cy="120" r="3" fill="#E9C46A" />
          <circle cx="175" cy="130" r="4" fill="#FF9A3C" />
          <rect x="150" y="20" width="6" height="6" fill="#6FCF97" transform="rotate(20 150 20)" />
          <rect x="40" y="160" width="6" height="6" fill="#F4A261" transform="rotate(-15 40 160)" />
        </g>
      )}

      {/* tail */}
      <path
        d="M150 140 C175 130 178 95 158 85"
        stroke="#F4A261"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* body */}
      <ellipse cx="100" cy="145" rx="45" ry="32" fill="#FCEAE0" />

      {/* head */}
      <circle cx="100" cy="90" r="42" fill="#F4A261" />

      {/* ears */}
      <path d="M66 65 L58 32 L92 58 Z" fill="#F4A261" />
      <path d="M134 65 L142 32 L108 58 Z" fill="#F4A261" />
      <path d="M70 60 L65 42 L86 58 Z" fill="#FCEAE0" />
      <path d="M130 60 L135 42 L114 58 Z" fill="#FCEAE0" />

      {/* face */}
      <ellipse cx="100" cy="100" rx="26" ry="20" fill="#FCEAE0" />

      {mood === 'calm' ? (
        <>
          <path d="M84 92 q4 -4 8 0" stroke="#2B211E" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M108 92 q4 -4 8 0" stroke="#2B211E" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="88" cy="92" r="4" fill="#2B211E" />
          <circle cx="112" cy="92" r="4" fill="#2B211E" />
        </>
      )}

      {/* nose + mouth */}
      <path d="M96 104 L104 104 L100 109 Z" fill="#E76F51" />
      <path d="M100 109 q-8 8 -16 2" stroke="#2B211E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M100 109 q8 8 16 2" stroke="#2B211E" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* whiskers */}
      <path d="M60 98 H78" stroke="#2B211E" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M60 106 H78" stroke="#2B211E" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M122 98 H140" stroke="#2B211E" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M122 106 H140" stroke="#2B211E" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

      {/* paws */}
      <ellipse cx="80" cy="172" rx="10" ry="7" fill="#F4A261" />
      <ellipse cx="120" cy="172" rx="10" ry="7" fill="#F4A261" />
    </svg>
  );
}