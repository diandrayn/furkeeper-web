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
import WaveDivider from '../components/decorative/WaveDivider';
import { useLanguage } from '../i18n/LanguageContext';

export default function Home() {
  const location = useLocation();
  const { t } = useLanguage();
  // Set by LoginPage when a seller/service account has neither status
  // recorded on its profile row (a legacy/inconsistent account) — see
  // supabase/diagnostic_partner_status.sql. Transient: only present right
  // after that redirect, not persisted across a refresh.
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
      <main>
        {/* Full-bleed color bands, PetHouse-style: Hero (pink) flows into a
            solid navy stat bar via a wave transition — same position as the
            reference's stat bar right under the hero. */}
        <Hero />
        <WaveDivider topColor="text-brand-peach" bottomColor="bg-brand-burgundy" />
        <TrustSection />

        {/* Boxed/card sections — every Home section shares one vertical
            scale (py-16 md:py-20 lg:py-24) so the page breathes evenly;
            content, order, and colors are untouched. */}
        <PetTypeSelector />
        <PromoBanner />
        <PopularCategories />
        <NearbySearch />

        {/* Dark navy band for testimonials (transparent glass cards). */}
        <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
        <Testimonials />

        <PartnerCTA />
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
