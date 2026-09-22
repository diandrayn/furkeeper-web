export default function Checkbox({ label, checked, onChange, required, id, className = '' }) {
  const checkboxId = id || 'checkbox';

  return (
    <label
      htmlFor={checkboxId}
      className={`flex cursor-pointer items-start gap-2.5 ${className}`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        required={required}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-burgundy focus:ring-brand-orange-end/30"
      />
      <span className="text-sm text-text-secondary">{label}</span>
    </label>
  );
}
