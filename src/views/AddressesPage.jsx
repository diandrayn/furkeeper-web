import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import AddressFormFields, { emptyAddressForm } from '../components/AddressFormFields';
import { useAddresses } from '../context/AddressContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function AddressesPage() {
  const { t } = useLanguage();
  const { addresses, addAddress, updateAddress, removeAddress, setDefault } = useAddresses();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyAddressForm);
  const [error, setError] = useState('');

  const openAdd = () => {
    setEditing(null);
    setForm(emptyAddressForm);
    setError('');
    setFormOpen(true);
  };

  const openEdit = (address) => {
    setEditing(address);
    setForm({
      label: address.label || '',
      name: address.name || '',
      phone: address.phone || '',
      district: address.district || '',
      address: address.address || '',
      isDefault: Boolean(address.isDefault),
    });
    setError('');
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.label.trim() || !form.name.trim() || !form.phone.trim() || !form.district || !form.address.trim()) {
      setError(t('addresses.errorRequired'));
      return;
    }
    const payload = {
      ...form,
      label: form.label.trim(),
      name: form.name.trim(),
      city: 'Malang',
    };
    if (editing) updateAddress(editing.id, payload);
    else addAddress({ id: `addr-${Date.now()}`, ...payload });
    setFormOpen(false);
    setEditing(null);
    setError('');
  };

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <div key={address.id} className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-peach px-2.5 py-0.5 text-xs font-semibold text-brand-burgundy">
              {address.label}
            </span>
            {address.isDefault && <Badge variant="active" label={t('addresses.primaryBadge')} />}
          </div>
          <p className="mt-3 font-medium text-text-primary">{address.name}</p>
          <p className="mt-1 text-sm text-text-secondary">
            {address.address}, {t('addresses.district')} {address.district}, {address.city}
          </p>
          <p className="mt-1 text-sm text-text-secondary">{address.phone}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!address.isDefault && (
              <Button variant="outline" size="sm" onClick={() => setDefault(address.id)}>
                {t('addresses.makePrimary')}
              </Button>
            )}
            <button
              type="button"
              className="rounded-full p-2 text-text-secondary hover:bg-brand-peach hover:text-brand-burgundy"
              aria-label={t('addresses.editAria')}
              onClick={() => openEdit(address)}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-text-secondary hover:bg-status-danger/10 hover:text-status-danger"
              aria-label={t('addresses.deleteAria')}
              onClick={() => {
                if (window.confirm(t('addresses.confirmDelete'))) removeAddress(address.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={openAdd}>
        {t('addresses.addNew')}
      </Button>

      {formOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t('addresses.closeAria')}
            onClick={() => setFormOpen(false)}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
            <h2 className="mb-4 font-heading text-lg font-bold">
              {editing ? t('addresses.editTitle') : t('addresses.addTitle')}
            </h2>
            <AddressFormFields form={form} onChange={setForm} idPrefix="profile-address" />
            {error && <p className="mt-2 text-xs text-status-danger">{error}</p>}
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setFormOpen(false)}>
                {t('addresses.cancel')}
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleSave}>
                {t('addresses.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
