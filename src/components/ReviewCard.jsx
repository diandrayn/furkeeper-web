import ImagePlaceholder from './ImagePlaceholder';
import { Star } from 'lucide-react';

export default function ReviewCard({
  reviewerName,
  reviewerAvatar,
  rating,
  date,
  comment,
  buyerPhotos = 0,
}) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <ImagePlaceholder
          className="h-10 w-10 shrink-0 rounded-full"
          alt={reviewerAvatar || `Avatar ${reviewerName}`}
          showIcon={false}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-text-primary">{reviewerName}</p>
            <p className="text-xs text-text-secondary">{date}</p>
          </div>
          <div className="mt-1 flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                className={`h-3.5 w-3.5 ${
                  index < rating
                    ? 'fill-status-warning text-status-warning'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{comment}</p>
          {buyerPhotos > 0 && (
            <div className="mt-4 rounded-xl bg-brand-cream p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Foto dari pembeli
              </p>
              <div className="flex gap-2">
                {Array.from({ length: buyerPhotos }, (_, index) => (
                  <ImagePlaceholder
                    key={index}
                    className="h-16 w-16 rounded-lg"
                    alt={`Foto pembeli ${index + 1} dari ${reviewerName}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
