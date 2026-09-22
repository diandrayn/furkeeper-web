/**
 * DogIllustration
 * Companion to CatIllustration — same shared-component approach, same
 * `mood` API ('calm' | 'happy' | 'celebrate'), so pages can mix cat/dog
 * without introducing new one-off assets.
 */
export default function DogIllustration({ className = '', mood = 'happy' }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Ilustrasi anjing FurKeeper"
    >
      {mood === 'celebrate' && (
        <g aria-hidden="true">
          <circle cx="28" cy="35" r="4" fill="#F4A261" />
          <circle cx="172" cy="45" r="3" fill="#6B2C2C" />
          <circle cx="24" cy="130" r="3" fill="#E9C46A" />
          <circle cx="176" cy="120" r="4" fill="#FF9A3C" />
          <rect x="145" y="25" width="6" height="6" fill="#6FCF97" transform="rotate(20 145 25)" />
          <rect x="35" y="150" width="6" height="6" fill="#F4A261" transform="rotate(-15 35 150)" />
        </g>
      )}

      {/* tail */}
      <path
        d="M148 150 C170 145 172 118 156 108"
        stroke="#6B2C2C"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* body */}
      <ellipse cx="100" cy="150" rx="46" ry="30" fill="#6B2C2C" opacity="0.9" />

      {/* head */}
      <circle cx="100" cy="92" r="44" fill="#F4A261" />

      {/* ears */}
      <path d="M62 78 C48 70 46 100 62 110 C58 96 58 86 62 78 Z" fill="#6B2C2C" />
      <path d="M138 78 C152 70 154 100 138 110 C142 96 142 86 138 78 Z" fill="#6B2C2C" />

      {/* snout */}
      <ellipse cx="100" cy="106" rx="22" ry="16" fill="#FCEAE0" />

      {mood === 'calm' ? (
        <>
          <path d="M84 88 q4 -4 8 0" stroke="#2B211E" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M108 88 q4 -4 8 0" stroke="#2B211E" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="86" cy="88" r="4.5" fill="#2B211E" />
          <circle cx="114" cy="88" r="4.5" fill="#2B211E" />
        </>
      )}

      {/* nose + mouth */}
      <ellipse cx="100" cy="104" rx="7" ry="5" fill="#2B211E" />
      <path d="M100 109 q-10 10 -20 2" stroke="#2B211E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M100 109 q10 10 20 2" stroke="#2B211E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {mood === 'happy' && (
        <path
          d="M96 118 q6 10 0 18"
          stroke="#E76F51"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* paws */}
      <ellipse cx="78" cy="178" rx="11" ry="7" fill="#6B2C2C" />
      <ellipse cx="122" cy="178" rx="11" ry="7" fill="#6B2C2C" />
    </svg>
  );
}