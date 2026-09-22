const defaultLabels = ['Account', 'Verify Phone', 'Business Info', 'Documents', 'Payout & Terms'];

export default function Stepper({ steps = 2, current = 1, labels }) {
  const stepLabels = labels || defaultLabels.slice(0, steps);

  return (
    <div className="w-full">
      <div className="flex items-center gap-1">
        {Array.from({ length: steps }).map((_, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < current;
          const isActive = stepNum === current;

          return (
            <div
              key={stepNum}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-brand-burgundy'
                  : isActive
                    ? 'bg-brand-orange-end'
                    : 'bg-gray-200'
              }`}
              aria-label={`Step ${stepNum}: ${stepLabels[index] || ''}`}
            />
          );
        })}
      </div>
      {stepLabels.length > 0 && (
        <div className="mt-2 hidden justify-between sm:flex">
          {stepLabels.map((label, index) => (
            <span
              key={label}
              className={`text-xs ${
                index + 1 <= current ? 'font-medium text-text-primary' : 'text-text-secondary'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
