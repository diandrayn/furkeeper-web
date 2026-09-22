export default function WaveDivider({
  topColor = 'text-brand-cream',
  bottomColor = 'bg-brand-cream',
  flip = false,
  className = '',
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative h-8 w-full overflow-hidden sm:h-12 lg:h-16 ${bottomColor} ${className}`}
    >
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className={`h-full w-full ${topColor} ${flip ? 'rotate-180' : ''}`}
      >
        <path
          fill="currentColor"
          d="M0,0 H1440 V50 C1200,90 960,20 720,60 C480,100 240,20 0,55 Z"
        />
      </svg>
    </div>
  );
}
