import { ArrowRight } from 'lucide-react';
import { useNavigate } from '@/lib/router';
import Button from '../components/Button';
import PawPrintPattern from '../components/decorative/PawPrintPattern';
import heroDogImg from '../assets/hero-dog.png';
import heroCatImg from '../assets/hero-cat.png';
const heroDog = heroDogImg.src;
const heroCat = heroCatImg.src;
import { useLanguage } from '../i18n/LanguageContext';

export default function Hero() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="relative isolate overflow-hidden rounded-b-[2.5rem] bg-[var(--ungu)] px-5 pb-6 pt-8 sm:rounded-b-[3rem] sm:px-8 sm:pb-8 sm:pt-10 md:px-10 lg:rounded-b-[4rem] lg:px-14 lg:pb-6 lg:pt-12">
      <PawPrintPattern className="text-[var(--lavender)]" opacity={0.14} density="normal" />

      {/* Coin-like dots */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[8%] top-[16%] h-[clamp(0.65rem,1.4vw,1.1rem)] w-[clamp(0.65rem,1.4vw,1.1rem)] rounded-full bg-[var(--kuning)] shadow-[0_0_0_4px_rgba(255,201,92,0.18)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[9%] top-[7%] h-[clamp(1rem,2vw,1.5rem)] w-[clamp(1rem,2vw,1.5rem)] rounded-full bg-[var(--oranye)] shadow-[0_0_0_6px_rgba(244,162,76,0.16)]"
      />

      <div className="relative z-10 mx-auto max-w-container">
        {/* Oversized brand word with the pets standing in front of it. */}
        <div className="relative">
          <div className="hero-word select-none text-center" aria-hidden="true">
            Furkeeper
          </div>
          <div className="relative z-10 -mt-[clamp(2rem,3.5vw,3rem)] grid items-center gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-10">
            <div className="order-2 flex flex-col items-center gap-3 lg:order-1 lg:items-end">
              <h1 className="max-w-[15rem] text-center text-[clamp(0.85rem,1.05vw,1rem)] font-semibold leading-snug text-[var(--krem)] lg:text-right">
                {t('hero.title')}
              </h1>
              <p className="max-w-[15rem] text-center text-[clamp(0.72rem,0.9vw,0.85rem)] font-medium leading-relaxed text-[var(--lavender)] lg:text-right">
                {t('hero.subtitle')}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/produk')}
                className="!border-transparent !bg-[var(--kuning)] !text-[var(--navy)] hover:!bg-[var(--oranye)]"
              >
                {t('hero.ctaShop')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>

            <div className="order-1 flex items-end justify-center lg:order-2">
              <img
                src={heroDog}
                alt="Foto anjing peliharaan"
                className="h-auto w-[clamp(7.5rem,16vw,13rem)] origin-bottom -rotate-3 object-contain drop-shadow-2xl"
              />
              <img
                src={heroCat}
                alt="Foto kucing peliharaan"
                className="-ml-2 h-auto w-[clamp(7.5rem,16vw,13rem)] origin-bottom rotate-3 object-contain drop-shadow-2xl sm:-ml-3"
              />
            </div>

            <div className="order-3 flex flex-col items-center gap-3 lg:items-start">
              <p className="max-w-[15rem] text-center text-[clamp(0.85rem,1.05vw,1rem)] font-semibold leading-snug text-[var(--krem)] lg:text-left">
                {t('hero.taglineTitle')}
              </p>
              <p className="max-w-[15rem] text-center text-[clamp(0.72rem,0.9vw,0.85rem)] font-medium leading-relaxed text-[var(--lavender)] lg:text-left">
                {t('hero.tagline')}
              </p>
              <a
                href="#sekitar"
                className="playful-interactive inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--lavender)] px-4 py-1.5 text-xs font-semibold text-[var(--krem)] transition-colors hover:bg-[var(--lavender)] hover:text-[var(--navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--krem)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ungu)]"
              >
                {t('hero.ctaExplore')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
