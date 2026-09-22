import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Input from '../Input';
import Select from '../Select';
import Textarea from '../Textarea';
import Button from '../Button';
import ImagePlaceholder from '../ImagePlaceholder';
import { serviceTypeOptions } from '../../data/mockDashboard';

const emptyForm = {
  name: '',
  serviceType: serviceTypeOptions[0],
  price: '',
  duration: '',
  status: 'aktif',
  description: '',
};

export default function ServiceFormModal({ open, initialService, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(
        initialService
          ? {
              name: initialService.name || '',
              serviceType: initialService.serviceType || serviceTypeOptions[0],
              price: String(initialService.price ?? ''),
              duration: initialService.duration || '',
              status: initialService.status || 'aktif',
              description: initialService.description || '',
            }
          : emptyForm,
      );
      setImageFile(null);
      setImagePreview(initialService?.imageUrl || null);
      setErrors({});
    }
  }, [open, initialService]);

  if (!open) return null;

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handlePickImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Nama layanan wajib diisi';
    if (!form.price || Number(form.price) <= 0) nextErrors.price = 'Harga wajib diisi';
    if (!form.duration.trim()) nextErrors.duration = 'Estimasi durasi wajib diisi';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        serviceType: form.serviceType,
        price: Number(form.price),
        duration: form.duration.trim(),
        status: form.status,
        description: form.description.trim(),
        imageFile,
      });
    } catch (err) {
      setErrors({ form: err.message || 'Gagal menyimpan layanan, coba lagi.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-text-primary">
            {initialService ? 'Edit Layanan' : 'Tambah Layanan'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Pratinjau foto layanan"
              className="h-16 w-16 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <ImagePlaceholder className="h-16 w-16 shrink-0 rounded-xl" alt="Foto layanan" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePickImage}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            playful={false}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? 'Ganti Foto' : 'Unggah Foto'}
          </Button>
        </div>

        <div className="space-y-4">
          <Input label="Nama Layanan" required value={form.name} onChange={set('name')} error={errors.name} />
          <Select label="Jenis Layanan" options={serviceTypeOptions} value={form.serviceType} onChange={set('serviceType')} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Harga (Rp)"
              type="number"
              required
              value={form.price}
              onChange={set('price')}
              error={errors.price}
            />
            <Input
              label="Estimasi Durasi"
              placeholder="mis. 60 menit"
              required
              value={form.duration}
              onChange={set('duration')}
              error={errors.duration}
            />
          </div>
          <Select
            label="Status"
            options={[
              { value: 'aktif', label: 'Aktif' },
              { value: 'nonaktif', label: 'Nonaktif' },
            ]}
            value={form.status}
            onChange={set('status')}
          />
          <Textarea
            label="Deskripsi"
            rows={3}
            value={form.description}
            onChange={set('description')}
            placeholder="Rincian layanan, alat & produk yang digunakan, dsb."
          />
          {errors.form && (
            <div className="rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger" role="alert">
              {errors.form}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} playful={false}>
            Batal
          </Button>
          <Button type="submit" variant="orange" className="flex-1" playful={false} loading={isSaving}>
            {initialService ? 'Simpan Perubahan' : 'Tambah Layanan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
