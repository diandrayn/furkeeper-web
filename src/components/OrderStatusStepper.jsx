import { Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { statusLabel } from '../utils/statusConstants';

export default function OrderStatusStepper({ stages = [], current }) {
  const { lang } = useLanguage();
  const currentIndex = stages.indexOf(current);

  return (
    <ol className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      {stages.map((stage, index) => {
        const isDone = currentIndex > index;
        const isActive = currentIndex === index;
        const isUpcoming = currentIndex < index;

        return (
          <li
            key={stage}
            className="relative flex flex-1 items-start gap-3 md:flex-col md:items-center md:text-center"
          >
            {index < stages.length - 1 && (
              <span
                className={`absolute left-4 top-8 h-[calc(100%+0.5rem)] w-0.5 md:hidden ${
                  isDone ? 'bg-brand-burgundy' : 'bg-gray-200'
                }`}
                aria-hidden="true"
              />
            )}
            <div className="flex items-center md:w-full">
              <div
                className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isDone
                    ? 'bg-brand-burgundy text-white'
                    : isActive
                      ? 'bg-white text-brand-burgundy ring-2 ring-brand-orange-end'
                      : 'bg-gray-200 text-text-secondary'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < stages.length - 1 && (
                <div
                  className={`mx-3 hidden h-0.5 flex-1 md:block ${
                    isDone ? 'bg-brand-burgundy' : 'bg-gray-200'
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
            <p
              className={`pt-1 text-sm ${
                isUpcoming ? 'text-text-secondary' : 'font-medium text-text-primary'
              }`}
            >
              {statusLabel(stage, lang)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
