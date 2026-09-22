export default function StatCard({ icon: Icon, label, value, hint, tone = 'burgundy' }) {
  const toneStyles = {
    burgundy: 'bg-brand-burgundy/10 text-brand-burgundy',
    orange: 'bg-brand-orange-end/15 text-brand-orange-end',
    success: 'bg-status-success/15 text-status-success',
    warning: 'bg-status-warning/20 text-[#8a6d1f]',
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-secondary">{label}</p>
          <p className="mt-1.5 font-heading text-2xl font-bold text-text-primary">{value}</p>
          {hint && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
        </div>
        {Icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone] || toneStyles.burgundy}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
}
