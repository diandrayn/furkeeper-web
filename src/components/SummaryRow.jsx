export default function SummaryRow({ label, value, className = '' }) {
  if (!value) return null;

  return (
    <div className={`flex justify-between gap-4 py-1.5 text-sm ${className}`}>
      <span className="shrink-0 text-text-secondary">{label}</span>
      <span className="text-right font-medium text-text-primary">{value}</span>
    </div>
  );
}
