import Input from './Input';
import Select from './Select';
import Textarea from './Textarea';
import Checkbox from './Checkbox';
import { districts } from '../data/mockData';

export const emptyAddressForm = {
  label: '',
  name: '',
  phone: '',
  district: '',
  address: '',
  isDefault: false,
};

export default function AddressFormFields({ form, onChange, idPrefix = 'address' }) {
  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="space-y-3">
      <Input
        label="Label Alamat"
        value={form.label}
        onChange={set('label')}
        placeholder="Rumah / Kantor"
        required
      />
      <Input
        label="Nama Penerima"
        value={form.name}
        onChange={set('name')}
        required
      />
      <Input
        label="No. HP"
        value={form.phone}
        onChange={set('phone')}
        required
      />
      <Select
        label="Kecamatan/Kelurahan"
        options={districts}
        value={form.district}
        onChange={set('district')}
        required
      />
      <Textarea
        label="Alamat Lengkap"
        value={form.address}
        onChange={set('address')}
        required
      />
      <Checkbox
        id={`${idPrefix}-default`}
        label="Jadikan alamat utama"
        checked={Boolean(form.isDefault)}
        onChange={set('isDefault')}
      />
    </div>
  );
}
