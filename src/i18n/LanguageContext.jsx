import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'fk_lang';

function getInitialLang() {
  if (typeof window === 'undefined') return 'id';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'id' || saved === 'en') return saved;
  } catch {
    // localStorage unavailable — fall back to default
  }
  return 'id';
}

// Simple "a.b.c" path lookup against the active dictionary, falling back to
// Indonesian (the site's default) and finally to the key itself so missing
// translations never render as blank text.
function resolve(dict, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore write errors (private browsing, etc.)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = (next) => setLangState(next === 'en' ? 'en' : 'id');
  const toggleLang = () => setLangState((prev) => (prev === 'id' ? 'en' : 'id'));

  const t = useMemo(() => {
    return (path) => {
      const value = resolve(translations[lang], path);
      if (value !== undefined) return value;
      const fallback = resolve(translations.id, path);
      return fallback !== undefined ? fallback : path;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside a <LanguageProvider>');
  }
  return ctx;
}
