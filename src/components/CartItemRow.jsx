import { Trash2 } from 'lucide-react';
import ImagePlaceholder from './ImagePlaceholder';
import QuantityStepper from './QuantityStepper';
import { formatPrice } from '../utils/validation';

export default function CartItemRow({
  image,
  name,
  variant,
  price,
  quantity,
  stock = 99,
  isChecked,
  onQuantityChange,
  onRemove,
  onCheckToggle,
}) {
  return (
    <div className="flex gap-3 py-4">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onCheckToggle}
        aria-label={`Pilih ${name}`}
        className="mt-4 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-burgundy focus:ring-brand-orange-end/30"
      />
      <ImagePlaceholder
        className="h-20 w-20 shrink-0 rounded-xl"
        alt={image || `Gambar ${name}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium text-text-primary">{name}</p>
            {variant ? (
              <p className="mt-0.5 text-xs text-text-secondary">{variant}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-1.5 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-status-danger"
            aria-label={`Hapus ${name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            hideLabel
            min={1}
            max={stock}
            value={quantity}
            onChange={onQuantityChange}
          />
          <div className="text-right">
            <p className="text-xs text-text-secondary">{formatPrice(price)} / item</p>
            <p className="font-heading text-sm font-bold text-brand-burgundy">
              {formatPrice(price * quantity)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
