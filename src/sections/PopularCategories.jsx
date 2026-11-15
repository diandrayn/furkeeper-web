import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/lib/router';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';
import { usePublicProducts } from '../hooks/usePublicProducts';
import { usePublicServices } from '../hooks/usePublicServices';
import { useLanguage } from '../i18n/LanguageContext';

const SHOWCASE_TONES = ['peach', 'pink', 'mist', 'cream'];

export default function PopularCategories() {
  const [activeTab, setActiveTab] = useState('produk');
  const [progress, setProgress] = useState(0);
  const trackRef = useRef(null);
  const { t } = useLanguage();
  const { products } = usePublicProducts();
  const { services } = usePublicServices();

  const items = activeTab === 'produk' ? products.slice(0, 4) : services.slice(0, 4);

  const updateProgress = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max <= 0 ? 1 : el.scrollLeft / max);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    updateProgress();
    el.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      el.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [items, updateProgress]);

  const scrollByCard = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollByCard(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollByCard(1);
    }
  };

  return (
    <section className="rounded-[2rem] bg-white/40 px-4 py-10 sm:px-6 md:px-8 md:py-12">
      <SectionHeader
        title={t('popularCategories.title')}
        subtitle={t('popularCategories.subtitle')}
        display
        sparkle
      >
        <div className="mt-4 flex items-center gap-3 sm:mt-0">
          <div className="flex rounded-full bg-gray-100 p-1">
            {['produk', 'jasa'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-burgundy/40 ${
                  activeTab === tab
                    ? 'bg-brand-burgundy text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab === 'produk' ? t('popularCategories.tabProduk') : t('popularCategories.tabJasa')}
              </button>
            ))}
          </div>
          <Link
            to={activeTab === 'produk' ? '/produk' : '/jasa'}
            className="hidden items-center gap-1 text-sm font-medium text-brand-burgundy transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-burgundy/40 sm:flex"
          >
            {t('popularCategories.lihatSemua')}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label={t('popularCategories.prev')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-burgundy shadow-sm ring-1 ring-black/5 hover:bg-brand-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-burgundy/40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label={t('popularCategories.next')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-burgundy shadow-sm ring-1 ring-black/5 hover:bg-brand-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-burgundy/40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SectionHeader>

      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-burgundy/40"
      >
        {activeTab === 'produk'
          ? items.map((item, index) => (
              <div
                key={item.id}
                className="w-[min(16.5rem,80vw)] shrink-0 snap-start"
              >
                <ProductCard
                  {...item}
                  variant="showcase"
                  tone={SHOWCASE_TONES[index % SHOWCASE_TONES.length]}
                />
              </div>
            ))
          : items.map((item, index) => (
              <div
                key={item.id}
                className="w-[min(16.5rem,80vw)] shrink-0 snap-start"
              >
                <ServiceCard
                  {...item}
                  variant="showcase"
                  tone={SHOWCASE_TONES[index % SHOWCASE_TONES.length]}
                />
              </div>
            ))}
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-brand-mist/50" aria-hidden="true">
        <div
          className="h-full rounded-full bg-brand-burgundy transition-[width] duration-200"
          style={{ width: `${Math.max(progress, 0.08) * 100}%` }}
        />
      </div>
    </section>
  );
}
