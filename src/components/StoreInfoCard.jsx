import { MapPin, Star } from 'lucide-react';
import { Link } from '@/lib/router';
import ImagePlaceholder from './ImagePlaceholder';
import Badge from './Badge';
import Button from './Button';

export default function StoreInfoCard({
  storeName,
  storeId,
  rating,
  location,
  trusted = false,
  to = '/produk',
}) {
  const storeHref = storeId != null ? `/toko/${storeId}` : to;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <ImagePlaceholder className="h-16 w-16 shrink-0 rounded-full" alt={`Logo ${storeName}`} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {storeId != null ? (
              <Link
                to={storeHref}
                className="font-heading text-lg font-bold text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
              >
                {storeName}
              </Link>
            ) : (
              <h3 className="font-heading text-lg font-bold text-text-primary">{storeName}</h3>
            )}
            {trusted && <Badge variant="Terpercaya" />}
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
            <Star className="h-4 w-4 fill-status-warning text-status-warning" />
            {rating}
            <span aria-hidden="true">·</span>
            <MapPin className="h-4 w-4" />
            Kecamatan {location}
          </p>
        </div>
      </div>
      <Link to={storeHref}>
        <Button variant="outline">Kunjungi Toko</Button>
      </Link>
    </div>
  );
}