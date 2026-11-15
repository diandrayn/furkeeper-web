import { useEffect, useMemo, useState } from 'react';
import { Search, Package, Scissors, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PawLoader from '../../components/decorative/PawLoader';
import {
  fetchAllOrders,
  fetchAllBookings,
  ORDER_STATUS_LABELS,
  BOOKING_STATUS_LABELS,
} from '../../utils/admin';
import { formatDateId } from '../../utils/status';

const PAGE_SIZE = 8;

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

function statusBadgeClass(status) {
  if (status === 'pending_payment' || status === 'pending_confirmation') return 'bg-status-warning/30 text-text-primary';
  if (status === 'processing' || status === 'confirmed' || status === 'in_progress') return 'bg-brand-peach text-brand-burgundy';
  if (status === 'shipped') return 'bg-brand-peach text-brand-burgundy';
  if (status === 'completed') return 'bg-status-success/20 text-status-success';
  if (status === 'cancelled') return 'bg-status-danger/15 text-status-danger';
  return 'bg-gray-100 text-text-secondary';
}

const PAYMENT_STATUS_LABELS = {
  pending: 'Menunggu',
  paid: 'Lunas',
  failed: 'Gagal',
  expired: 'Kedaluwarsa',
  challenge: 'Ditinjau',
  refunded: 'Dikembalikan',
};

const PAYMENT_TYPE_LABELS = {
  credit_card: 'Kartu Kredit/Debit',
  bank_transfer: 'Transfer Bank',
  echannel: 'Mandiri Bill',
  cstore: 'Gerai Retail',
  qris: 'QRIS',
  gopay: 'GoPay',
  shopeepay: 'ShopeePay',
  akulaku: 'Akulaku',
};

const TABS = [
  { key: 'orders', label: 'Transaksi Produk', icon: Package },
  { key: 'bookings', label: 'Booking Jasa', icon: Scissors },
];

export default function AdminOrdersPage() {
  const [tab, setTab] = useState('orders');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const statusLabels = tab === 'orders' ? ORDER_STATUS_LABELS : BOOKING_STATUS_LABELS;
  const statusOptions = useMemo(
    () => [{ value: 'all', label: 'Semua Status' }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))],
    [statusLabels],
  );

  const load = () => {
    setIsLoading(true);
    const fetcher = tab === 'orders' ? fetchAllOrders : fetchAllBookings;
    fetcher({ search: query, status })
      .then(setRows)
      .catch((err) => {
        console.error('fetch transactions failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, query, status]);

  useEffect(() => {
    setStatus('all');
    setQuery('');
    setPage(1);
    setExpandedId(null);
  }, [tab]);

  useEffect(() => setPage(1), [query, status]);

  const pageItems = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [rows, page]);

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-full bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
              tab === t.key ? 'bg-brand-burgundy text-white' : 'text-text-secondary hover:text-brand-burgundy'
            }`}
          >
            <t.icon className="h-4 w-4" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="flex-1"
          placeholder={tab === 'orders' ? 'Cari ID transaksi, pembeli, atau produk...' : 'Cari ID booking, pembeli, atau jasa...'}
          icon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select className="sm:w-64" value={status} onChange={(e) => setStatus(e.target.value)} options={statusOptions} />
      </div>

      {isLoading && <PawLoader label="Memuat data..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">Gagal memuat data. Pastikan migrasi admin sudah dijalankan.</p>
        </Card>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState
          title={tab === 'orders' ? 'Tidak ada transaksi' : 'Tidak ada booking'}
          subtitle="Belum ada data yang cocok dengan pencarian atau filter ini."
        />
      )}

      {!isLoading && !error && rows.length > 0 && (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {pageItems.map((row) =>
                tab === 'orders' ? (
                  <OrderRow
                    key={row.id}
                    order={row}
                    expanded={expandedId === row.id}
                    onToggle={() => setExpandedId((cur) => (cur === row.id ? null : row.id))}
                  />
                ) : (
                  <BookingRow
                    key={row.id}
                    booking={row}
                    expanded={expandedId === row.id}
                    onToggle={() => setExpandedId((cur) => (cur === row.id ? null : row.id))}
                  />
                ),
              )}
            </div>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} itemLabel={tab === 'orders' ? 'transaksi' : 'booking'} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

function OrderRow({ order, expanded, onToggle }) {
  return (
    <div>
      <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors duration-150 hover:bg-brand-peach/30">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">#{order.id.slice(0, 8)} &middot; {order.buyerName}</p>
          <p className="truncate text-xs text-text-secondary">{order.buyerEmail} &middot; {formatDateId(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text-primary">{formatRupiah(order.total)}</span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(order.status)}`}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-text-secondary" /> : <ChevronDown className="h-4 w-4 text-text-secondary" />}
        </div>
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-gray-100 bg-brand-cream/40 p-4">
          <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary sm:grid-cols-4">
            <div><span className="block text-text-primary font-medium">Metode Bayar</span>{PAYMENT_TYPE_LABELS[order.payment?.method] || order.payment?.method || order.paymentMethod || '-'}</div>
            <div><span className="block text-text-primary font-medium">Status Bayar</span>{order.payment ? PAYMENT_STATUS_LABELS[order.payment.status] || order.payment.status : '-'}</div>
            <div><span className="block text-text-primary font-medium">Waktu Bayar</span>{order.payment?.paidAt ? formatDateId(order.payment.paidAt) : '-'}</div>
            <div><span className="block text-text-primary font-medium">Subtotal</span>{formatRupiah(order.subtotal)}</div>
            <div><span className="block text-text-primary font-medium">Ongkir</span>{formatRupiah(order.shippingCost)}</div>
            <div><span className="block text-text-primary font-medium">No. Resi</span>{order.trackingNumber || '-'}</div>
          </div>
          <div className="space-y-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs">
                <span className="text-text-primary">
                  {item.name} {item.variant ? `(${item.variant})` : ''} &times;{item.quantity}
                  <span className="text-text-secondary"> &middot; {item.storeName}</span>
                </span>
                <span className="font-medium text-text-primary">{formatRupiah(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingRow({ booking, expanded, onToggle }) {
  return (
    <div>
      <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors duration-150 hover:bg-brand-peach/30">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">#{booking.id.slice(0, 8)} &middot; {booking.buyerName}</p>
          <p className="truncate text-xs text-text-secondary">{booking.serviceName} &middot; {booking.storeName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text-primary">{formatRupiah(booking.price)}</span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(booking.status)}`}>
            {BOOKING_STATUS_LABELS[booking.status] || booking.status}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-text-secondary" /> : <ChevronDown className="h-4 w-4 text-text-secondary" />}
        </div>
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-gray-100 bg-brand-cream/40 p-4 text-xs text-text-secondary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><span className="block text-text-primary font-medium">Jadwal</span>{formatDateId(booking.scheduledDate)}, {booking.scheduledTime}</div>
            <div><span className="block text-text-primary font-medium">Hewan</span>{booking.petName}</div>
            <div><span className="block text-text-primary font-medium">Paket</span>{booking.packageName || '-'}</div>
            <div><span className="block text-text-primary font-medium">Email Pembeli</span>{booking.buyerEmail}</div>
          </div>
          {booking.notes && (
            <div>
              <span className="block text-text-primary font-medium">Catatan</span>
              {booking.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
