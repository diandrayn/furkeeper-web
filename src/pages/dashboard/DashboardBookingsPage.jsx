import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Eye, X, Phone, Calendar, MapPin, PawPrint } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PawLoader from '../../components/decorative/PawLoader';
import { useDashboard } from '../../hooks/useDashboard';
import { supabase } from '../../lib/supabaseClient';
import { fetchProviderBookings, setBookingStatus } from '../../utils/bookings';
import { BOOKING_STATUSES, BOOKING_TRANSITIONS, statusLabel, statusBadge, nextBookingAction } from '../../utils/statusConstants';
import { DASHBOARD_PAGE_SIZE } from '../../data/mockDashboard';
import { formatDateId, formatRelativeTimeId } from '../../utils/status';
import { useLanguage } from '../../i18n/LanguageContext';

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

function BookingDetailModal({ booking, onClose, onRespond, t, lang }) {
  if (!booking) return null;
  const action = nextBookingAction(booking.status);
  const canCancel = Boolean(BOOKING_TRANSITIONS.provider[booking.status]?.includes('cancelled'));

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" aria-label={t('dashboardBookings.closeAria')} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-text-primary">{booking.id}</h2>
            <p className="text-xs text-text-secondary">{t('dashboardBookings.submittedAt').replace('{value}', formatRelativeTimeId(booking.createdAt))}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100"
            aria-label={t('dashboardBookings.closeAria')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(booking.status, lang)}`}>
          {statusLabel(booking.status, lang)}
        </span>

        <div className="mt-4 rounded-xl bg-brand-cream/60 p-4">
          <p className="text-sm font-semibold text-text-primary">{booking.serviceName}</p>
          <p className="mt-2 text-right font-heading text-lg font-bold text-text-primary">
            {formatRupiah(booking.price)}
          </p>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-text-secondary">
              <Calendar className="h-4 w-4" />
            </span>
            <p className="text-text-secondary">
              {formatDateId(booking.date)} &middot; {booking.time} {t('dashboardBookings.wib')}
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-text-secondary">
              <PawPrint className="h-4 w-4" />
            </span>
            <p className="text-text-secondary">
              {booking.petName || '-'} {booking.petType ? `&middot; ${booking.petType}` : ''}
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-text-secondary">
              <Phone className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium text-text-primary">{booking.buyerName}</p>
              <p className="text-text-secondary">{booking.buyerPhone}</p>
            </div>
          </div>
          {booking.note && (
            <div className="rounded-xl border border-dashed border-gray-200 p-3 text-text-secondary">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {t('dashboardBookings.customerNote')}
              </p>
              {booking.note}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          {canCancel && (
            <Button
              variant="outline"
              className="flex-1 !border-status-danger !text-status-danger"
              onClick={() => onRespond(booking.id, 'cancelled')}
              playful={false}
            >
              {t('dashboardBookings.reject')}
            </Button>
          )}
          {action && (
            <Button variant="orange" className="flex-1" onClick={() => onRespond(booking.id, action[0])} playful={false}>
              {t(`dashboardBookings.${action[1]}`)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardBookingsPage() {
  const { t, lang } = useLanguage();
  const { serviceStoreId } = useDashboard();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    if (!serviceStoreId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    try {
      const rows = await fetchProviderBookings(serviceStoreId);
      setBookings(rows);
    } catch (err) {
      console.error('fetchProviderBookings failed:', err);
    } finally {
      setLoading(false);
    }
  }, [serviceStoreId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Booking baru masuk otomatis tampil (realtime RLS-aware) + polling ringan.
  useEffect(() => {
    if (!serviceStoreId) return undefined;
    const channel = supabase
      .channel(`provider-bookings-${serviceStoreId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          load();
        },
      )
      .subscribe();
    const poller = window.setInterval(() => load(), 30000);
    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(poller);
    };
  }, [serviceStoreId, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesQuery =
        !q || b.id.toLowerCase().includes(q) || b.buyerName.toLowerCase().includes(q) || b.serviceName.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || b.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [bookings, query, status]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.createdAt - a.createdAt), [filtered]);
  const pageItems = sorted.slice((page - 1) * DASHBOARD_PAGE_SIZE, page * DASHBOARD_PAGE_SIZE);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleRespond = async (id, next) => {
    try {
      await setBookingStatus(id, next, 'provider');
      await load();
      setSelected((prev) => (prev && prev.id === id ? { ...prev, status: next } : prev));
    } catch (err) {
      console.error('setBookingStatus failed:', err);
    }
  };

  const statusOptions = [
    { value: 'all', label: t('dashboardBookings.statusAll') },
    ...BOOKING_STATUSES.map((s) => ({ value: s, label: statusLabel(s, lang) })),
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
            placeholder={t('dashboardBookings.searchPlaceholder')}
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
        <EmptyState title={t('dashboardBookings.emptyTitle')} subtitle={t('dashboardBookings.emptySubtitle')} />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-brand-cream/50 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <th className="px-5 py-3">{t('dashboardBookings.colBookingId')}</th>
                  <th className="px-5 py-3">{t('dashboardBookings.colCustomer')}</th>
                  <th className="px-5 py-3">{t('dashboardBookings.colService')}</th>
                  <th className="px-5 py-3">{t('dashboardBookings.colSchedule')}</th>
                  <th className="px-5 py-3">{t('dashboardBookings.colTotal')}</th>
                  <th className="px-5 py-3">{t('dashboardBookings.colStatus')}</th>
                  <th className="px-5 py-3 text-right">{t('dashboardBookings.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((booking) => (
                  <tr key={booking.id} className="transition-colors hover:bg-brand-cream/30">
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-text-primary">{booking.id}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">{booking.buyerName}</td>
                    <td className="max-w-[200px] truncate px-5 py-3.5 text-text-secondary">{booking.serviceName}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">
                      {formatDateId(booking.date)}, {booking.time}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-text-primary">
                      {formatRupiah(booking.price)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(booking.status, lang)}`}>
                        {statusLabel(booking.status, lang)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(booking)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-brand-burgundy transition-colors hover:bg-brand-peach"
                      >
                        <Eye className="h-3.5 w-3.5" /> {t('dashboardBookings.detail')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-5 py-4">
            <Pagination page={page} pageSize={DASHBOARD_PAGE_SIZE} total={filtered.length} itemLabel={t('dashboardBookings.itemLabel')} onPageChange={setPage} />
          </div>
        </Card>
      )}

      <BookingDetailModal booking={selected} onClose={() => setSelected(null)} onRespond={handleRespond} t={t} lang={lang} />
    </div>
  );
}