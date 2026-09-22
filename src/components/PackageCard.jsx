import Button from './Button';
import { formatPrice } from '../utils/validation';

export default function PackageCard({ name, description, durationEstimate, price, onSelect }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="font-heading text-base font-bold text-text-primary">{name}</h3>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
        <p className="mt-2 text-xs text-text-secondary">Estimasi {durationEstimate}</p>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-heading text-lg font-bold text-brand-burgundy">{formatPrice(price)}</p>
        <Button variant="outline" size="sm" onClick={onSelect}>
          Pilih
        </Button>
      </div>
    </div>
  );
}
