import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PawLoader from '../decorative/PawLoader';
import Button from '../Button';

// Guards /dashboard/toko/* (statusField = sellerStatus) and
// /dashboard/jasa/* (statusField = providerStatus). Only users with an
// approved ("active") application can reach the dashboard; anyone mid-review
// is routed to the application-status page.
export default function DashboardRoute({ statusField }) {
  const { user, isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  // Same restore-delay issue as ProtectedRoute — wait for Supabase to
  // finish checking for an existing session before deciding to bounce
  // someone out, otherwise a page refresh here briefly reads "not logged
  // in" even for an approved seller/provider.
  if (isLoading) {
    return <PawLoader label="Memuat..." />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const status = user?.[statusField] || 'none';
  const isService = statusField === 'providerStatus';
  const isSeller = user?.role === 'seller';
  const isProvider = user?.role === 'service';
  // An account whose role already matches the dashboard it's trying to open
  // (seller → /dashboard/toko, service → /dashboard/jasa). For those, 'none'
  // is a *legacy/inconsistent* state, not a missing application.
  const roleMatchesTarget = isService ? isProvider : isSeller;

  if (status === 'none') {
    // A logged-in account whose role is already seller/service but whose
    // application status was never written ('none'). This used to
    // <Navigate to="/register/partner">, which is a dead-end for an account
    // that already exists (and reading as a redirect loop). Show a clear
    // message with an escape route instead — legacy/inconsistent accounts
    // are fixed via supabase/backfill_partner_status.sql or by an admin
    // approving them from /admin/mitra.
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            {roleMatchesTarget ? 'Status mitra belum tercatat' : 'Belum ada pengajuan mitra'}
          </h1>
          {roleMatchesTarget ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Akun Anda sudah terdaftar sebagai {isService ? 'penyedia jasa' : 'penjual produk'},
                tetapi status pengajuannya tidak tercatat di database — biasanya ini terjadi pada akun
                lama yang dibuat sebelum migrasi admin diterapkan. Status ini tidak bisa diperbaiki
                dengan mendaftar ulang (email sudah terpakai).
              </p>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Hubungi admin FurKeeper untuk memulihkan akses dashboard ini. Admin cukup menyetujui
                akun Anda dari{' '}
                <Link to="/admin/mitra" className="font-medium text-brand-burgundy hover:underline">
                  Panel Mitra
                </Link>{' '}
                (filter "{'Belum tercatat'}") atau menjalankan{' '}
                <code className="rounded bg-gray-100 px-1 py-0.5">supabase/backfill_partner_status.sql</code>.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Akun ini belum memiliki pengajuan {isService ? 'penyedia jasa' : 'penjual produk'} yang
              tercatat di database. Daftarkan akun mitra untuk mulai berjualan/melayani di FurKeeper.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!roleMatchesTarget && (
              <Link to="/register/partner">
                <Button variant="orange" playful={false}>Ajukan Pengajuan</Button>
              </Link>
            )}
            <Link to="/">
              <Button variant="outline" playful={false}>Kembali ke Beranda</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (status === 'pending' || status === 'rejected') {
    return <Navigate to="/status-pengajuan" replace />;
  }

  return <Outlet />;
}
