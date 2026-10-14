import { useCallback, useEffect, useMemo, useState } from 'react';
import { Star, Send, Search, RefreshCw } from 'lucide-react';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PawLoader from '../../components/decorative/PawLoader';
import { useDashboard } from '../../hooks/useDashboard';
import { fetchStoreReviews } from '../../utils/stores';
import { replyToReview } from '../../utils/reviews';
import { DASHBOARD_PAGE_SIZE } from '../../data/mockDashboard';
import { getInitials } from '../../utils/status';
import { useLanguage } from '../../i18n/LanguageContext';

function Stars({ rating, t }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={t('dashboardReviews.starsOf5').replace('{value}', rating)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-brand-orange-end text-brand-orange-end' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

function ReviewReplyForm({ onSubmit, t }) {
  const [text, setText] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text.trim());
        setText('');
      }}
      className="mt-3 flex items-center gap-2"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('dashboardReviews.replyPlaceholder')}
        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand-orange-end focus:ring-2 focus:ring-brand-orange-end/30"
      />
      <button
        type="submit"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange-end text-white transition-colors hover:bg-brand-burgundy"
        aria-label={t('dashboardReviews.sendReply')}
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}

export default function DashboardReviewsPage({ mode = 'toko' }) {
  const { t } = useLanguage();
  const { storeId, serviceStoreId } = useDashboard();
  const targetStoreId = mode === 'jasa' ? serviceStoreId : storeId;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState('');
  const [rating, setRating] = useState('all');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!targetStoreId) {
      setReviews([]);
      setLoading(false);
      return;
    }
    try {
      const rows = await fetchStoreReviews(targetStoreId);
      setReviews(rows);
    } catch (err) {
      console.error('fetchStoreReviews failed:', err);
    } finally {
      setLoading(false);
    }
  }, [targetStoreId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      const matchesQuery =
        !q ||
        r.reviewerName.toLowerCase().includes(q) ||
        (r.targetName || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q);
      const matchesRating = rating === 'all' || r.rating === Number(rating);
      return matchesQuery && matchesRating;
    });
  }, [reviews, query, rating]);

  const pageItems = filtered.slice((page - 1) * DASHBOARD_PAGE_SIZE, page * DASHBOARD_PAGE_SIZE);

  const handleReply = async (reviewId, reply) => {
    try {
      await replyToReview(reviewId, reply);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply } : r)));
    } catch (err) {
      console.error('replyToReview failed:', err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t('dashboardReviews.searchPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand-orange-end focus:ring-2 focus:ring-brand-orange-end/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={[
              { value: 'all', label: t('dashboardReviews.ratingAll') },
              { value: '5', label: '5' },
              { value: '4', label: '4' },
              { value: '3', label: '3' },
              { value: '2', label: '2' },
              { value: '1', label: '1' },
            ]}
            value={rating}
            onChange={(e) => {
              setRating(e.target.value);
              setPage(1);
            }}
            className="w-32"
          />
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-text-secondary transition-colors hover:bg-brand-cream"
            aria-label={t('dashboardReviews.refresh')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-text-secondary">
          <PawLoader />
        </div>
      ) : pageItems.length === 0 ? (
        <EmptyState title={t('dashboardReviews.emptyTitle')} subtitle={t('dashboardReviews.emptySubtitle')} />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {pageItems.map((review) => (
              <div key={review.id} className="flex gap-3 p-4 sm:p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-peach text-sm font-bold text-brand-burgundy">
                  {review.reviewerAvatar ? (
                    <img src={review.reviewerAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    getInitials(review.reviewerName)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text-primary">{review.reviewerName}</p>
                    {review.targetName && <span className="text-xs text-text-secondary">· {review.targetName}</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars rating={review.rating} t={t} />
                    <span className="text-xs text-text-secondary">{review.date}</span>
                  </div>
                  {review.comment && <p className="mt-2 text-sm text-text-primary">{review.comment}</p>}
                  {review.reply ? (
                    <div className="mt-3 rounded-xl bg-brand-cream/60 p-3">
                      <p className="text-xs font-semibold text-brand-burgundy">{t('dashboardReviews.yourReply')}</p>
                      <p className="mt-1 text-sm text-text-secondary">{review.reply}</p>
                    </div>
                  ) : (
                    <ReviewReplyForm onSubmit={(reply) => handleReply(review.id, reply)} t={t} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 px-5 py-4">
            <Pagination page={page} pageSize={DASHBOARD_PAGE_SIZE} total={filtered.length} itemLabel={t('dashboardReviews.itemLabel')} onPageChange={setPage} />
          </div>
        </Card>
      )}
    </div>
  );
}