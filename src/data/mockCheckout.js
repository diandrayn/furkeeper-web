export const savedAddresses = [
  {
    id: 'addr-1',
    label: 'Rumah',
    name: 'Nadia Putri',
    phone: '0812-3456-7890',
    address: 'Jl. Veteran No. 10, RT 04/RW 02',
    district: 'Klojen',
    city: 'Malang',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Kantor',
    name: 'Nadia Putri',
    phone: '0812-3456-7890',
    address: 'Jl. Soekarno Hatta No. 8',
    district: 'Lowokwaru',
    city: 'Malang',
    isDefault: false,
  },
];

export const paymentMethods = [
  { value: 'qris', label: 'QRIS', icon: 'qr' },
  { value: 'va-bca', label: 'Virtual Account BCA', icon: 'bank' },
  { value: 'va-bni', label: 'Virtual Account BNI', icon: 'bank' },
  { value: 'va-mandiri', label: 'Virtual Account Mandiri', icon: 'bank' },
  { value: 'card', label: 'Kartu Kredit', icon: 'card' },
];

// Single source of truth for shipping fees, shared by client and server.
export { getShippingFee } from '../lib/shipping';
