import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import LegalDocument from '../components/LegalDocument';
import LegalToc from '../components/LegalToc';
import { termsContent, privacyContent } from '../data/mockLegalContent';
import { cancellationContent } from '../data/cancellationContent';
import { fetchPlatformContent } from '../utils/platformContent';
import { parseLegalBody } from '../utils/legalContent';
import { formatDateId } from '../utils/status';
import { useLanguage } from '../i18n/LanguageContext';

const CONTENT_KEYS = { terms: 'syarat_ketentuan', privacy: 'kebijakan_privasi', cancellation: 'kebijakan_pembatalan' };

// The three legal documents share one redesigned page — the switcher lets
// visitors jump between them without going back to the footer.
const DOCS = [
  { type: 'terms', to: '/syarat-ketentuan', labelKey: 'termsLabel' },
  { type: 'privacy', to: '/kebijakan-privasi', labelKey: 'privacyLabel' },
  { type: 'cancellation', to: '/kebijakan-pembatalan', labelKey: 'cancellationLabel' },
];

export default function LegalPage({ type }) {
  const { t } = useLanguage();
  const [cms, setCms] = useState(null); // { type, data } — data of the currently shown document
  const [activeId, setActiveId] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    fetchPlatformContent(CONTENT_KEYS[type]).then((data) => {
      if (active) setCms({ type, data });
    });
    return () => {
      active = false;
    };
  }, [type]);

  const pages = {
    terms: { content: termsContent },
    privacy: { content: privacyContent },
    cancellation: { content: cancellationContent },
  };
  const fallbackContent = pages[type].content;

  // An admin-edited row (see supabase/platform_content_migration.sql)
  // wins over the bundled template. Its body is plain text parsed into
  // sections via parseLegalBody ("## " / "- " / "1." markers). Results are
  // keyed by type so a slower response for a previous document never
  // overwrites the one currently on screen.
  const content = useMemo(() => {
    if (!cms || cms.type !== type || !cms.data) return fallbackContent;
    return {
      ...fallbackContent,
      title: cms.data.title,
      updatedAt: formatDateId(cms.data.updatedAt),
      sections: parseLegalBody(cms.data.body),
    };
  }, [cms, type, fallbackContent]);

  // Scroll-driven reading progress + scrollspy. 120px matches the sticky
  // navbar height (h-16) plus a little breathing room.
  useEffect(() => {
    const ids = content.sections.map((s) => s.id).filter(Boolean);
    if (ids.length === 0) return undefined;

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);

      let current = '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 140) current = id;
        else break;
      }
      if (!current) current = ids[0];
      setActiveId((prev) => (prev === current ? prev : current));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [content]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const otherDocs = DOCS.filter((doc) => doc.type !== type);

  return (
    <>
      <Navbar activeLink="" />

      {/* Reading progress — a thin bar pinned over the navbar. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-1 bg-transparent">
        <div
          className="h-full bg-brand-burgundy transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main>
        {/* Header + doc switcher */}
        <section className="border-b border-gray-100 bg-brand-peach/50">
          <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-burgundy">
              {t('legal.eyebrow')}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-text-primary md:text-4xl">
              {content.title}
            </h1>
            <p className="mt-3 text-sm text-text-secondary">
              {t('legal.lastUpdated').replace('{value}', content.updatedAt)}
            </p>

            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={t('legal.docSwitcherLabel')}>
              {DOCS.map((doc) => {
                const isCurrent = doc.type === type;
                const className = `rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  isCurrent
                    ? 'border-brand-burgundy bg-brand-burgundy text-white'
                    : 'border-brand-burgundy/25 bg-white text-brand-burgundy hover:border-brand-burgundy/60 hover:bg-brand-burgundy/5'
                }`;
                return isCurrent ? (
                  <span key={doc.type} aria-current="page" className={className}>
                    {t(`legal.${doc.labelKey}`)}
                  </span>
                ) : (
                  <Link key={doc.type} to={doc.to} className={className}>
                    {t(`legal.${doc.labelKey}`)}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1100px] px-4 py-10 md:px-6 md:py-14">
          <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-10">
            <LegalToc sections={content.sections} activeId={activeId} onNavigate={scrollToSection} />

            <div className="min-w-0">
              <LegalDocument content={content} />

              <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-text-secondary">
                  {t('legal.seeAlso')}
                </h2>
                <ul className="mt-3 space-y-2">
                  {otherDocs.map((doc) => (
                    <li key={doc.type}>
                      <Link
                        to={doc.to}
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand-burgundy transition-colors hover:text-brand-burgundy/70"
                      >
                        <span aria-hidden="true" className="text-brand-burgundy/60">→</span>
                        {t(`legal.${doc.labelKey}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-text-secondary">
                  {t('legal.orBackTo')}{' '}
                  <Link to="/bantuan" className="font-medium text-brand-burgundy transition-colors hover:underline">
                    {t('legal.helpCenter')}
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}