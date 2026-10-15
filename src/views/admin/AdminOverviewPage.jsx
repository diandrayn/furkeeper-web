import { useEffect, useState } from 'react';
import { Link } from '@/lib/router';
import { Users, UserCheck, Package, Scissors, Star, ShieldAlert, Store, Mail } from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import AdminOverviewExtras from '../../components/admin/AdminOverviewExtras';
import Card from '../../components/Card';
import PawLoader from '../../components/decorative/PawLoader';
import { fetchAdminStats } from '../../utils/admin';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchAdminStats()
      .then((data) => active && setStats(data))
      .catch((err) => {
        console.error('fetchAdminStats failed:', err);
        if (active) setError(err);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!stats && !error) return <PawLoader label="Memuat ringkasan..." />;

  if (error) {
    return (
      <Card>
        <p className="text-sm text-status-danger">
          Gagal memuat data admin. Pastikan migrasi{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">supabase/admin_panel.sql</code> sudah dijalankan
          dan akun ini sudah dipromosikan menjadi <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">admin</code>.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {stats.pendingApplications > 0 && (
        <Link
          to="/admin/mitra"
          className="flex items-center justify-between rounded-2xl bg-status-warning/20 px-5 py-4 text-sm font-medium text-[#8a6d1f] transition-opacity hover:opacity-90"
        >
          <span>
            Ada <strong>{stats.pendingApplications}</strong> pendaftaran mitra menunggu persetujuan.
          </span>
          <span className="font-semibold underline">Tinjau sekarang</span>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Pengguna" value={stats.totalUsers} hint={`${stats.totalBuyers} pembeli`} tone="burgundy" />
        <StatCard
          icon={UserCheck}
          label="Pendaftaran Menunggu"
          value={stats.pendingApplications}
          hint="Perlu approval admin"
          tone="warning"
        />
        <StatCard icon={Store} label="Total Toko/Mitra" value={stats.totalStores} hint={`${stats.totalSellers} penjual, ${stats.totalProviders} penyedia jasa`} tone="orange" />
        <StatCard icon={ShieldAlert} label="Akun Disuspend" value={stats.suspended} hint="Pelanggaran ketentuan" tone="warning" />
        <StatCard
          icon={Package}
          label="Total Produk"
          value={stats.totalProducts}
          hint={`${stats.activeProducts} aktif`}
          tone="burgundy"
        />
        <StatCard
          icon={Scissors}
          label="Total Jasa Grooming"
          value={stats.totalServices}
          hint={`${stats.activeServices} aktif`}
          tone="burgundy"
        />
        <StatCard icon={Star} label="Total Ulasan" value={stats.totalReviews} hint="Produk & jasa" tone="success" />
        <StatCard
          icon={Mail}
          label="Pesan Bantuan"
          value={stats.unreadHelpMessages}
          hint="Belum dibalas"
          tone={stats.unreadHelpMessages > 0 ? 'warning' : 'success'}
        />
      </div>

      <AdminOverviewExtras stats={stats} />

      <Card>
        <h2 className="font-heading text-base font-bold text-text-primary">Tentang panel ini</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Panel Admin ini menggantikan proses manual melalui Supabase Studio untuk approval mitra, moderasi listing
          produk/jasa, moderasi ulasan, dan suspend akun — sesuai kewenangan Admin pada PRD Bab 5 &amp; 8.
        </p>
      </Card>
    </div>
  );
}
