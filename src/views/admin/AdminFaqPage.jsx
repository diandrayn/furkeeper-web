import { useEffect, useState } from 'react';
import { HelpCircle, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import PawLoader from '../../components/decorative/PawLoader';
import { fetchAllFaqs, saveFaq, deleteFaq, moveFaq } from '../../utils/admin';

const EMPTY_FORM = { id: null, category: 'Umum', question: '', answer: '', isPublished: true };

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // form object, see EMPTY_FORM
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    fetchAllFaqs()
      .then(setFaqs)
      .catch((err) => {
        console.error('fetchAllFaqs failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const canSave = editing && editing.question.trim() && editing.answer.trim();

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveFaq(editing);
      setEditing(null);
      load();
    } catch (err) {
      console.error('saveFaq failed:', err);
      window.alert('Gagal menyimpan FAQ. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (faq) => {
    setBusyId(faq.id);
    try {
      await saveFaq({ ...faq, isPublished: !faq.isPublished });
      load();
    } catch (err) {
      console.error('saveFaq (toggle) failed:', err);
      window.alert('Gagal mengubah status tayang FAQ.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (faq, direction) => {
    setBusyId(faq.id);
    try {
      await moveFaq(faqs, faq.id, direction);
      load();
    } catch (err) {
      console.error('moveFaq failed:', err);
      window.alert('Gagal mengubah urutan FAQ.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteFaq(deleteTarget.id, deleteTarget.question);
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('deleteFaq failed:', err);
      window.alert('Gagal menghapus FAQ.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-base font-bold text-text-primary">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-sm text-text-secondary">
            FAQ yang tampil di halaman Pusat Bantuan. Selama belum ada FAQ yang diterbitkan di sini, halaman publik memakai
            daftar bawaan.
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ ...EMPTY_FORM })}>
          Tambah FAQ
        </Button>
      </div>

      {isLoading && <PawLoader label="Memuat FAQ..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">
            Gagal memuat data. Pastikan migrasi{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">supabase/faq_migration.sql</code> sudah dijalankan.
          </p>
        </Card>
      )}

      {!isLoading && !error && faqs.length === 0 && (
        <EmptyState title="Belum ada FAQ" subtitle="Tambahkan FAQ pertama lewat tombol di atas." />
      )}

      {!isLoading && !error && faqs.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {faqs.map((faq, index) => (
              <div key={faq.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-peach text-brand-burgundy">
                    <HelpCircle className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{faq.question}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{faq.answer}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium">{faq.category}</span>
                      <span className={faq.isPublished ? 'font-medium text-green-700' : 'font-medium text-amber-700'}>
                        {faq.isPublished ? 'Tayang' : 'Draf (tidak tayang)'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<ArrowUp className="h-4 w-4" />}
                    disabled={busyId === faq.id || index === 0}
                    onClick={() => handleMove(faq, 'up')}
                    playful={false}
                    aria-label="Naikkan urutan"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<ArrowDown className="h-4 w-4" />}
                    disabled={busyId === faq.id || index === faqs.length - 1}
                    onClick={() => handleMove(faq, 'down')}
                    playful={false}
                    aria-label="Turunkan urutan"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    icon={faq.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    disabled={busyId === faq.id}
                    onClick={() => togglePublished(faq)}
                    playful={false}
                  >
                    {faq.isPublished ? 'Sembunyikan' : 'Tayangkan'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={() => setEditing({ ...faq })}
                    playful={false}
                  >
                    Ubah
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Trash2 className="h-4 w-4" />}
                    className="!border-status-danger !text-status-danger hover:!bg-status-danger/5"
                    disabled={busyId === faq.id}
                    onClick={() => setDeleteTarget(faq)}
                    playful={false}
                  >
                    Hapus
                  </Button>
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
              {editing.id ? 'Ubah FAQ' : 'Tambah FAQ Baru'}
            </h2>
            <div className="mt-4 space-y-3">
              <Input
                label="Kategori"
                placeholder="Contoh: Pembayaran, Pengiriman, Akun"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              />
              <Input
                label="Pertanyaan"
                placeholder="Contoh: Bagaimana cara membatalkan pesanan?"
                value={editing.question}
                onChange={(e) => setEditing({ ...editing, question: e.target.value })}
              />
              <Textarea
                label="Jawaban"
                rows={7}
                placeholder="Tulis jawaban lengkap di sini."
                value={editing.answer}
                onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={editing.isPublished}
                  onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Tayangkan di Pusat Bantuan
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(null)} playful={false}>
                Batal
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving} disabled={!canSave} playful={false}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus FAQ ini?"
        description={deleteTarget ? `"${deleteTarget.question}" akan dihapus permanen dari Pusat Bantuan.` : ''}
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
