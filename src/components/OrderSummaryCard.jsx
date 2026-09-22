import Button from './Button';
import { formatPrice } from '../utils/validation';

export default function OrderSummaryCard({
  rows = [],
  totalLabel,
  total,
  actionLabel,
  onAction,
  actionDisabled = false,
  helperText,
  className = '',
}) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm ${className}`}>
      <h2 className="font-heading text-lg font-bold text-text-primary">Ringkasan</h2>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
            <span className={row.muted ? 'text-xs text-text-secondary' : 'text-text-secondary'}>
              {row.label}
            </span>
            {row.hideValue ? null : (
              <span className="font-medium text-text-primary">{row.value}</span>
            )}
          </div>
        ))}
      </div>
      <div className="my-4 border-t border-gray-100" />
      <div className="flex items-center justify-between gap-3">
        <span className="font-heading text-sm font-bold text-text-primary">{totalLabel}</span>
        <span className="font-heading text-xl font-bold text-brand-burgundy">
          {formatPrice(total)}
        </span>
      </div>
      <Button
        variant="primary"
        fullWidth
        className="mt-5"
        disabled={actionDisabled}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
      {actionDisabled && helperText ? (
        <p className="mt-2 text-center text-xs text-text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
}
