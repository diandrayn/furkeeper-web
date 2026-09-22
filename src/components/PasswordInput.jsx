import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { getPasswordStrength } from '../utils/validation';

function StrengthMeter({ password }) {
  const strength = getPasswordStrength(password);
  const colors = ['bg-gray-200', 'bg-status-danger', 'bg-status-warning', 'bg-status-success'];
  const labels = ['', 'Lemah', 'Sedang', 'Kuat'];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((segment) => (
          <div
            key={segment}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              strength >= segment ? colors[strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {password && (
        <p className="text-xs text-text-secondary">{labels[strength] || ''}</p>
      )}
    </div>
  );
}

export default function PasswordInput({
  label,
  error,
  value,
  onChange,
  onBlur,
  showStrengthMeter = false,
  name,
  required,
  placeholder = '••••••••',
  className = '',
}) {
  const [visible, setVisible] = useState(false);
  const inputId = name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-status-danger"> *</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-orange-end/30 ${
            error
              ? 'border-status-danger focus:border-status-danger'
              : 'border-gray-200 focus:border-brand-orange-end'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 hover:text-text-secondary"
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrengthMeter && <StrengthMeter password={value} />}
      {error && (
        <p className="text-xs text-status-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
