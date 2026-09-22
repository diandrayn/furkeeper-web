export default function PaymentResultLayout({
  icon,
  iconColor,
  title,
  description,
  children,
  illustration, // optional: pass a decorative illustration node to replace the plain icon circle.
  // Only used for celebratory, one-time moments (e.g. Payment Success) —
  // Failed/Pending states keep the plain icon per Section 4 (trustworthy,
  // undecorated payment flow).
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        {illustration ? (
          <div className="mx-auto mb-5 flex justify-center">{illustration}</div>
        ) : (
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cream ${iconColor}`}>
            {icon}
          </div>
        )}
        <h1 className="font-heading text-2xl font-bold text-text-primary">{title}</h1>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{description}</p>
        )}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}