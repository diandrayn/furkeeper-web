import { Package, Star, ShieldCheck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import ImagePlaceholder from '../components/ImagePlaceholder';
import SectionHeader from '../components/SectionHeader';
import Button from '../components/Button';
import PawPrintPattern from '../components/decorative/PawPrintPattern';
import aboutLove from '../assets/about-illustration-love.png';
import aboutStory from '../assets/about-illustration-story.png';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../hooks/useAuth';

const whyChooseIcons = {
  package: Package,
  star: Star,
  shield: ShieldCheck,
  heart: Heart,
};

// Alternating peach / blue backgrounds for the "Kenapa Pilih FurKeeper"
// grid — matches whichever `bg` value each item carries in the
// translation dictionary (src/i18n/translations.js → about.whyChoose.items).
const whyChooseBg = {
  peach: 'bg-brand-peach/70',
  blue: 'bg-[#CDEAFB]',
};

// Small trust-avatar cluster, PetHouse/MUUM-style "loved by X happy
// parents" row. Purely decorative initials — swap for real customer
// photos whenever you have them (just replace the divs with <img>s).
function AvatarCluster() {
  const avatars = [
    { initials: 'NP', bg: 'bg-teal-400' },
    { initials: 'RA', bg: 'bg-orange-300' },
    { initials: 'DW', bg: 'bg-yellow-300' },
  ];
  return (
    <div className="flex -space-x-2.5" aria-hidden="true">
      {avatars.map((a) => (
        <div
          key={a.initials}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-burgundy text-[10px] font-bold text-white ${a.bg}`}
        >
          {a.initials}
        </div>
      ))}
    </div>
  );
}

export default function AboutUsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const hero = t('about.hero');
  const whatWeDo = t('about.whatWeDo');
  const story = t('about.story');
  const whyChoose = t('about.whyChoose');

  // Role-aware CTAs (no dead buttons — §11): each section keeps at most two
  // buttons and every one of them resolves to a real place for the current
  // visitor.
  //   - Guest          → "Jelajahi Produk & Jasa" + "Daftar Sekarang"
  //   - Buyer (masuk)  → "Cari Toko Terdekat" + "Mulai Berjualan"
  //   - Penjual/Penyedia → "Ke Dashboard Toko" + "Cari Toko Terdekat"
  const isSeller = user?.sellerStatus === 'active';
  const isProvider = user?.providerStatus === 'active';
  const hasActiveStore = isSeller || isProvider;

  const partnerRole = user?.role === 'service' ? 'service' : user?.role === 'seller' ? 'seller' : null;
  const partnerStatus = partnerRole === 'seller' ? user?.sellerStatus : partnerRole === 'service' ? user?.providerStatus : null;
  const isPartner = Boolean(partnerRole) && partnerStatus !== 'active';

  // Mitra yang belum aktif diarahkan sesuai statusnya, bukan ke formulir
  // daftar akun baru (yang merupakan jalan buntu untuk akun yang sudah ada).
  const partnerStatusCTA =
    partnerStatus === 'rejected'
      ? { label: t('applicationStatus.resubmit'), to: '/pengajuan-ulang' }
      : partnerStatus === 'pending'
        ? { label: t('profile.viewStatus'), to: '/status-pengajuan' }
        : partnerStatus === 'none'
          ? {
              label: t('about.cta.partnerStatus'),
              to: partnerRole === 'service' ? '/dashboard/jasa' : '/dashboard/toko',
            }
          : null;

  const ctaPrimary = hasActiveStore
    ? { label: t('about.cta.goDashboard'), to: isSeller ? '/dashboard/toko' : '/dashboard/jasa' }
    : isPartner && partnerStatusCTA
      ? partnerStatusCTA
      : isLoggedIn
        ? { label: t('about.cta.findStore'), to: '/toko' }
        : { label: t('about.cta.explore'), to: '/produk' };

  const ctaSecondary = hasActiveStore
    ? { label: t('about.cta.findStore'), to: '/toko' }
    : isPartner
      ? { label: t('about.cta.findStore'), to: '/toko' }
      : isLoggedIn
        ? { label: t('about.cta.startSelling'), to: '/register/partner' }
        : { label: t('about.cta.register'), to: '/register' };

  // "Hubungi Kami" → tab Bantuan & Laporan di profil; login dulu jika belum.
  const goHomeContact = () => {
    if (isLoggedIn) {
      navigate('/bantuan-saya?tab=laporan');
    } else {
      navigate('/login', { state: { from: { pathname: '/bantuan-saya', search: '?tab=laporan' } } });
    }
  };

  return (
    <>
      <Navbar activeLink="Tentang Kami" />
      <main>
        {/* Hero — heading + subtitle + trust row + CTAs on the left,
            illustration on the right (swap `aboutLove` for a real team/
            product photo whenever you have one — same spot, same sizing). */}
        <section className="relative overflow-hidden bg-gradient-to-r from-brand-burgundy via-brand-burgundy to-[#2c3f8f]">
          <PawPrintPattern className="text-white" opacity={0.13} />
          <div className="relative mx-auto flex w-full max-w-container flex-col-reverse items-center gap-10 px-4 py-16 md:flex-row md:px-6 md:py-20 lg:px-8 lg:py-24">
            <div className="max-w-xl text-center md:text-left">
              <h1 className="font-hero text-balance text-3xl font-semibold text-white md:text-4xl lg:text-[48px]">
                {hero.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
                {hero.subtitle}
              </p>

              <div className="mt-5 flex items-center justify-center gap-3 md:justify-start">
                <AvatarCluster />
                <span className="text-xs font-medium text-white/80 sm:text-sm">
                  {hero.trustedBy}
                </span>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                <Button variant="orange" onClick={() => navigate(ctaPrimary.to)}>
                  {ctaPrimary.label}
                </Button>
                <Button variant="outline-white" onClick={() => navigate(ctaSecondary.to)}>
                  {ctaSecondary.label}
                </Button>
              </div>
            </div>

            <div className="relative shrink-0">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] bg-white/10" aria-hidden="true" />
              <img
                src={aboutLove}
                alt="Ilustrasi pemilik hewan memeluk kucingnya"
                className="playful-interactive relative h-48 w-40 rounded-[2rem] object-cover ring-4 ring-white/20 sm:h-56 sm:w-48 md:h-64 md:w-52"
              />
            </div>
          </div>
        </section>

        {/* Apa yang bisa kamu lakukan di sini — answers "what does this
            site actually do" in three quick, scannable bullets. */}
        <section className="mx-auto max-w-container px-4 py-12 md:px-6 lg:px-8 lg:py-16">
          <SectionHeader title={whatWeDo.heading} align="center" className="mb-10 !flex-col !items-center" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {whatWeDo.items.map((item, index) => (
              <div
                key={item.title}
                className="playful-interactive rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-burgundy/10 text-lg font-bold text-brand-burgundy">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cerita Kami — text + CTA on the left, story illustration on the
            right. Swap `aboutStory` for a real photo of the team/founders
            whenever you have one; keep it in a tall-ish frame like this
            one so it balances against the text column. */}
        <section className="bg-brand-cream/60 py-12 lg:py-16">
          <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-10 px-4 md:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
            <div>
              <SectionHeader title={story.heading} />
              {story.paragraphs.map((p) => (
                <p key={p} className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
                  {p}
                </p>
              ))}
              <Button variant="outline" className="mt-6" onClick={goHomeContact}>
                {t('about.cta.contact')}
              </Button>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute inset-0 -translate-x-3 translate-y-3 rounded-[2.5rem] bg-brand-peach/50" aria-hidden="true" />
              <img
                src={aboutStory}
                alt="Ilustrasi pemilik hewan menghabiskan waktu bersama anjing dan kucingnya"
                className="playful-interactive relative aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-md"
              />
            </div>
          </div>
        </section>

        {/* Kenapa Pilih FurKeeper — MUUM-style 2x2 feature grid flanking a
            center photo, alternating peach/blue card backgrounds. Swap the
            ImagePlaceholder for a real customer/product photo — a portrait
            crop works best here since the column is narrow and tall. */}
        <section className="relative overflow-hidden py-12 lg:py-16">
          <PawPrintPattern className="text-brand-burgundy" opacity={0.06} />
          <div className="relative mx-auto max-w-container px-4 md:px-6 lg:px-8">
            <SectionHeader
              title={whyChoose.heading}
              subtitle={whyChoose.subheading}
              align="center"
              className="mb-10 !flex-col !items-center"
            />

            <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-[1fr_0.8fr_1fr] lg:gap-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {whyChoose.items.slice(0, 2).map((item) => {
                  const Icon = whyChooseIcons[item.icon] || Heart;
                  return (
                    <div
                      key={item.title}
                      className={`playful-interactive rounded-3xl p-6 ${whyChooseBg[item.bg] || whyChooseBg.peach}`}
                    >
                      <Icon className="h-7 w-7 text-brand-burgundy" aria-hidden="true" />
                      <h3 className="mt-3 font-heading text-base font-bold text-text-primary">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <ImagePlaceholder
                className="playful-interactive order-first aspect-[4/5] w-full rounded-[2.5rem] lg:order-none"
                alt={whyChoose.centerPhotoAlt}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {whyChoose.items.slice(2, 4).map((item) => {
                  const Icon = whyChooseIcons[item.icon] || Heart;
                  return (
                    <div
                      key={item.title}
                      className={`playful-interactive rounded-3xl p-6 ${whyChooseBg[item.bg] || whyChooseBg.peach}`}
                    >
                      <Icon className="h-7 w-7 text-brand-burgundy" aria-hidden="true" />
                      <h3 className="mt-3 font-heading text-base font-bold text-text-primary">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <Button variant="primary" onClick={() => navigate(ctaPrimary.to)}>
                {ctaPrimary.label}
              </Button>
            </div>
          </div>
        </section>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
