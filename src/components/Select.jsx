export default function Select({
  label,
  options = [],
  value,
  onChange,
  onBlur,
  error,
  name,
  required,
  placeholder = 'Pilih...',
  className = '',
}) {
  const selectId = name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-status-danger"> *</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        className={`w-full appearance-none rounded-xl border bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition-all duration-200 focus:ring-2 focus:ring-brand-orange-end/30 ${
          error
            ? 'border-status-danger focus:border-status-danger'
            : 'border-gray-200 focus:border-brand-orange-end'
        } ${!value ? 'text-gray-400' : ''}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error && (
        <p className="text-xs text-status-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
