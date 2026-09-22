export default function SearchBar({
  placeholder = 'Cari...',
  icon,
  value,
  onChange,
  className = '',
  inputClassName = '',
  name = 'search',
  id,
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`relative w-full ${className}`}>
      {icon && (
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-text-secondary">
          {icon}
        </span>
      )}
      <input
        id={inputId}
        name={name}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-2xl border border-gray-200 bg-white py-3.5 text-sm text-text-primary shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand-orange-end focus:ring-2 focus:ring-brand-orange-end/30 ${
          icon ? 'pl-12 pr-4' : 'px-4'
        } ${inputClassName}`}
        {...props}
      />
    </div>
  );
}
