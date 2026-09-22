import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import CartItemRow from './CartItemRow';

export default function StoreGroup({
  storeName,
  storeId,
  items,
  onToggleStore,
  onQuantityChange,
  onRemove,
  onCheckToggle,
}) {
  const allChecked = items.length > 0 && items.every((item) => item.checked);
  const someChecked = items.some((item) => item.checked);
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someChecked && !allChecked;
    }
  }, [someChecked, allChecked]);

  return (
    <section className="rounded-2xl bg-white px-4 shadow-sm sm:px-5">
      <div className="flex items-center gap-3 border-b border-gray-100 py-4">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={allChecked}
          onChange={(event) => onToggleStore(storeName, event.target.checked)}
          aria-label={`Pilih semua di ${storeName}`}
          className="h-4 w-4 rounded border-gray-300 text-brand-burgundy focus:ring-brand-orange-end/30"
        />
        <Store className="h-4 w-4 text-brand-burgundy" aria-hidden="true" />
        {storeId ? (
          <Link
            to={`/toko/${storeId}`}
            className="font-heading text-sm font-bold text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
          >
            {storeName}
          </Link>
        ) : (
          <p className="font-heading text-sm font-bold text-text-primary">{storeName}</p>
        )}
        <span className="text-xs text-text-secondary">Pilih Semua</span>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            {...item}
            isChecked={item.checked}
            onQuantityChange={(qty) => onQuantityChange(item.id, qty)}
            onRemove={() => onRemove(item.id)}
            onCheckToggle={() => onCheckToggle(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
