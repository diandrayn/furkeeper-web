import Button from './Button';
import ImagePlaceholder from './ImagePlaceholder';
import { formatPrice } from '../utils/validation';
import { formatDateId, statusBadgeClass } from '../utils/status';

export default function HistoryCard({
  thumbnail,
  name,
  date,
  totalPrice,
  status,
  onViewDetail,
  onReview,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      {thumbnail ? (
        <img src={thumbnail} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
      ) : (
        <ImagePlaceholder className="h-20 w-20 shrink-0 rounded-xl" alt={name} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-sm font-bold text-text-primary sm:text-base">{name}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}>
            {status}
          </span>
        </div>
        <p className="mt-1 text-xs text-text-secondary">{formatDateId(date)}</p>
        <p className="mt-1 text-sm font-semibold text-brand-burgundy">{formatPrice(totalPrice)}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        <Button variant="outline" size="sm" onClick={onViewDetail}>
          Lihat Detail
        </Button>
        {onReview && (
          <Button variant="primary" size="sm" onClick={onReview}>
            Beri Ulasan
          </Button>
        )}
      </div>
    </div>
  );
}
