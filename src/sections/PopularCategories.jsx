import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';
import { usePublicProducts } from '../hooks/usePublicProducts';
import { usePublicServices } from '../hooks/usePublicServices';
import { useLanguage } from '../i18n/LanguageContext';

export default function PopularCategories() {
  const [activeTab, setActiveTab] = useState('produk');
  const { t } = useLanguage();
  const { products } = usePublicProducts();
  const { services } = usePublicServices();

  return (
    <section className="mx-auto max-w-container px-4 py-16 md:px-6 md:py-20 lg:px-8 lg:py-24">
      <SectionHeader
        title={t('popularCategories.title')}
        subtitle={t('popularCategories.subtitle')}
      >
        <div className="mt-4 flex items-center gap-4 sm:mt-0">
          <div className="flex rounded-full bg-gray-100 p-1">
            {['produk', 'jasa'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all duration-200 ${
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
            className="hidden items-center gap-1 text-sm font-medium text-brand-burgundy transition-colors duration-200 hover:underline sm:flex"
          >
            {t('popularCategories.lihatSemua')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </SectionHeader>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {activeTab === 'produk'
          ? products.slice(0, 4).map((item) => <ProductCard key={item.id} {...item} />)
          : services.slice(0, 4).map((item) => <ServiceCard key={item.id} {...item} />)}
      </div>
    </section>
  );
}
