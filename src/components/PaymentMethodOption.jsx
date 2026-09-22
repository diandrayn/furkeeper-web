import { Building2, CreditCard, QrCode } from 'lucide-react';

const icons = {
  qr: QrCode,
  bank: Building2,
  card: CreditCard,
};

export default function PaymentMethodOption({ icon, label, value, selected, onSelect }) {
  const Icon = icons[icon] || CreditCard;

  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200 ${
        selected
          ? 'border-brand-burgundy bg-brand-peach/50'
          : 'border-gray-200 bg-white hover:border-brand-burgundy/30'
      }`}
    >
      <input
        type="radio"
        name="payment-method"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="h-4 w-4 text-brand-burgundy"
      />
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-brand-burgundy">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-sm font-medium text-text-primary">{label}</span>
    </label>
  );
}
