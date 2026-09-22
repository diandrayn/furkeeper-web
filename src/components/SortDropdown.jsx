import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const PRODUCT_SORT_OPTIONS = [
  { value: 'newest', labelKey: 'sort.newest' },
  { value: 'cheapest', labelKey: 'sort.cheapest' },
  { value: 'expensive', labelKey: 'sort.expensive' },
  { value: 'rating', labelKey: 'sort.rating' },
];

export default function SortDropdown({
  options = PRODUCT_SORT_OPTIONS,
  value,
  onChange,
  className = '',
}) {
  const { t } = useLanguage();
  const resolvedOptions = options.map((option) => ({
    ...option,
    label: option.labelKey ? t(option.labelKey) : option.label,
  }));

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={t('sort.aria')}
        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm text-text-primary outline-none transition-all duration-200 focus:border-brand-orange-end focus:ring-2 focus:ring-brand-orange-end/30"
      >
        {resolvedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
    </div>
  );
}
