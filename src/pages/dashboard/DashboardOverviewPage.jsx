import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ShoppingBag, Package, Star, CalendarCheck, ArrowRight } from 'lucide-react';
import Card from '../../components/Card';
import StatCard from '../../components/dashboard/StatCard';
import PawLoader from '../../components/decorative/PawLoader';
import { useDashboard } from '../../hooks/useDashboard';
import { fetchStoreOrders } from '../../utils/orders';
import { fetchProviderBookings } from '../../utils/bookings';
import { fetchStoreReviews } from '../../utils/stores';
import { statusLabel, statusBadge } from '../../utils/statusConstants';
import { formatRelativeTimeId } from '../../utils/status';
import { useLanguage } from '../../i18n/LanguageContext';

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

function avgRating(reviews) {
  if (!reviews.length) return 0;
  return Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1));
}

export default function DashboardOverviewPage({ mode }) {
  const { t } = useLanguage();
  const { products, services, storeProfile, providerProfile, storeId, serviceStoreId } = useDashboard();

  const isJasa = mode === 'jasa';
  const targetStoreId = isJasa ? serviceStoreId : storeId;
  const items = isJasa ? services : products;

  const [transactions, setTransactions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!targetStoreId) {
      setTransactions([]);
      setReviews([]);
      setLoading(false);
      return;
    }
    try {
      const [tx, rv] = await Promise.all([
        isJasa ? fetchProviderBookings(targetStoreId) : fetchStoreOrders(targetStoreId),
        fetchStoreReviews(targetStoreId),
      ]);
      setTransactions(tx);
      setReviews(rv);
    } catch (err) {
      console.error('DashboardOverviewPage load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [isJasa, targetStoreId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const profile = isJasa ? providerProfile : storeProfile;

  const revenue = transactions
    .filter((item) => item.status === 'completed')
    .reduce((sum, item) => sum + (item.totalPrice ?? item.price ?? 0), 0);
  const newCount = transactions.filter(
    (item) => item.status === 'pending_payment' || item.status === 'pending_confirmation',
  ).length;
  const activeItemsCount = items.filter((i) => i.status === 'aktif').length;
  const rating = avgRating(reviews);

  const recent = [...transactions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  const topItems = [...items]
    .sort((a, b) => (isJasa ? (b.booked || 0) - (a.booked || 0) : (b.sold || 0) - (a.sold || 0)))
    .slice(0, 5);
  const maxTopValue = Math.max(1, ...topItems.map((i) => (isJasa ? i.booked || 0 : i.sold || 0)));

  const listHref = isJasa ? '/dashboard/jasa/booking' : '/dashboard/toko/pesanan';

  return (
    <div className="space-y-6">
      <Card className="!flex flex-col gap-4 sm:!flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-text-secondary">{t('dashboardOverview.welcomeBack')}</p>
          <h2 className="font-heading text-xl font-bold text-text-primary">{profile.name}</h2>
          <p className="mt-1 text-sm text-text-secondary">{profile.tagline}</p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            profile.isOpen ? 'bg-status-success/20 text-status-success' : 'bg-gray-100 text-text-secondary'
          }`}
        >
          {profile.isOpen ? t('dashboardOverview.open') : t('dashboardOverview.closed')}
        </span>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label={t('dashboardOverview.revenue')} value={formatRupiah(revenue)} tone="success" />
        <StatCard
          icon={isJasa ? CalendarCheck : ShoppingBag}
          label={isJasa ? t('dashboardOverview.newBookings') : t('dashboardOverview.newOrders')}
          value={newCount}
          hint={t('dashboardOverview.awaitingConfirmation')}
          tone="warning"
        />
        <StatCard
          icon={Package}
          label={isJasa ? t('dashboardOverview.activeServices') : t('dashboardOverview.activeProducts')}
          value={activeItemsCount}
          hint={t('dashboardOverview.ofTotal').replace('{value}', items.length)}
          tone="orange"
        />
        <StatCard icon={Star} label={t('dashboardOverview.avgRating')} value={rating || '—'} hint={t('dashboardOverview.reviewsCount').replace('{value}', reviews.length)} tone="burgundy" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-text-secondary">
          <PawLoader />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-text-primary">
                {isJasa ? t('dashboardOverview.recentBookings') : t('dashboardOverview.recentOrders')}
              </h3>
              <Link to={listHref} className="flex items-center gap-1 text-sm font-medium text-brand-burgundy hover:underline">
                {t('dashboardOverview.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recent.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {isJasa ? item.serviceName : item.productName}
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {item.buyerName} &middot; {formatRelativeTimeId(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-text-primary">
                      {formatRupiah(item.totalPrice ?? item.price)}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 font-heading text-base font-bold text-text-primary">
              {isJasa ? t('dashboardOverview.topServices') : t('dashboardOverview.topProducts')}
            </h3>
            <div className="space-y-4">
              {topItems.map((item) => {
                const value = isJasa ? item.booked || 0 : item.sold || 0;
                return (
                  <div key={item.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <p className="truncate text-sm text-text-primary">{item.name}</p>
                      <span className="shrink-0 text-xs font-semibold text-text-secondary">
                        {value} {isJasa ? t('dashboardOverview.bookingUnit') : t('dashboardOverview.soldUnit')}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-brand-cream">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-orange-start to-brand-orange-end"
                        style={{ width: `${Math.max(6, (value / maxTopValue) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}