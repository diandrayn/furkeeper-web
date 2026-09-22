import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const OPTIONS = [
  { code: 'id', flag: '🇮🇩', labelKey: 'language.indonesian' },
  { code: 'en', flag: '🇬🇧', labelKey: 'language.english' },
];

// Round flag-emoji button — click it to reveal a small dropdown with
// "Bahasa Indonesia" / "English". Drop this anywhere (Navbar, dashboard
// header, etc.) — it reads/writes the shared language context, so
// switching in one place updates every `t()` call across the app.
export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const active = OPTIONS.find((option) => option.code === lang) || OPTIONS[0];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('language.switchLabel')}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-base transition-colors duration-200 hover:bg-brand-peach"
      >
        <span aria-hidden="true">{active.flag}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-lg"
        >
          {OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              role="menuitemradio"
              aria-checked={lang === option.code}
              onClick={() => {
                setLang(option.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors duration-150 ${
                lang === option.code
                  ? 'font-semibold text-brand-burgundy'
                  : 'text-text-primary hover:bg-brand-peach/40'
              }`}
            >
              <span aria-hidden="true">{option.flag}</span>
              <span className="flex-1">{t(option.labelKey)}</span>
              {lang === option.code && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
