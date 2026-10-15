import { Link } from '@/lib/router';
import { Flag, ClipboardCheck, Receipt, ArrowRight } from 'lucide-react';
import Card from '../Card';

// Kartu tambahan untuk halaman Ringkasan (§2.1): laporan yang belum
// ditindaklanjuti, listing menunggu approval, dan ringkasan transaksi.
// Drop-in: <AdminOverviewExtras stats={stats} /> dengan `stats` dari
// fetchAdminStats() di utils/admin.js.
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function AlertCard({ icon: Icon, tone, label, value, hint, to, linkLabel }) {
  return (
    <Card className="flex flex-col justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="font-heading text-2xl font-bold text-text-primary">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-text-secondary">{hint}</p>}
        </div>
      </div>
      <Link to={to} className="flex items-center gap-1 text-sm font-semibold text-brand-burgundy hover:underline">
        {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}

function PeriodColumn({ title, data }) {
  return (
    <div className="rounded-xl bg-brand-peach/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</p>
      <p className="mt-1 font-heading text-xl font-bold text-text-primary">{rupiah.format(data.value)}</p>
      <p className="text-sm text-text-secondary">{data.count} transaksi</p>
      <p className="mt-2 text-xs text-text-secondary">
        {data.orderCount} pesanan produk · {data.bookingCount} booking jasa
      </p>
    </div>
  );
}

export default function AdminOverviewExtras({ stats }) {
  if (!stats) return null;
  const summary = stats.transactionSummary;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <AlertCard
          icon={Flag}
          tone="bg-status-danger/10 text-status-danger"
          label="Laporan belum ditindaklanjuti"
          value={stats.newReports}
          hint={stats.inProgressReports > 0 ? `${stats.inProgressReports} lainnya sedang diproses` : null}
          to="/admin/laporan"
          linkLabel="Buka Kelola Laporan"
        />
        <AlertCard
          icon={ClipboardCheck}
          tone="bg-amber-100 text-amber-700"
          label="Listing menunggu approval"
          value={stats.pendingListings}
          hint={`${stats.pendingProducts} produk · ${stats.pendingServices} jasa`}
          to={stats.pendingServices > stats.pendingProducts ? '/admin/jasa' : '/admin/produk'}
          linkLabel="Tinjau listing"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-peach text-brand-burgundy">
              <Receipt className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-text-primary">Ringkasan Transaksi</p>
              <p className="text-xs text-text-secondary">
                Pesanan diproses/dikirim/selesai dan booking terkonfirmasi/berlangsung/selesai — tanpa yang dibatalkan atau
                belum dibayar.
              </p>
            </div>
          </div>
          <Link to="/admin/transaksi" className="hidden items-center gap-1 text-sm font-semibold text-brand-burgundy hover:underline sm:flex">
            Lihat semua <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {summary ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <PeriodColumn title="Hari ini" data={summary.today} />
            <PeriodColumn title="Minggu ini (sejak Senin)" data={summary.week} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-secondary">Ringkasan transaksi tidak dapat dimuat saat ini.</p>
        )}
      </Card>
    </div>
  );
}
