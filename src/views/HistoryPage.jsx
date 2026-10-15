import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@/lib/router';
import HistoryFilterBar from '../components/HistoryFilterBar';
import HistoryCard from '../components/HistoryCard';
import ReviewModal from '../components/ReviewModal';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import PawLoader from '../components/decorative/PawLoader';
import { useAuth } from '../hooks/useAuth';
import { fetchMyOrders } from '../utils/orders';
import { fetchMyBookings } from '../utils/bookings';
import { createReview, hasReviewed } from '../utils/reviews';
import { ORDER_STATUSES, BOOKING_STATUSES, statusLabel } from '../utils/statusConstants';
import { useLanguage } from '../i18n/LanguageContext';

function productStatusOptions(t, lang) {
  return [
    { value: 'all', label: t('history.statusAll') },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s, lang) })),
  ];
}

function bookingStatusOptions(t, lang) {
  return [
    { value: 'all', label: t('history.statusAll') },
    ...BOOKING_STATUSES.map((s) => ({ value: s, label: statusLabel(s, lang) })),
  ];
}

function inDateRange(timestamp, from, to) {
  if (!from && !to) return true;
  const day = new Date(timestamp);
  if (Number.isNaN(day.getTime())) return true;
  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    if (day < start) return false;
  }
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (day > end) return false;
  }
  return true;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewedMap, setReviewedMap] = useState({});
  const [tab, setTab] = useState('product');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [query, setQuery] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const [o, b] = await Promise.all([fetchMyOrders(user.id), fetchMyBookings(user.id)]);
        if (!active) return;
        setOrders(o);
        setBookings(b);

        const completed = [...o.filter((x) => x.status === 'completed'), ...b.filter((x) => x.status === 'completed')];
        const pairs = await Promise.all(
          completed.map(async (x) => {
            const done = await hasReviewed(x.type === 'product' ? { orderId: x.id } : { bookingId: x.id });
            return [x.id, done];
          }),
        );
        if (active) setReviewedMap(Object.fromEntries(pairs));
      } catch (err) {
        console.error('HistoryPage load failed:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const items = tab === 'product' ? orders : bookings;

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (status !== 'all' && item.status !== status) return false;
      if (!inDateRange(item.createdAt, dateFrom, dateTo)) return false;
      if (query.trim() && !item.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [items, status, dateFrom, dateTo, query]);

  const tabs = [
    { id: 'product', label: t('history.productsTab') },
    { id: 'service', label: t('history.servicesTab') },
  ];

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!reviewTarget || !user?.id) return;
    try {
      const isOrder = reviewTarget.type === 'product';
      await createReview({
        authorId: user.id,
        productId: isOrder ? reviewTarget.items?.[0]?.product_id || null : null,
        serviceId: isOrder ? null : reviewTarget.serviceId || null,
        orderId: isOrder ? reviewTarget.id : null,
        bookingId: isOrder ? null : reviewTarget.id,
        rating,
        comment,
      });
      setReviewedMap((prev) => ({ ...prev, [reviewTarget.id]: true }));
      setReviewTarget(null);
    } catch (err) {
      console.error('createReview failed:', err);
    }
  };

  return (
    <div>
      <div className="flex gap-2 rounded-xl bg-white p-1 shadow-sm">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setStatus('all');
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
              tab === item.id
                ? 'bg-brand-orange-end/10 font-medium text-brand-burgundy'
                : 'text-text-secondary hover:text-brand-burgundy'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <HistoryFilterBar
        status={status}
        onStatusChange={setStatus}
        statusOptions={tab === 'product' ? productStatusOptions(t, lang) : bookingStatusOptions(t, lang)}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        query={query}
        onQueryChange={setQuery}
      />

      {loading ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-text-secondary">
          <PawLoader />
          <p className="text-sm">{t('history.loading')}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              title={
                items.length === 0
                  ? tab === 'product'
                    ? t('history.emptyOrdersTitle')
                    : t('history.emptyBookingsTitle')
                  : t('history.noResultsTitle')
              }
              subtitle={
                items.length === 0
                  ? tab === 'product'
                    ? t('history.emptyOrdersSubtitle')
                    : t('history.emptyBookingsSubtitle')
                  : t('history.noResultsSubtitle')
              }
              onReset={
                items.length === 0
                  ? undefined
                  : () => {
                      setStatus('all');
                      setQuery('');
                      setDateFrom('');
                      setDateTo('');
                    }
              }
              action={
                items.length === 0 ? (
                  <Link to={tab === 'product' ? '/produk' : '/jasa'}>
                    <Button variant="outline">{tab === 'product' ? t('history.startShopping') : t('history.exploreServices')}</Button>
                  </Link>
                ) : null
              }
            />
          ) : (
            filtered.map((item) => (
              <HistoryCard
                key={item.id}
                thumbnail={item.thumbnail}
                name={item.name}
                date={item.createdAt}
                totalPrice={item.totalPrice}
                status={statusLabel(item.status, lang)}
                onViewDetail={() =>
                  navigate(tab === 'product' ? `/pesanan/${item.id}` : `/booking/${item.id}/status`)
                }
                onReview={
                  item.status === 'completed' && !reviewedMap[item.id]
                    ? () => setReviewTarget(item)
                    : undefined
                }
              />
            ))
          )}
        </div>
      )}

      <ReviewModal
        key={reviewTarget?.id || 'review'}
        open={Boolean(reviewTarget)}
        title={reviewTarget ? `${t('history.reviewTitlePrefix')} ${reviewTarget.name}` : t('history.giveReview')}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}