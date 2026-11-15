import { Sparkles } from 'lucide-react';

export default function SectionHeader({
  title,
  subtitle,
  align = 'left',
  className = '',
  children,
  // Use theme="dark" when the section sits on a blue/navy background
  // (e.g. Testimonials) so the heading turns white instead of blue.
  theme = 'light',
  display = false,
  sparkle = false,
}) {
  const alignClass =
    align === 'center' ? 'text-center items-center' : 'text-left items-start';
  const titleColor = theme === 'dark' ? 'text-white' : 'text-brand-burgundy';
  const subtitleColor = theme === 'dark' ? 'text-white/70' : 'text-text-secondary';
  const titleClass = display
    ? `font-hero text-3xl leading-tight md:text-4xl ${titleColor}`
    : `font-heading text-2xl font-bold ${titleColor} md:text-3xl`;

  return (
    <div
      className={`flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className={`flex flex-col gap-1 ${alignClass}`}>
        <div
          className={`flex items-center gap-2 ${align === 'center' ? 'justify-center' : ''}`}
        >
          {sparkle && (
            <Sparkles className={`h-5 w-5 shrink-0 ${titleColor}`} aria-hidden="true" />
          )}
          <h2 className={titleClass}>{title}</h2>
        </div>
        {subtitle && (
          <p className={`text-sm ${subtitleColor} md:text-base`}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
