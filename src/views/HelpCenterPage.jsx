import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { Search, FileText, Shield, MessageCircle, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import SearchBar from '../components/SearchBar';
import AccordionItem from '../components/AccordionItem';
import DogIllustration from '../components/decorative/DogIllustration';
import CatIllustration from '../components/decorative/CatIllustration';
import PawPrintPattern from '../components/decorative/PawPrintPattern';
import faqIllustrationImg from '../assets/faq-illustration.png';
const faqIllustration = faqIllustrationImg.src;
import { FAQ_CATEGORIES, mockFaqs } from '../data/mockFaqs';
import { fetchPublishedFaqs } from '../utils/platformContent';
import { useLanguage } from '../i18n/LanguageContext';

// "Discover our products"-style colorful link cards — same treatment for
// the legal shortcuts as the reference screenshot's product tiles.
export default function HelpCenterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const discoverCards = [
    {
      id: 'syarat',
      title: t('helpCenter.termsTitle'),
      description: t('helpCenter.termsDesc'),
      icon: FileText,
      bg: 'bg-brand-peach',
      to: '/syarat-ketentuan',
    },
    {
      id: 'privasi',
      title: t('helpCenter.privacyTitle'),
      description: t('helpCenter.privacyDesc'),
      icon: Shield,
      bg: 'bg-[#CDEAFB]',
      to: '/kebijakan-privasi',
    },
  ];
  const [query, setQuery] = useState('');
  // FAQ dari admin (Kelola FAQ) dipakai kalau ada yang terbit; kalau kosong/gagal dimuat, tetap daftar bawaan.
  const [faqs, setFaqs] = useState(mockFaqs);
  const [categories, setCategories] = useState(FAQ_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(FAQ_CATEGORIES[0].id);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let active = true;
    fetchPublishedFaqs().then((rows) => {
      if (!active || rows.length === 0) return;
      // Kategori di admin berupa teks bebas, jadi tab dibentuk dari data itu sendiri.
      const normalized = rows.map((row) => ({ ...row, category: (row.category || 'Umum').trim() }));
      const tabs = [];
      normalized.forEach((row) => {
        if (!tabs.some((tab) => tab.id === row.category)) tabs.push({ id: row.category, label: row.category });
      });
      setFaqs(normalized);
      setCategories(tabs);
      setActiveCategory(tabs[0].id);
    });
    return () => {
      active = false;
    };
  }, []);

  const getCategoryLabel = (id) => categories.find((c) => c.id === id)?.label ?? id;

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const filteredFaqs = useMemo(() => {
    if (!isSearching) return [];
    const lower = trimmedQuery.toLowerCase();
    return faqs.filter((faq) => faq.question.toLowerCase().includes(lower));
  }, [isSearching, trimmedQuery, faqs]);

  const categoryFaqs = useMemo(
    () => faqs.filter((faq) => faq.category === activeCategory),
    [activeCategory, faqs],
  );

  const handleToggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleCategoryChange = (id) => {
    setActiveCategory(id);
    setOpenId(null);
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setOpenId(null);
  };

  const listToShow = isSearching ? filteredFaqs : categoryFaqs;

  return (
    <>
      <Navbar activeLink="Bantuan" />
      <main>
        {/* Search band */}
        <section className="relative overflow-hidden bg-brand-peach">
          <PawPrintPattern className="text-brand-burgundy" opacity={0.08} />
          <div className="relative mx-auto max-w-container px-4 py-10 md:px-6 md:py-14 lg:px-8">
            <h1 className="font-hero text-3xl text-brand-burgundy md:text-4xl">
              {t('helpCenter.title')}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-text-secondary md:text-base">
              {t('helpCenter.subtitle')}
            </p>
            <SearchBar
              className="mt-6 max-w-2xl"
              placeholder={t('helpCenter.searchPlaceholder')}
              icon={<Search className="h-5 w-5" aria-hidden="true" />}
              value={query}
              onChange={handleQueryChange}
              aria-label={t('helpCenter.searchAria')}
            />
          </div>
        </section>

        {/* FAQ — reference-style: illustration + intro on the left,
            categorized list on the right. */}
        <section className="mx-auto max-w-container px-4 py-12 md:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-10">
            {/* Left: illustration + intro copy */}
            <div className="flex flex-col items-center rounded-3xl bg-brand-burgundy/5 p-6 text-center lg:items-start lg:p-8 lg:text-left">
              <h2 className="font-hero text-2xl text-brand-burgundy">
                {t('helpCenter.faqTitle')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t('helpCenter.faqIntro')}
              </p>
              <div className="mt-6">
              <img
              src={faqIllustration}
              alt="Ilustrasi FurKeeper"
              className="h-32 w-auto object-contain sm:h-40"
              />
            </div>
          </div>

            {/* Right: category tabs + accordion list */}
            <div>
              {!isSearching && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {categories.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleCategoryChange(tab.id)}
                      className={`playful-interactive rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-4 sm:text-sm ${
                        activeCategory === tab.id
                          ? 'bg-brand-burgundy text-white shadow-sm'
                          : 'bg-white text-text-secondary hover:text-brand-burgundy'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {isSearching && (
                <p className="mb-3 text-xs text-text-secondary">
                  {t('helpCenter.searchResultsFor')} &lsquo;{trimmedQuery}&rsquo;
                </p>
              )}

              {listToShow.length > 0 ? (
                <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
                  {listToShow.map((faq) => (
                    <div
                      key={faq.id}
                      className={`px-5 transition-colors duration-200 sm:px-7 ${
                        openId === faq.id ? 'bg-brand-peach/40' : ''
                      }`}
                    >
                      {isSearching && (
                        <span className="mt-4 inline-block rounded-full bg-brand-peach px-2.5 py-0.5 text-xs font-medium text-brand-burgundy">
                          {getCategoryLabel(faq.category)}
                        </span>
                      )}
                      <AccordionItem
                        question={faq.question}
                        answer={faq.answer}
                        isOpen={openId === faq.id}
                        onToggle={() => handleToggle(faq.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl bg-white px-6 py-12 text-center shadow-sm">
                  <p className="text-sm text-text-secondary md:text-base">
                    {t('helpCenter.noResultsFor')} &lsquo;{trimmedQuery}&rsquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Discover-products style shortcut cards */}
        <section className="mx-auto max-w-container px-4 pb-8 md:px-6 lg:px-8">
          <h2 className="mb-4 font-heading text-xl font-bold text-text-primary">
            {t('helpCenter.infoLainnya')}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {discoverCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => navigate(card.to)}
                  className={`playful-interactive group relative overflow-hidden rounded-2xl ${card.bg} p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
                >
                  <PawPrintPattern className="text-brand-burgundy" opacity={0.1} density="sparse" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-brand-burgundy">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="relative mt-4 font-heading text-lg font-bold text-brand-burgundy">
                    {card.title}
                  </h3>
                  <p className="relative mt-1 text-sm text-text-secondary">{card.description}</p>
                  <span className="relative mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-burgundy">
                    {t('helpCenter.viewDetail')}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Closing CTA — also discover-card styled, redirects to Get In Touch */}
        <section className="mx-auto max-w-container px-4 pb-12 md:px-6 lg:px-8 lg:pb-16">
          <button
            type="button"
            onClick={() => navigate('/kontak')}
            className="playful-interactive group relative flex w-full flex-col items-start gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-orange-start to-brand-orange-end p-6 text-left text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
          >
            <PawPrintPattern className="text-white" opacity={0.15} />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                <MessageCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-white md:text-xl">
                  {t('helpCenter.ctaTitle')}
                </h2>
                <p className="mt-1 text-sm text-white/90">
                  {t('helpCenter.ctaSubtitle')}
                </p>
              </div>
            </div>
            <span className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-orange-end shadow-sm">
              {t('helpCenter.ctaButton')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </section>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
