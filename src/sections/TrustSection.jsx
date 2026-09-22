import { ShieldCheck, CreditCard, Headphones } from 'lucide-react';
import { trustPoints } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';

const icons = [ShieldCheck, CreditCard, Headphones];

export default function TrustSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-brand-burgundy py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-container px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0">
          {trustPoints.map((point, index) => {
            const Icon = icons[index];
            return (
              <div
                key={point.id}
                className={`flex items-center gap-3 text-center sm:flex-col sm:px-4 sm:text-center ${
                  index > 0 ? 'sm:border-l sm:border-white/15' : ''
                }`}
              >
                <Icon className="h-6 w-6 shrink-0 text-white sm:mb-2 sm:h-7 sm:w-7" aria-hidden="true" />
                <div>
                  <h3 className="font-heading text-sm font-bold text-white sm:text-base">
                    {t(`trust.${point.id}.title`)}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/70">
                    {t(`trust.${point.id}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
