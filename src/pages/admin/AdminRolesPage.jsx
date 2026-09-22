import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, ShieldCheck, ShieldOff } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import PawLoader from '../../components/decorative/PawLoader';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchAllAdmins,
  searchPromotableUsers,
  promoteToAdmin,
  setAdminScope,
  demoteAdmin,
  ADMIN_SCOPE_LABELS,
  ADMIN_SCOPE_DESCRIPTIONS,
} from '../../utils/admin';
import { getInitials, formatDateId } from '../../utils/status';

const SCOPE_OPTIONS = Object.entries(ADMIN_SCOPE_LABELS).map(([value, label]) => ({ value, label }));
const ROLE_LABELS = { buyer: 'Pembeli', seller: 'Penjual Produk', service: 'Penyedia Jasa' };

/** Pesan penolakan dari trigger database ditampilkan apa adanya; sisanya generik. */
function friendlyError(err, fallback) {
  const message = err?.message || '';
  if (message.startsWith('Harus tersisa') || message.startsWith('Admin tidak dapat') || message.startsWith('Hanya admin')) {
    return message;
  }
  return fallback;
}

function Avatar({ name, url }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-burgundy text-xs font-bold text-white">
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
    </span>
  );
}

function AddAdminDialog({ open, onClose, onAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [scope, setScope] = useState('approval');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    setSelected(null);
    setScope('approval');
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      return undefined;
    }
    let active = true;
    setSearching(true);
    const timer = setTimeout(() => {
      searchPromotableUsers(query)
        .then((rows) => active && setResults(rows))
        .catch((err) => console.error('searchPromotableUsers failed:', err))
        .finally(() => active && setSearching(false));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await promoteToAdmin(selected.id, scope, selected.fullName);
      onAdded();
    } catch (err) {
      console.error('promoteToAdmin failed:', err);
      window.alert(friendlyError(err, 'Gagal menambahkan admin. Coba lagi.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <h2 className="font-heading text-lg font-bold text-text-primary">Tambah admin</h2>
        <p className="mt-1 text-sm text-text-secondary">Cari akun yang sudah terdaftar, lalu pilih hak aksesnya. Orangnya akan diberi tahu lewat notifikasi.</p>

        {!selected && (
          <div className="mt-4 space-y-3">
            <Input
              placeholder="Cari nama atau email..."
              icon={<Search className="h-4 w-4" />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {searching && <p className="text-xs text-text-secondary">Mencari...</p>}
            {!searching && query.trim() && results.length === 0 && (
              <p className="text-sm text-text-secondary">Tidak ada akun non-admin yang cocok.</p>
            )}
            {results.length > 0 && (
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                {results.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    disabled={user.isSuspended}
                    onClick={() => setSelected(user)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors duration-150 hover:bg-brand-peach/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Avatar name={user.fullName} url={user.avatarUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text-primary">{user.fullName}</span>
                      <span className="block truncate text-xs text-text-secondary">{user.email}</span>
                    </span>
                    {user.isSuspended ? (
                      <Badge variant="rejected" label="Disuspend" />
                    ) : (
                      <Badge variant="optional" label={ROLE_LABELS[user.role] || user.role} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selected && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-brand-peach/40 p-3">
              <Avatar name={selected.fullName} url={selected.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{selected.fullName}</p>
                <p className="truncate text-xs text-text-secondary">{selected.email}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-xs font-semibold text-brand-burgundy hover:underline">
                Ganti
              </button>
            </div>
            <Select label="Hak akses" value={scope} onChange={(e) => setScope(e.target.value)} options={SCOPE_OPTIONS} />
            <p className="text-xs text-text-secondary">{ADMIN_SCOPE_DESCRIPTIONS[scope]}</p>
            {selected.role !== 'buyer' && (
              <p className="rounded-xl bg-status-warning/20 p-3 text-xs text-text-primary">
                Akun ini saat ini {ROLE_LABELS[selected.role] || selected.role}. Perannya akan diganti menjadi admin, dan jika aksesnya dicabut nanti, akun kembali menjadi pembeli biasa, bukan {ROLE_LABELS[selected.role] || selected.role}.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} playful={false}>
            Batal
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleConfirm} loading={saving} disabled={!selected} playful={false}>
            Jadikan admin
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRolesPage() {
  const { user: me } = useAuth();
  const [query, setQuery] = useState('');
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [demoteTarget, setDemoteTarget] = useState(null);

  const load = () => {
    setIsLoading(true);
    fetchAllAdmins()
      .then((rows) => {
        setAdmins(rows);
        setError(null);
      })
      .catch((err) => {
        console.error('fetchAllAdmins failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return admins;
    return admins.filter((a) => a.fullName.toLowerCase().includes(term) || a.email.toLowerCase().includes(term));
  }, [admins, query]);

  const handleScopeChange = async (admin, scope) => {
    if (scope === admin.scope) return;
    setBusyId(admin.id);
    try {
      await setAdminScope(admin.id, scope, admin.fullName);
      load();
    } catch (err) {
      console.error('setAdminScope failed:', err);
      window.alert(friendlyError(err, 'Gagal mengubah hak akses.'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDemote = async () => {
    if (!demoteTarget) return;
    setBusyId(demoteTarget.id);
    try {
      await demoteAdmin(demoteTarget.id, demoteTarget.fullName);
      setDemoteTarget(null);
      load();
    } catch (err) {
      console.error('demoteAdmin failed:', err);
      setDemoteTarget(null);
      window.alert(friendlyError(err, 'Gagal mencabut akses admin.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {SCOPE_OPTIONS.map((option) => (
          <Card key={option.value} className="!p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <ShieldCheck className="h-4 w-4 text-brand-burgundy" aria-hidden="true" />
              {option.label}
              <span className="text-xs font-medium text-text-secondary">{admins.filter((a) => a.scope === option.value).length}</span>
            </p>
            <p className="mt-1 text-xs text-text-secondary">{ADMIN_SCOPE_DESCRIPTIONS[option.value]}</p>
          </Card>
        ))}
      </div>
      <p className="text-xs text-text-secondary">
        Hak akses menentukan menu dan halaman yang bisa dibuka di panel ini. Semua admin tetap memiliki izin yang sama di level database.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="flex-1"
          placeholder="Cari nama atau email admin..."
          icon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="primary" icon={<UserPlus className="h-4 w-4" />} onClick={() => setAdding(true)} playful={false}>
          Tambah admin
        </Button>
      </div>

      {isLoading && <PawLoader label="Memuat daftar admin..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">
            Gagal memuat data. Pastikan migrasi{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">supabase/admin_roles_migration.sql</code> sudah dijalankan.
          </p>
        </Card>
      )}

      {!isLoading && !error && visible.length === 0 && (
        <EmptyState title="Tidak ada admin" subtitle="Coba ubah kata kunci pencarian." />
      )}

      {!isLoading && !error && visible.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {visible.map((admin) => {
              const isSelf = admin.id === me?.id;
              const busy = busyId === admin.id;
              return (
                <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={admin.fullName} url={admin.avatarUrl} />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text-primary">
                        {admin.fullName}
                        {isSelf && <Badge variant="optional" label="Akun Anda" />}
                        {admin.isSuspended && <Badge variant="rejected" label="Disuspend" />}
                      </p>
                      <p className="truncate text-xs text-text-secondary">
                        {admin.email} · Sejak {formatDateId(admin.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      className="w-44"
                      value={admin.scope}
                      options={SCOPE_OPTIONS}
                      onChange={(e) => handleScopeChange(admin, e.target.value)}
                      name={`scope-${admin.id}`}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<ShieldOff className="h-4 w-4" />}
                      className="!border-status-danger !text-status-danger hover:!bg-status-danger/5"
                      disabled={isSelf || busy}
                      onClick={() => setDemoteTarget(admin)}
                      playful={false}
                    >
                      Cabut
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <AddAdminDialog
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={() => {
          setAdding(false);
          load();
        }}
      />

      <ConfirmDialog
        open={Boolean(demoteTarget)}
        title="Cabut akses admin?"
        description={demoteTarget ? `${demoteTarget.fullName} akan kembali menjadi pembeli biasa dan tidak bisa membuka panel admin lagi.` : ''}
        confirmLabel="Cabut akses"
        onConfirm={confirmDemote}
        onCancel={() => setDemoteTarget(null)}
      />
    </div>
  );
}
