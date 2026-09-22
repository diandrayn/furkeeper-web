import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldOff, ShieldCheck } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Textarea from '../../components/Textarea';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PawLoader from '../../components/decorative/PawLoader';
import { fetchAllUsers, setUserSuspended } from '../../utils/admin';
import { getInitials, formatDateId } from '../../utils/status';

const PAGE_SIZE = 8;

const ROLE_OPTIONS = [
  { value: 'all', label: 'Semua Peran' },
  { value: 'buyer', label: 'Pembeli' },
  { value: 'seller', label: 'Penjual Produk' },
  { value: 'service', label: 'Penyedia Jasa' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_LABELS = { buyer: 'Pembeli', seller: 'Penjual Produk', service: 'Penyedia Jasa', admin: 'Admin' };

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [suspending, setSuspending] = useState(null); // user object
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setIsLoading(true);
    fetchAllUsers({ search: query, role })
      .then(setUsers)
      .catch((err) => {
        console.error('fetchAllUsers failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, role]);

  useEffect(() => setPage(1), [query, role]);

  const pageItems = useMemo(() => users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [users, page]);

  const handleUnsuspend = async (user) => {
    setBusyId(user.id);
    try {
      await setUserSuspended(user.id, false, null, user.fullName);
      load();
    } catch (err) {
      console.error('unsuspend failed:', err);
      window.alert('Gagal mengaktifkan akun.');
    } finally {
      setBusyId(null);
    }
  };

  const submitSuspend = async () => {
    if (!suspending) return;
    setBusyId(suspending.id);
    try {
      await setUserSuspended(suspending.id, true, reason, suspending.fullName);
      setSuspending(null);
      setReason('');
      load();
    } catch (err) {
      console.error('suspend failed:', err);
      window.alert('Gagal men-suspend akun.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="flex-1"
          placeholder="Cari nama atau email..."
          icon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select className="sm:w-52" value={role} onChange={(e) => setRole(e.target.value)} options={ROLE_OPTIONS} />
      </div>

      {isLoading && <PawLoader label="Memuat pengguna..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">Gagal memuat data. Pastikan migrasi admin sudah dijalankan.</p>
        </Card>
      )}

      {!isLoading && !error && users.length === 0 && (
        <EmptyState title="Tidak ada pengguna" subtitle="Coba ubah kata kunci atau filter peran." />
      )}

      {!isLoading && !error && users.length > 0 && (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {pageItems.map((user) => (
                <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-burgundy text-xs font-bold text-white">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        getInitials(user.fullName)
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{user.fullName}</p>
                      <p className="text-xs text-text-secondary">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="optional" label={ROLE_LABELS[user.role] || user.role} />
                    {user.isSuspended ? (
                      <Badge variant="rejected" label="Disuspend" />
                    ) : (
                      <span className="hidden text-xs text-text-secondary sm:inline">
                        Sejak {formatDateId(user.createdAt)}
                      </span>
                    )}
                  </div>

                  {user.role !== 'admin' &&
                    (user.isSuspended ? (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<ShieldCheck className="h-4 w-4" />}
                        loading={busyId === user.id}
                        onClick={() => handleUnsuspend(user)}
                        playful={false}
                      >
                        Aktifkan
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<ShieldOff className="h-4 w-4" />}
                        className="!border-status-danger !text-status-danger hover:!bg-status-danger/5"
                        disabled={busyId === user.id}
                        onClick={() => {
                          setSuspending(user);
                          setReason('');
                        }}
                        playful={false}
                      >
                        Suspend
                      </Button>
                    ))}
                </div>
              ))}
            </div>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={users.length} itemLabel="pengguna" onPageChange={setPage} />
        </>
      )}

      {suspending && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={() => setSuspending(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
            <h2 className="font-heading text-lg font-bold text-text-primary">Suspend {suspending.fullName}?</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Akun tidak akan bisa masuk sampai diaktifkan kembali. Alasan akan dikirim sebagai notifikasi.
            </p>
            <Textarea
              className="mt-3"
              rows={3}
              placeholder="Contoh: Terindikasi ulasan palsu."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSuspending(null)} playful={false}>
                Batal
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-status-danger hover:!bg-status-danger/90"
                onClick={submitSuspend}
                loading={busyId === suspending.id}
                playful={false}
              >
                Suspend Akun
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
