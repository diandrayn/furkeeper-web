import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-brand-burgundy text-white hover:bg-brand-burgundy/90 border border-transparent',
  orange:
    'bg-gradient-to-r from-brand-orange-start to-brand-orange-end text-white hover:opacity-90 border border-transparent',
  outline:
    'bg-transparent text-brand-burgundy border-2 border-brand-burgundy hover:bg-brand-burgundy/5',
  ghost: 'bg-transparent text-text-secondary hover:text-brand-burgundy border border-transparent',
  'outline-white':
    'bg-transparent text-white border-2 border-white hover:bg-white/10',
};

const sizes = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-sm',
};

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  className = '',
  onClick,
  // Adds the subtle hover/click micro-interaction (Section 3). Defaults to
  // on, since it's meant site-wide — but pass `playful={false}` for buttons
  // inside a professional/data-dense context (e.g. Seller/Provider
  // dashboards, per Section 4) where bounce would be distracting on repeat
  // use. Respects prefers-reduced-motion globally (see index.css).
  playful = true,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${sizes[size] || sizes.md} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${playful && !isDisabled ? 'playful-interactive' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}