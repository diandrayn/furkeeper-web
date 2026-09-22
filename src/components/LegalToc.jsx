import { useState } from 'react';
import { List, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Sticky table of contents for the legal pages.
 * - Highlight follows scrolling (scrollspy) via IntersectionObserver.
 * - On mobile it's a collapsible panel; choosing an item closes it.
 */
export default function LegalToc({ sections, activeId, onNavigate }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleClick = (event, id) => {
    event.preventDefault();
    setOpen(false);
    onNavigate(id);
  };

  const content = (
    <nav aria-label={t('legal.tocTitle')}>
      <ul className="space-y-1">
        {sections.map((section, index) => {
          const isActive = section.id === activeId;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(e) => handleClick(e, section.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`group flex items-baseline gap-2.5 rounded-lg px-3 py-2 text-left text-sm leading-snug transition-colors duration-150 ${
                  isActive
                    ? 'bg-brand-burgundy font-semibold text-white'
                    : 'text-text-secondary hover:bg-brand-burgundy/5 hover:text-brand-burgundy'
                }`}
              >
                <span
                  className={`text-xs font-bold tabular-nums ${
                    isActive ? 'text-white/70' : 'text-text-secondary group-hover:text-brand-burgundy/60'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                {stripTitle(section.title)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <aside className="mb-8 lg:mb-0">
      {/* Mobile: collapsed panel */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-brand-burgundy shadow-sm"
        >
          <span className="flex items-center gap-2">
            <List className="h-4 w-4" aria-hidden="true" />
            {t('legal.tocTitle')}
          </span>
          <span className="rounded-full bg-brand-burgundy/10 px-2.5 py-0.5 text-xs font-bold text-brand-burgundy">
            {sections.length}
          </span>
        </button>
        {open && (
          <div className="relative mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('common.close') || 'Tutup'}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
            </button>
            {content}
          </div>
        )}
      </div>

      {/* Desktop: sticky column */}
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-text-secondary">
            <List className="h-4 w-4" aria-hidden="true" />
            {t('legal.tocTitle')}
          </h2>
          {content}
        </div>
      </div>
    </aside>
  );
}

function stripTitle(title) {
  return String(title || '').replace(/^\d+\s*[.)]?\s*/, '').trim() || 'Konten';
}