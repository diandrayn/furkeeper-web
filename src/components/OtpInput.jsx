import { useRef, useEffect } from 'react';

export default function OtpInput({ length = 6, onComplete, value = '', onChange }) {
  const inputsRef = useRef([]);
  // Keeps the latest onComplete without putting it in the effect's deps —
  // the parent recreates that function on every render (it's not wrapped
  // in useCallback), so depending on it directly re-fires the effect on
  // every re-render, not just when the code actually changes.
  const onCompleteRef = useRef(onComplete);
  // Tracks which complete value we already reported, so a re-render with
  // the same 6 digits doesn't re-trigger verification (that's what was
  // spamming /verify and burning through the rate limit on its own).
  const firedForRef = useRef('');

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (value.length !== length) {
      // Code got shortened (edited/cleared) — allow a future full value,
      // even if it happens to be the same 6 digits again, to fire once more.
      firedForRef.current = '';
      return;
    }
    if (firedForRef.current === value) return;
    firedForRef.current = value;
    onCompleteRef.current?.(value);
  }, [value, length]);

  const handleChange = (index, char) => {
    if (!/^\d?$/.test(char)) return;

    const next = digits.slice();
    next[index] = char;
    const joined = next.join('').replace(/\s/g, '');
    onChange?.(joined);

    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange?.(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="h-12 w-10 rounded-xl border border-gray-200 bg-white text-center text-lg font-semibold text-text-primary outline-none transition-all duration-200 focus:border-brand-orange-end focus:ring-2 focus:ring-brand-orange-end/30 sm:h-14 sm:w-12"
          aria-label={`Digit OTP ${index + 1}`}
        />
      ))}
    </div>
  );
}
