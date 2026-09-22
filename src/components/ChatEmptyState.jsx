import ImagePlaceholder from './ImagePlaceholder';
import { useLanguage } from '../i18n/LanguageContext';

export default function ChatEmptyState() {
  const { t } = useLanguage();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <ImagePlaceholder
        className="h-24 w-24 rounded-2xl"
        alt={t('chat.emptyIllustrationAlt')}
      />
      <div>
        <h2 className="font-heading text-lg font-bold text-text-primary">
          {t('chat.emptyTitle')}
        </h2>
        <p className="mt-1 max-w-xs text-sm text-text-secondary">
          {t('chat.emptySubtitle')}
        </p>
      </div>
    </div>
  );
}