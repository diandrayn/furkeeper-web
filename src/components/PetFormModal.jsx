import { useEffect, useState } from 'react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import Textarea from './Textarea';
import ImagePlaceholder from './ImagePlaceholder';

const emptyForm = {
  name: '',
  species: '',
  breed: '',
  age: '',
  weight: '',
  notes: '',
  photoUrl: null,
};

export default function PetFormModal({ open, pet, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      pet
        ? {
            name: pet.name || '',
            species: pet.species || '',
            breed: pet.breed || '',
            age: pet.age || '',
            weight: pet.weight || '',
            notes: pet.notes || '',
            photoUrl: pet.photoUrl || null,
          }
        : emptyForm,
    );
  }, [open, pet]);

  if (!open) return null;

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, photoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.species) return;
    onSave({
      id: pet?.id || `pet-${Date.now()}`,
      ...form,
      name: form.name.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Tutup" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-text-primary">
            {pet ? 'Ubah Data Hewan' : 'Tambah Hewan'}
          </h2>
          <button type="button" onClick={onClose} className="text-sm font-medium text-brand-burgundy">
            Tutup
          </button>
        </div>

        <div className="mb-4 flex items-center gap-4">
          {form.photoUrl ? (
            <img src={form.photoUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
          ) : (
            <ImagePlaceholder className="h-20 w-20 rounded-xl" alt="Pratinjau foto hewan" />
          )}
          <label className="cursor-pointer text-sm font-medium text-brand-burgundy hover:underline">
            Unggah Foto
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>

        <div className="space-y-3">
          <Input label="Nama Hewan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select
            label="Jenis"
            options={['Kucing', 'Anjing', 'Lainnya']}
            value={form.species}
            onChange={(e) => setForm({ ...form, species: e.target.value })}
            required
          />
          <Input label="Ras" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          <Input label="Umur" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Contoh: 2 tahun" />
          <Input label="Berat" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="Contoh: 4 kg" />
          <Textarea
            label="Catatan Kesehatan/Alergi"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Contoh: alergi shampo tertentu"
          />
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSave}>
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
}
