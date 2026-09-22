export default function Textarea({
  label,
  value,
  onChange,
  onBlur,
  error,
  maxLength,
  showCharCount = false,
  name,
  required,
  rows = 4,
  placeholder,
  className = '',
}) {
  const textareaId = name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-status-danger"> *</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        className={`w-full resize-none rounded-xl border bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-orange-end/30 ${
          error
            ? 'border-status-danger focus:border-status-danger'
            : 'border-gray-200 focus:border-brand-orange-end'
        }`}
      />
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-xs text-status-danger" role="alert">
            {error}
          </p>
        ) : (
          <span />
        )}
        {showCharCount && maxLength && (
          <p className="text-xs text-text-secondary">
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
