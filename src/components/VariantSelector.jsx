export default function VariantSelector({ options = [], value, onChange, label = 'Varian' }) {
  if (!options.length) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text-primary">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                selected
                  ? 'border-brand-burgundy bg-brand-burgundy text-white'
                  : 'border-gray-200 bg-white text-text-secondary hover:border-brand-burgundy/40'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
