/**
 * PawPrintPattern
 * A low-opacity, scattered paw-print texture meant to sit in the background
 * layer of a hero/banner. It is purely decorative (aria-hidden) and must
 * never sit directly under body text at an opacity that hurts contrast —
 * keep `opacity` at 0.12–0.18 over photos/gradients, and place text in a
 * sibling layer with a higher z-index.
 *
 * Usage:
 *   <div className="relative overflow-hidden ...">
 *     <PawPrintPattern className="text-white" opacity={0.14} />
 *     <div className="relative z-10">...actual hero content...</div>
 *   </div>
 */
export default function PawPrintPattern({
  className = '',
  opacity = 0.14,
  density = 'normal', // 'sparse' | 'normal'
}) {
  const paws =
    density === 'sparse'
      ? [
          { x: 40, y: 30, s: 1, r: -12 },
          { x: 320, y: 80, s: 0.7, r: 20 },
          { x: 620, y: 40, s: 0.9, r: -6 },
          { x: 860, y: 140, s: 0.6, r: 15 },
        ]
      : [
          { x: 20, y: 20, s: 0.8, r: -10 },
          { x: 120, y: 90, s: 0.5, r: 25 },
          { x: 260, y: 30, s: 1, r: -18 },
          { x: 380, y: 120, s: 0.6, r: 8 },
          { x: 480, y: 20, s: 0.7, r: -22 },
          { x: 600, y: 100, s: 0.9, r: 14 },
          { x: 720, y: 40, s: 0.55, r: -8 },
          { x: 820, y: 130, s: 0.75, r: 18 },
          { x: 900, y: 50, s: 0.6, r: -15 },
          { x: 60, y: 150, s: 0.7, r: 30 },
        ];

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
      viewBox="0 0 960 200"
      preserveAspectRatio="xMidYMid slice"
    >
      {paws.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.r}) scale(${p.s})`}>
          <ellipse cx="0" cy="10" rx="9" ry="7" fill="currentColor" />
          <ellipse cx="-9" cy="-4" rx="3.6" ry="4.6" fill="currentColor" />
          <ellipse cx="-3" cy="-9" rx="3.6" ry="4.6" fill="currentColor" />
          <ellipse cx="4" cy="-9" rx="3.6" ry="4.6" fill="currentColor" />
          <ellipse cx="10" cy="-4" rx="3.6" ry="4.6" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}