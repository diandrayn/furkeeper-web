const defaultFilters = [
  { value: 'all', label: 'Semua' },
  { value: 5, label: '5 Bintang' },
  { value: 4, label: '4 Bintang' },
  { value: 3, label: '3 Bintang' },
  { value: 2, label: '2 Bintang' },
  { value: 1, label: '1 Bintang' },
];

export default function ReviewFilterBar({ value = 'all', onChange, filters = defaultFilters }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.map((filter) => {
        const selected = String(value) === String(filter.value);
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              selected
                ? 'border-brand-burgundy bg-brand-burgundy text-white'
                : 'border-gray-200 bg-white text-text-secondary hover:border-brand-burgundy/40'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
