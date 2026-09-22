import { Star } from 'lucide-react';

function Stars({ value, size = 'h-4 w-4' }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`${size} ${
            index < Math.round(value)
              ? 'fill-status-warning text-status-warning'
              : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function RatingSummary({ averageRating, totalReviews, distribution = [] }) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center">
      <div className="flex flex-col items-center md:w-40 md:shrink-0">
        <p className="font-heading text-4xl font-bold text-text-primary">{averageRating}</p>
        <Stars value={averageRating} size="h-5 w-5" />
        <p className="mt-2 text-sm text-text-secondary">{totalReviews} ulasan</p>
      </div>
      <div className="flex-1 space-y-2">
        {distribution.map((row) => (
          <div key={row.star} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs text-text-secondary">{row.star} bintang</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-status-warning"
                style={{ width: `${row.percent || 0}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-text-secondary">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
