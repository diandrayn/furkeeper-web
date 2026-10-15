import { useEffect, useState } from 'react';
import { Link } from '@/lib/router';
import { FileText, Plus, Pencil, Trash2, Wallet, ArrowRight } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import PawLoader from '../../components/decorative/PawLoader';
import {
  fetchAllPlatformContent,
  savePlatformContent,
  deletePlatformContent,
  slugifyContentKey,
} from '../../utils/admin';
import { formatDateId } from '../../utils/status';

export default function AdminSettingsPage() {
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // { key, title, body, isNew }
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  const load = () => {
    setIsLoading(true);
    fetchAllPlatformContent()
      .then(setBlocks)
      .catch((err) => {
        console.error('fetchAllPlatformContent failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const startEdit = (block) => setEditing({ key: block.key, title: block.title, body: block.body, isNew: false });
  const startNew = () => setEditing({ key: null, title: '', body: '', isNew: true });

  const handleSave = async () => {
    if (!editing.title.trim()) return;
    const key = editing.isNew ? slugifyContentKey(editing.title) : editing.key;
    if (!key) return;
    setSaving(true);
    try {
      await savePlatformContent(key, { title: editing.title.trim(), body: editing.body }, editing.isNew);
      setEditing(null);
      load();
    } catch (err) {
      console.error('savePlatformContent failed:', err);
      window.alert('Gagal menyimpan konten. Pastikan judul belum dipakai konten lain.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyKey(deleteTarget.key);
    try {
      await deletePlatformContent(deleteTarget.key, deleteTarget.title);
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('deletePlatformContent failed:', err);
      window.alert('Gagal menghapus konten.');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange-end/15 text-brand-orange-end">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-text-primary">Biaya komisi & pencairan dana</p>
            <p className="text-xs text-text-secondary">Diatur dari menu Keuangan, bukan di sini.</p>
          </div>
        </div>
        <Link
          to="/admin/keuangan"
          className="flex items-center gap-1 text-sm font-semibold text-brand-burgundy hover:underline"
        >
          Buka Kelola Keuangan <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-base font-bold text-text-primary">Konten Statis</h2>
          <p className="text-sm text-text-secondary">
            Syarat & Ketentuan, Kebijakan Privasi, Kebijakan Pembatalan, dan konten lain — perubahan langsung tayang
            tanpa perlu deploy ulang.
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={startNew}>
          Tambah Konten
        </Button>
      </div>

      {isLoading && <PawLoader label="Memuat konten..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">
            Gagal memuat data. Pastikan migrasi{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">supabase/platform_content_migration.sql</code>{' '}
            sudah dijalankan.
          </p>
        </Card>
      )}

      {!isLoading && !error && blocks.length === 0 && (
        <EmptyState title="Belum ada konten" subtitle="Tambahkan konten pertama lewat tombol di atas." />
      )}

      {!isLoading && !error && blocks.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {blocks.map((block) => (
              <div key={block.key} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-peach text-brand-burgundy">
                    <FileText className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{block.title}</p>
                    <p className="text-xs text-text-secondary">
                      {block.body.trim() ? `Diubah ${formatDateId(block.updatedAt)}` : 'Belum diisi — halaman publik memakai teks bawaan'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => startEdit(block)} playful={false}>
                    Ubah
                  </Button>
                  {!block.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Trash2 className="h-4 w-4" />}
                      className="!border-status-danger !text-status-danger hover:!bg-status-danger/5"
                      disabled={busyKey === block.key}
                      onClick={() => setDeleteTarget(block)}
                      playful={false}
                    >
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {editing && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
            <h2 className="font-heading text-lg font-bold text-text-primary">
              {editing.isNew ? 'Tambah Konten Baru' : `Ubah "${editing.title}"`}
            </h2>
            <div className="mt-4 space-y-3">
              <Input
                label="Judul"
                placeholder="Contoh: Kebijakan Pengembalian Dana"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                disabled={!editing.isNew}
              />
              <Textarea
                label="Isi Konten"
                rows={10}
                placeholder="Tulis isi konten di sini. Pisahkan antar-paragraf dengan baris kosong."
                value={editing.body}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              />
              <div className="rounded-xl bg-brand-peach/50 px-3.5 py-3 text-xs leading-relaxed text-text-secondary">
                <p className="font-semibold text-brand-burgundy">Format yang didukung halaman publik:</p>
                <ul className="mt-1.5 list-inside list-disc space-y-0.5">
                  <li>
                    <code className="rounded bg-white px-1 py-0.5 font-mono">## Judul</code> — mulai bagian baru
                    (daftar isi & penomoran otomatis dibuat dari ini)
                  </li>
                  <li>
                    <code className="rounded bg-white px-1 py-0.5 font-mono">- item</code> — poin berbutir
                  </li>
                  <li>
                    <code className="rounded bg-white px-1 py-0.5 font-mono">1. item</code> — daftar bernomor
                  </li>
                  <li>Teks lain — paragraf. Tanpa <code className="rounded bg-white px-1 py-0.5 font-mono">##</code>{' '}
                    sama sekali, seluruh isi jadi satu bagian.</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(null)} playful={false}>
                Batal
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving} disabled={!editing.title.trim()} playful={false}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Hapus "${deleteTarget?.title}"?`}
        description="Konten ini akan dihapus. Halaman publik yang memakainya akan kembali menampilkan teks bawaan (jika ada)."
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
