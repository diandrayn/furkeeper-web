import { useEffect, useState } from 'react';
import { Check, X, Store, Scissors, Mail, Calendar } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import EmptyState from '../../components/EmptyState';
import PawLoader from '../../components/decorative/PawLoader';
import { fetchPartnerApplications, reviewPartnerApplication } from '../../utils/admin';
import { formatDateId } from '../../utils/status';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'none', label: 'Belum tercatat' },
  { value: 'all', label: 'Semua' },
];

function applicationsForUser(user) {
  // A profile can carry a seller application, a service application, or
  // (in theory) both — the panel shows them as separate cards since
  // approval is per-role. Status 'none' is included too: those are
  // legacy/inconsistent mitra accounts (role sudah seller/service tapi
  // status kolomnya tidak pernah terisi — lihat
  // supabase/backfill_partner_status.sql / diagnostic_partner_status.sql).
  // Tanpa kartu ini admin tidak bisa melihat apalagi memulihkannya.
  const apps = [];
  if (user.role === 'seller') {
    apps.push({ type: 'seller', status: user.sellerStatus });
  } else if (user.role === 'service') {
    apps.push({ type: 'service', status: user.providerStatus });
  }
  return apps;
}

export default function AdminPartnersPage() {
  const [status, setStatus] = useState('pending');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null); // { userId, type }
  const [reason, setReason] = useState('');

  const load = () => {
    setIsLoading(true);
    fetchPartnerApplications({ status })
      .then(setUsers)
      .catch((err) => {
        console.error('fetchPartnerApplications failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [status]);

  const handleApprove = async (userId, type, userLabel) => {
    setBusyId(`${userId}-${type}`);
    try {
      await reviewPartnerApplication(userId, type, 'approved', null, userLabel);
      load();
    } catch (err) {
      console.error('approve failed:', err);
      window.alert('Gagal menyetujui pendaftaran. Coba lagi.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejecting) return;
    setBusyId(`${rejecting.userId}-${rejecting.type}`);
    try {
      await reviewPartnerApplication(rejecting.userId, rejecting.type, 'rejected', reason, rejecting.label);
      setRejecting(null);
      setReason('');
      load();
    } catch (err) {
      console.error('reject failed:', err);
      window.alert('Gagal menolak pendaftaran. Coba lagi.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">Approval pendaftaran Penjual Produk &amp; Penyedia Jasa.</p>
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
      </div>

      {isLoading && <PawLoader label="Memuat pendaftaran..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">Gagal memuat data. Pastikan migrasi admin sudah dijalankan.</p>
        </Card>
      )}

      {!isLoading && !error && users.length === 0 && (
        <EmptyState title="Tidak ada pendaftaran" subtitle="Belum ada pengajuan mitra dengan status ini." />
      )}

      {!isLoading &&
        !error &&
        users.map((user) =>
          applicationsForUser(user).map((app) => {
            const key = `${user.id}-${app.type}`;
            const isBusy = busyId === key;
            return (
              <Card key={key} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-peach text-brand-burgundy">
                        {app.type === 'service' ? <Scissors className="h-4.5 w-4.5" /> : <Store className="h-4.5 w-4.5" />}
                      </span>
                      <div>
                        <p className="font-heading text-base font-bold text-text-primary">
                          {user.business?.businessName || user.fullName}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {app.type === 'service' ? 'Penyedia Jasa Grooming' : 'Penjual Produk'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={app.status === 'approved' ? 'active' : app.status === 'rejected' ? 'rejected' : 'pending'}
                    label={
                      app.status === 'approved'
                        ? 'Disetujui'
                        : app.status === 'rejected'
                          ? 'Ditolak'
                          : app.status === 'none'
                            ? 'Belum tercatat'
                            : 'Menunggu'
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-text-secondary sm:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" /> {user.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {user.partnerSubmittedAt ? formatDateId(user.partnerSubmittedAt) : '-'}
                  </p>
                  {user.business?.businessAddress && (
                    <p className="sm:col-span-2">Alamat: {user.business.businessAddress}</p>
                  )}
                </div>

                {app.status === 'none' && (
                  <p className="rounded-xl bg-status-warning/15 px-3 py-2 text-xs text-text-primary">
                    Akun mitra lama tanpa status tercatat — biasanya sudah punya toko tapi statusnya
                    tidak tersinkron (sebelum migrasi admin diterapkan). Menyetujui akan langsung
                    memulihkan akses dashboard akun ini. Alternatif: jalankan
                    <code className="mx-1 rounded bg-gray-100 px-1 py-0.5">supabase/backfill_partner_status.sql</code>.
                  </p>
                )}

                {(app.status === 'pending' || app.status === 'none') && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Check className="h-4 w-4" />}
                      loading={isBusy}
                      onClick={() => handleApprove(user.id, app.type, user.business?.businessName || user.fullName)}
                    >
                      Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<X className="h-4 w-4" />}
                      className="!border-status-danger !text-status-danger hover:!bg-status-danger/5"
                      disabled={isBusy}
                      onClick={() => {
                        setRejecting({ userId: user.id, type: app.type });
                        setReason('');
                      }}
                    >
                      Tolak
                    </Button>
                  </div>
                )}
              </Card>
            );
          }),
        )}

      {rejecting && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={() => setRejecting(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
            <h2 className="font-heading text-lg font-bold text-text-primary">Tolak pendaftaran</h2>
            <p className="mt-1 text-sm text-text-secondary">Alasan ini akan dikirim ke pemohon sebagai notifikasi.</p>
            <Textarea
              className="mt-3"
              rows={3}
              placeholder="Contoh: Dokumen bisnis tidak lengkap/tidak sesuai."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejecting(null)} playful={false}>
                Batal
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-status-danger hover:!bg-status-danger/90"
                onClick={submitReject}
                loading={busyId === `${rejecting.userId}-${rejecting.type}`}
                playful={false}
              >
                Tolak Pendaftaran
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
