export default function TimeSlotGrid({ slots = [], value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {slots.map((slot) => {
        const selected = value === slot.time;
        return (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => onChange(slot.time)}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 ${
              selected
                ? 'border-brand-burgundy bg-brand-burgundy text-white'
                : slot.available
                  ? 'border-gray-200 text-text-primary hover:border-brand-burgundy/40'
                  : 'cursor-not-allowed border-gray-100 text-gray-300 line-through'
            }`}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}
