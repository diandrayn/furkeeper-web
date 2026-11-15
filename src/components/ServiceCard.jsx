import { MapPin, Star, Plus } from 'lucide-react';
import { Link } from '@/lib/router';
import ImagePlaceholder from './ImagePlaceholder';
import Badge from './Badge';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

export default function ServiceCard({
  id,
  image,
  imageUrl,
  providerName,
  storeId,
  name,
  priceFrom,
  rating,
  reviewCount,
  distanceOrLocation,
  badge,
  to,
  variant = 'default',
  tone = 'cream',
}) {
  const { t } = useLanguage();
  const href = to || (id != null ? `/jasa/${id}` : undefined);
  const storeHref = storeId != null ? `/toko/${storeId}` : undefined;
  const showcaseTone = {
    peach: 'bg-brand-peach',
    pink: 'bg-brand-pink',
    mist: 'bg-brand-mist',
    cream: 'bg-white',
  }[tone] || 'bg-white';

  if (variant === 'showcase') {
    return (
      <article
        className={`playful-interactive group flex h-full flex-col overflow-hidden rounded-[1.5rem] ${showcaseTone} p-3`}
      >
        <div className="relative overflow-hidden rounded-[1.15rem]">
          {href ? (
            <Link
              to={href}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-burgundy/40"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name || providerName}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <ImagePlaceholder
                  className="aspect-square w-full"
                  alt={image || `Gambar jasa ${name || providerName}`}
                />
              )}
            </Link>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={name || providerName}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <ImagePlaceholder
              className="aspect-square w-full"
              alt={image || `Gambar jasa ${name || providerName}`}
            />
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-2 px-1 pb-1">
          <div className="min-w-0">
            {href ? (
              <Link
                to={href}
                className="line-clamp-2 text-sm font-semibold text-brand-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-burgundy/40"
              >
                {name || providerName}
              </Link>
            ) : (
              <h3 className="line-clamp-2 text-sm font-semibold text-brand-burgundy">
                {name || providerName}
              </h3>
            )}
            <p className="mt-1 font-heading text-sm text-text-primary">
              {t('common.from')} {formatPrice(priceFrom)}
            </p>
          </div>
          {href && (
            <Link
              to={href}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-burgundy text-white transition-colors hover:bg-brand-burgundy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-burgundy/40"
              aria-label={name || providerName}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </article>
    );
  }

  const imageSection = (
    <div className="relative">
      {href ? (
        <Link to={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name || providerName}
              className="aspect-[4/3] w-full rounded-t-2xl object-cover"
            />
          ) : (
            <ImagePlaceholder
              className="aspect-[4/3] w-full rounded-t-2xl"
              alt={image || `Gambar jasa ${name || providerName}`}
            />
          )}
        </Link>
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={name || providerName}
          className="aspect-[4/3] w-full rounded-t-2xl object-cover"
        />
      ) : (
        <ImagePlaceholder
          className="aspect-[4/3] w-full rounded-t-2xl"
          alt={image || `Gambar jasa ${name || providerName}`}
        />
      )}
      {badge && (
        <div className="absolute left-3 top-3">
          <Badge variant={badge} />
        </div>
      )}
    </div>
  );

  return (
    <article className="playful-interactive group overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md">
      {imageSection}

      <div className="space-y-2 p-4">
        <div className="flex items-center gap-1 text-xs text-text-secondary">
          <Star className="h-3.5 w-3.5 fill-status-warning text-status-warning" />
          <span>
            {rating} {t('serviceDetail.reviewsCount').replace('{value}', reviewCount)}
          </span>
        </div>

        {href ? (
          <Link
            to={href}
            className="line-clamp-2 block text-sm font-medium leading-snug text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
          >
            {name || providerName}
          </Link>
        ) : (
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-text-primary">
            {name || providerName}
          </h3>
        )}

        {providerName && (
          storeHref ? (
            <Link
              to={storeHref}
              className="block text-sm font-medium text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
            >
              {providerName}
            </Link>
          ) : (
            <p className="text-sm font-medium text-text-primary">{providerName}</p>
          )
        )}

        {distanceOrLocation && (
          <p className="flex items-center gap-1 truncate text-xs text-text-secondary">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {distanceOrLocation}
          </p>
        )}
        <p className="font-heading text-base font-bold text-brand-burgundy">
          {t('common.from')} {formatPrice(priceFrom)}
        </p>
      </div>
    </article>
  );
}