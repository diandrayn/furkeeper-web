import { ArrowRight } from 'lucide-react';
import { useNavigate } from '@/lib/router';
import Button from '../components/Button';
import heroDogImg from '../assets/hero-dog.png';
import heroCatImg from '../assets/hero-cat.png';
const heroDog = heroDogImg.src;
const heroCat = heroCatImg.src;
import { useLanguage } from '../i18n/LanguageContext';

export default function Hero() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-brand-peach">
      <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
        {/* Left: copy + CTA */}
        <div>
          {/* text-balance keeps the two wrapped lines an even width instead
              of one long line + one short "orphan" line. */}
          <h1 className="font-hero text-balance text-4xl leading-[1.15] text-brand-burgundy sm:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-text-secondary sm:text-base">
            {t('hero.subtitle')}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Button variant="outline" onClick={() => navigate('/produk')}>
              {t('hero.ctaShop')}
            </Button>
            <a
              href="#sekitar"
              className="playful-interactive inline-flex items-center gap-1.5 text-sm font-semibold text-brand-burgundy hover:text-brand-burgundy/70"
            >
              {t('hero.ctaExplore')} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Right: peach box behind the cutout pet photos.
            REPLACE hero-dog.png / hero-cat.png in src/assets with your own
            files (background-removed PNGs work best here, trimmed tight to
            the animal with no empty space around it — that's what lets
            them share the same baseline below). If you only have one
            photo, just delete the <img> block you don't need. */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute inset-0 rounded-[2.5rem] bg-white/40" aria-hidden="true" />
          <div className="relative flex aspect-[5/4] items-end justify-center gap-1 overflow-visible rounded-[2.5rem] px-2 pb-4">
            <img
            src={heroDog}
            alt="Foto anjing peliharaan"
            className="relative z-10 h-[80%] w-auto max-w-[65%] object-contain drop-shadow-2xl"
            />
            <img
              src={heroCat}
              alt="Foto kucing peliharaan"
              className="h-[80%] w-auto max-w-[55%] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
