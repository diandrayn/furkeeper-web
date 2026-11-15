import { useState } from 'react';
import Button from './Button';
import AddressFormFields, { emptyAddressForm } from './AddressFormFields';

export default function AddressModal({ open, addresses, selectedId, onSelect, onAdd, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAddressForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleAdd = async () => {
    if (!form.label.trim() || !form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.district) {
      setError('Lengkapi semua informasi alamat terlebih dahulu.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await onAdd({
        id: `addr-${Date.now()}`,
        city: 'Malang',
        ...form,
        label: form.label.trim(),
        name: form.name.trim(),
      });
      setShowForm(false);
      setForm(emptyAddressForm);
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan alamat. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Tutup" disabled={isSaving} onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-text-primary">Pilih Alamat</h2>
          <button type="button" onClick={onClose} disabled={isSaving} className="text-sm font-medium text-brand-burgundy disabled:opacity-50">
            Tutup
          </button>
        </div>

        <div className="space-y-3">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors duration-200 ${
                selectedId === address.id
                  ? 'border-brand-burgundy bg-brand-peach/40'
                  : 'border-gray-200 hover:border-brand-burgundy/30'
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selectedId === address.id}
                onChange={() => onSelect(address.id)}
                className="mt-1 h-4 w-4 text-brand-burgundy"
              />
              <div>
                <p className="text-sm font-bold text-text-primary">
                  {address.name} <span className="font-medium text-text-secondary">({address.label})</span>
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {address.address}, Kecamatan {address.district}
                </p>
                <p className="text-sm text-text-secondary">{address.phone}</p>
              </div>
            </label>
          ))}
        </div>

        {showForm ? (
          <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-4">
            <AddressFormFields
              form={form}
              onChange={(nextForm) => {
                setForm(nextForm);
                setError('');
              }}
              idPrefix="checkout-address"
            />
            {error && <p className="mt-2 text-sm text-status-danger" role="alert">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" disabled={isSaving} onClick={() => setShowForm(false)}>
                Batal
              </Button>
              <Button variant="primary" className="flex-1" loading={isSaving} onClick={handleAdd}>
                Simpan Alamat
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="mt-4" onClick={() => setShowForm(true)}>
            + Tambah Alamat Baru
          </Button>
        )}
      </div>
    </div>
  );
}
