/**
 * AuthSilhouettes
 * Flat, single-tone paw/cat/dog silhouettes scattered abstractly behind the
 * centered auth form (Login/Register). Purely decorative (aria-hidden),
 * low-key opacity so they never compete with the form itself.
 *
 * Usage:
 *   <div className="relative overflow-hidden ...">
 *     <AuthSilhouetteField />
 *     <div className="relative z-10">...form card...</div>
 *   </div>
 */

function PawSilhouette({ className = '', style }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
      <ellipse cx="50" cy="66" rx="26" ry="21" fill="currentColor" />
      <ellipse cx="18" cy="42" rx="11" ry="14" fill="currentColor" />
      <ellipse cx="38" cy="24" rx="11" ry="14" fill="currentColor" />
      <ellipse cx="62" cy="24" rx="11" ry="14" fill="currentColor" />
      <ellipse cx="82" cy="42" rx="11" ry="14" fill="currentColor" />
    </svg>
  );
}

function CatSilhouette({ className = '', style }) {
  return (
    <svg viewBox="0 0 120 130" className={className} style={style} aria-hidden="true">
      <path
        d="M40 24 C34 6 20 4 22 20 C23 30 30 36 34 40 Z"
        fill="currentColor"
      />
      <path
        d="M80 24 C86 6 100 4 98 20 C97 30 90 36 86 40 Z"
        fill="currentColor"
      />
      <path
        d="M28 122 C18 100 16 72 34 46 C44 32 76 32 86 46 C104 72 102 100 92 122 C78 130 42 130 28 122 Z"
        fill="currentColor"
      />
      <path
        d="M84 60 C100 54 112 38 108 18 C106 8 96 12 96 24 C96 36 90 46 80 52 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DogSilhouette({ className = '', style }) {
  return (
    <svg viewBox="0 0 160 120" className={className} style={style} aria-hidden="true">
      <path
        d="M46 30 C30 22 16 30 20 46 C24 60 38 66 50 62 C46 52 44 40 46 30 Z"
        fill="currentColor"
      />
      <ellipse cx="66" cy="46" rx="30" ry="28" fill="currentColor" />
      <path
        d="M40 96 C34 76 40 58 62 54 C90 48 118 58 128 78 C134 90 130 100 118 100 C110 100 108 92 104 86 C96 92 78 94 66 90 C58 98 46 100 40 96 Z"
        fill="currentColor"
      />
      <path
        d="M120 62 C136 56 146 66 140 78 C136 86 126 86 120 80 Z"
        fill="currentColor"
      />
      <rect x="52" y="94" width="10" height="18" rx="5" fill="currentColor" />
      <rect x="78" y="96" width="10" height="18" rx="5" fill="currentColor" />
      <rect x="102" y="94" width="10" height="18" rx="5" fill="currentColor" />
    </svg>
  );
}

const DEFAULT_ITEMS = [
  { Shape: PawSilhouette, top: '6%', left: '4%', size: 56, rotate: -18, opacity: 0.16 },
  { Shape: DogSilhouette, top: '12%', left: '82%', size: 120, rotate: 8, opacity: 0.14 },
  { Shape: PawSilhouette, top: '30%', left: '90%', size: 34, rotate: 22, opacity: 0.18 },
  { Shape: CatSilhouette, top: '62%', left: '86%', size: 90, rotate: -10, opacity: 0.15 },
  { Shape: PawSilhouette, top: '80%', left: '8%', size: 44, rotate: 14, opacity: 0.16 },
  { Shape: CatSilhouette, top: '78%', left: '2%', size: 78, rotate: 6, opacity: 0.13 },
  { Shape: PawSilhouette, top: '48%', left: '3%', size: 30, rotate: -26, opacity: 0.15 },
  { Shape: DogSilhouette, top: '88%', left: '58%', size: 70, rotate: -6, opacity: 0.12 },
];

export default function AuthSilhouetteField({ className = '', tone = 'burgundy' }) {
  const colorClass = tone === 'orange' ? 'text-brand-orange-end' : 'text-brand-burgundy';

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {DEFAULT_ITEMS.map(({ Shape, top, left, size, rotate, opacity }, index) => (
        <Shape
          key={index}
          className={`absolute ${colorClass}`}
          style={{
            top,
            left,
            width: size,
            height: size,
            transform: `rotate(${rotate}deg)`,
            opacity,
          }}
        />
      ))}
    </div>
  );
}

export { PawSilhouette, CatSilhouette, DogSilhouette };
