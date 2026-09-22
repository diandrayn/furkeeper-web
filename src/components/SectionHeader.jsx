export default function SectionHeader({
  title,
  subtitle,
  align = 'left',
  className = '',
  children,
  // Use theme="dark" when the section sits on a blue/navy background
  // (e.g. TrustSection, Testimonials) so the heading turns white instead
  // of blue — keeps text readable on a blue background.
  theme = 'light',
}) {
  const alignClass =
    align === 'center' ? 'text-center items-center' : 'text-left items-start';
  const titleColor = theme === 'dark' ? 'text-white' : 'text-brand-burgundy';
  const subtitleColor = theme === 'dark' ? 'text-white/70' : 'text-text-secondary';

  return (
    <div
      className={`flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className={`flex flex-col gap-1 ${alignClass}`}>
        <h2 className={`font-heading text-2xl font-bold ${titleColor} md:text-3xl`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-sm ${subtitleColor} md:text-base`}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
