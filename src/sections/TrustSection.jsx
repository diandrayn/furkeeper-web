import { ShieldCheck, CreditCard, Headphones } from 'lucide-react';
import { trustPoints } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';

const icons = [ShieldCheck, CreditCard, Headphones];
const tones = ['bg-brand-peach', 'bg-brand-mist', 'bg-brand-pink'];

export default function TrustSection() {
  const { t } = useLanguage();

  return (
    <section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4">
        {trustPoints.map((point, index) => {
          const Icon = icons[index];
          return (
            <div
              key={point.id}
              className={`flex items-center gap-3 rounded-[1.5rem] px-6 py-8 text-left sm:flex-col sm:items-center sm:text-center ${tones[index]}`}
            >
              <Icon
                className="h-6 w-6 shrink-0 text-brand-burgundy sm:mb-2 sm:h-7 sm:w-7"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-heading text-sm font-bold text-brand-burgundy sm:text-base">
                  {t(`trust.${point.id}.title`)}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {t(`trust.${point.id}.description`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
