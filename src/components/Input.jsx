export default function Input({
  label,
  type = 'text',
  error,
  value,
  onChange,
  onBlur,
  placeholder,
  name,
  id,
  required,
  icon,
  className = '',
  ...props
}) {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-status-danger"> *</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-xl border bg-white py-2.5 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-orange-end/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-text-secondary ${
            icon ? 'pl-10 pr-4' : 'px-4'
          } ${
            error
              ? 'border-status-danger focus:border-status-danger'
              : 'border-gray-200 focus:border-brand-orange-end'
          }`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-status-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
