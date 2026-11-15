import { useLocation } from '@/lib/router';
import Navbar from '../components/Navbar';
import PendingApplicationBanner from '../components/PendingApplicationBanner';
import Footer from '../components/Footer';
import Hero from '../sections/Hero';
import PetTypeSelector from '../sections/PetTypeSelector';
import PromoBanner from '../sections/PromoBanner';
import PopularCategories from '../sections/PopularCategories';
import NearbySearch from '../sections/NearbySearch';
import Testimonials from '../sections/Testimonials';
import TrustSection from '../sections/TrustSection';
import PartnerCTA from '../sections/PartnerCTA';
import { useLanguage } from '../i18n/LanguageContext';

export default function Home() {
  const location = useLocation();
  const { t } = useLanguage();
  const partnerStatusMissing = location.state?.partnerStatusMissing;

  return (
    <>
      <Navbar activeLink="Beranda" />
      <PendingApplicationBanner />
      {partnerStatusMissing && (
        <div className="border-b border-status-danger/40 bg-status-danger/10">
          <div className="mx-auto max-w-container px-4 py-2.5 text-sm text-status-danger md:px-6 lg:px-8">
            {t('applicationStatus.partnerStatusMissing')}
          </div>
        </div>
      )}
      <main className="mx-auto flex max-w-container flex-col gap-14 px-4 py-8 md:gap-20 md:px-6 md:py-12 lg:gap-24 lg:px-8">
        <Hero />
        <TrustSection />
        <PetTypeSelector />
        <PromoBanner />
        <PopularCategories />
        <NearbySearch />
        <Testimonials />
        <PartnerCTA />
      </main>
      <Footer />
    </>
  );
}
