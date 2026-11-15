import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Eye, X, Phone, MapPin, CreditCard } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PawLoader from '../../components/decorative/PawLoader';
import { useDashboard } from '../../hooks/useDashboard';
import { fetchStoreOrders, setOrderStatus } from '../../utils/orders';
import { paymentStatusKey, paymentTypeKey } from '../../utils/payments';
import { ORDER_STATUSES, ORDER_TRANSITIONS, statusLabel, statusBadge, nextOrderAction } from '../../utils/statusConstants';
import { DASHBOARD_PAGE_SIZE } from '../../data/mockDashboard';
import { formatRelativeTimeId } from '../../utils/status';
import { useLanguage } from '../../i18n/LanguageContext';

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

function paymentStatusBadge(status) {
  if (status === 'paid') return 'bg-status-success/20 text-status-success';
  if (status === 'failed' || status === 'expired') return 'bg-status-danger/15 text-status-danger';
  if (status === 'challenge') return 'bg-status-warning/30 text-text-primary';
  return 'bg-status-warning/25 text-[#8a6d1f]';
}

function OrderDetailModal({ order, onClose, onRespond, onCancel, t, lang }) {
  if (!order) return null;
  const action = nextOrderAction(order.status);
  const canCancel = Boolean(ORDER_TRANSITIONS.seller[order.status]?.includes('cancelled'));
  const payment = order.payment || null;
  const paymentMethodKey = payment?.method ? paymentTypeKey(payment.method) : null;
  const paymentMethodLabel = payment?.method
    ? paymentMethodKey
      ? t(paymentMethodKey)
      : payment.method
    : order.paymentMethod || '-';

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" aria-label={t('dashboardOrders.closeAria')} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-text-primary">{order.id}</h2>
            <p className="text-xs text-text-secondary" suppressHydrationWarning>{formatRelativeTimeId(order.createdAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100"
            aria-label={t('dashboardOrders.closeAria')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(order.status, lang)}`}>
          {statusLabel(order.status, lang)}
        </span>

        <div className="mt-4 rounded-xl bg-brand-cream/60 p-4">
          <p className="text-sm font-semibold text-text-primary">
            {order.items?.map((i) => `${i.name} x${i.quantity}`).join(', ') || order.productName}
          </p>
          <p className="mt-2 text-right font-heading text-lg font-bold text-text-primary">
            {formatRupiah(order.totalPrice)}
          </p>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-text-secondary">
              <Phone className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium text-text-primary">{order.buyerName}</p>
              <p className="text-text-secondary">{order.buyerPhone}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-text-secondary">
              <MapPin className="h-4 w-4" />
            </span>
            <p className="whitespace-pre-line text-text-secondary">{order.address || '-'}</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-text-secondary">
              <CreditCard className="h-4 w-4" />
            </span>
            <div className="space-y-1">
              <p className="text-text-secondary">{paymentMethodLabel}</p>
              {payment?.status && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${paymentStatusBadge(payment.status)}`}>
                  {t(paymentStatusKey(payment.status))}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {canCancel && (
            <Button
              variant="outline"
              className="flex-1 !border-status-danger !text-status-danger"
              onClick={() => onCancel(order.id)}
              playful={false}
            >
              {t('dashboardOrders.cancel')}
            </Button>
          )}
          {action && (
            <Button variant="orange" className="flex-1" onClick={() => onRespond(order.id, action[0])} playful={false}>
              {t(`dashboardOrders.${action[1]}`)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardOrdersPage() {
  const { t, lang } = useLanguage();
  const { storeId } = useDashboard();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    if (!storeId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const rows = await fetchStoreOrders(storeId);
      setOrders(rows);
    } catch (err) {
      console.error('fetchStoreOrders failed:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Poll MySQL for new or updated orders while this dashboard is open.
  useEffect(() => {
    if (!storeId) return undefined;
    const poller = window.setInterval(() => load(), 30000);
    return () => window.clearInterval(poller);
  }, [storeId, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesQuery =
        !q || o.id.toLowerCase().includes(q) || o.buyerName.toLowerCase().includes(q) || o.productName.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || o.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, status]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.createdAt - a.createdAt), [filtered]);
  const pageItems = sorted.slice((page - 1) * DASHBOARD_PAGE_SIZE, page * DASHBOARD_PAGE_SIZE);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleRespond = async (id, next) => {
    setActionLoading(true);
    try {
      await setOrderStatus(id, next, 'seller');
      await load();
      setSelected((prev) => (prev && prev.id === id ? { ...prev, status: next } : prev));
    } catch (err) {
      console.error('setOrderStatus failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    setActionLoading(true);
    try {
      await setOrderStatus(id, 'cancelled', 'seller');
      await load();
      setSelected(null);
    } catch (err) {
      console.error('setOrderStatus failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: t('dashboardOrders.statusAll') },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s, lang) })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleFilterChange(setQuery)(e.target.value)}
            placeholder={t('dashboardOrders.searchPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand-orange-end focus:ring-2 focus:ring-brand-orange-end/30"
          />
        </div>
        <Select options={statusOptions} value={status} onChange={(e) => handleFilterChange(setStatus)(e.target.value)} className="w-full sm:w-52" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-text-secondary">
          <PawLoader />
        </div>
      ) : pageItems.length === 0 ? (
        <EmptyState title={t('dashboardOrders.emptyTitle')} subtitle={t('dashboardOrders.emptySubtitle')} />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-brand-cream/50 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <th className="px-5 py-3">{t('dashboardOrders.colOrderId')}</th>
                  <th className="px-5 py-3">{t('dashboardOrders.colBuyer')}</th>
                  <th className="px-5 py-3">{t('dashboardOrders.colProduct')}</th>
                  <th className="px-5 py-3">{t('dashboardOrders.colTotal')}</th>
                  <th className="px-5 py-3">{t('dashboardOrders.colTime')}</th>
                  <th className="px-5 py-3">{t('dashboardOrders.colStatus')}</th>
                  <th className="px-5 py-3 text-right">{t('dashboardOrders.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-brand-cream/30">
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-text-primary">{order.id}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">{order.buyerName}</td>
                    <td className="max-w-[220px] truncate px-5 py-3.5 text-text-secondary">{order.productName}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-text-primary">
                      {formatRupiah(order.totalPrice)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">
                      <span suppressHydrationWarning>{formatRelativeTimeId(order.createdAt)}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(order.status, lang)}`}>
                        {statusLabel(order.status, lang)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(order)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-brand-burgundy transition-colors hover:bg-brand-peach"
                      >
                        <Eye className="h-3.5 w-3.5" /> {t('dashboardOrders.detail')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-5 py-4">
            <Pagination page={page} pageSize={DASHBOARD_PAGE_SIZE} total={filtered.length} itemLabel={t('dashboardOrders.itemLabel')} onPageChange={setPage} />
          </div>
        </Card>
      )}

      <OrderDetailModal
        order={selected}
        onClose={() => setSelected(null)}
        onRespond={handleRespond}
        onCancel={handleCancel}
        t={t}
        lang={lang}
      />
    </div>
  );
}