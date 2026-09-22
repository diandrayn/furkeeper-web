import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Input from '../Input';
import Select from '../Select';
import Textarea from '../Textarea';
import Button from '../Button';
import ImagePlaceholder from '../ImagePlaceholder';
import { productCategories, petTypeOptions } from '../../data/mockDashboard';

const emptyForm = {
  name: '',
  category: productCategories[0],
  petType: petTypeOptions[0],
  price: '',
  originalPrice: '',
  stock: '',
  status: 'aktif',
  description: '',
};

export default function ProductFormModal({ open, initialProduct, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(
        initialProduct
          ? {
              name: initialProduct.name || '',
              category: initialProduct.category || productCategories[0],
              petType: initialProduct.petType || petTypeOptions[0],
              price: String(initialProduct.price ?? ''),
              originalPrice: initialProduct.originalPrice ? String(initialProduct.originalPrice) : '',
              stock: String(initialProduct.stock ?? ''),
              status: initialProduct.status || 'aktif',
              description: initialProduct.description || '',
            }
          : emptyForm,
      );
      setImageFile(null);
      // Show the product's existing photo (if editing) until the seller
      // picks a new one.
      setImagePreview(initialProduct?.imageUrl || null);
      setErrors({});
    }
  }, [open, initialProduct]);

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
    if (!form.name.trim()) nextErrors.name = 'Nama produk wajib diisi';
    if (!form.price || Number(form.price) <= 0) nextErrors.price = 'Harga wajib diisi';
    if (form.stock === '' || Number(form.stock) < 0) nextErrors.stock = 'Stok wajib diisi';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const stockNum = Number(form.stock);
    setIsSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        category: form.category,
        petType: form.petType,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        stock: stockNum,
        status: stockNum === 0 ? 'habis' : form.status,
        description: form.description.trim(),
        imageFile,
      });
    } catch (err) {
      setErrors({ form: err.message || 'Gagal menyimpan produk, coba lagi.' });
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
            {initialProduct ? 'Edit Produk' : 'Tambah Produk'}
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
              alt="Pratinjau foto produk"
              className="h-16 w-16 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <ImagePlaceholder className="h-16 w-16 shrink-0 rounded-xl" alt="Foto produk" />
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
          <Input label="Nama Produk" required value={form.name} onChange={set('name')} error={errors.name} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Kategori" options={productCategories} value={form.category} onChange={set('category')} />
            <Select label="Jenis Hewan" options={petTypeOptions} value={form.petType} onChange={set('petType')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Harga Jual (Rp)"
              type="number"
              required
              value={form.price}
              onChange={set('price')}
              error={errors.price}
            />
            <Input
              label="Harga Coret (opsional)"
              type="number"
              value={form.originalPrice}
              onChange={set('originalPrice')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Stok"
              type="number"
              required
              value={form.stock}
              onChange={set('stock')}
              error={errors.stock}
            />
            <Select
              label="Status"
              options={[
                { value: 'aktif', label: 'Aktif' },
                { value: 'nonaktif', label: 'Nonaktif' },
              ]}
              value={form.status}
              onChange={set('status')}
            />
          </div>
          <Textarea
            label="Deskripsi"
            rows={3}
            value={form.description}
            onChange={set('description')}
            placeholder="Bahan, ukuran, cara pakai, dsb."
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
            {initialProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </div>
      </form>
    </div>
  );
}
