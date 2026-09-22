import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({
  min = 1,
  max = 99,
  value,
  onChange,
  label = 'Jumlah',
  hideLabel = false,
}) {
  return (
    <div>
      {!hideLabel && label && (
        <p className="mb-2 text-sm font-medium text-text-primary">{label}</p>
      )}
      <div className="inline-flex items-center rounded-full border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-10 w-10 items-center justify-center text-text-secondary transition-colors duration-200 hover:text-brand-burgundy disabled:opacity-40"
          aria-label="Kurangi jumlah"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-8 text-center text-sm font-semibold text-text-primary">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-10 w-10 items-center justify-center text-text-secondary transition-colors duration-200 hover:text-brand-burgundy disabled:opacity-40"
          aria-label="Tambah jumlah"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
