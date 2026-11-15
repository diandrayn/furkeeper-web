import { Star, Quote } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { testimonials } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';

export default function Testimonials() {
  const { t } = useLanguage();

  return (
    <section className="rounded-[2rem] bg-brand-burgundy-dark px-4 py-10 md:px-8 md:py-14">
      <SectionHeader
        title={t('testimonials.title')}
        subtitle={t('testimonials.subtitle')}
        align="center"
        theme="dark"
        display
        sparkle
        className="mb-8 !flex-col !items-center"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((item) => (
          <article
            key={item.id}
            className="relative rounded-2xl border border-white/10 bg-white/10 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.14]"
          >
            <Quote
              className="absolute right-5 top-5 h-8 w-8 text-white/15"
              aria-hidden="true"
            />

            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${item.avatarBg}`}
              >
                {item.initials}
              </div>
              <div>
                <p className="font-heading text-sm text-white">{item.name}</p>
                <p className="text-xs text-white/60">{item.role}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-0.5">
              {Array.from({ length: item.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-status-warning text-status-warning"
                  aria-hidden="true"
                />
              ))}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/80">
              &ldquo;{item.quote}&rdquo;
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
