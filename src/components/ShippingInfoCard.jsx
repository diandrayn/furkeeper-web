import { MapPin, Phone } from 'lucide-react';
import Card from './Card';

export default function ShippingInfoCard({ address }) {
  if (!address) return null;

  return (
    <Card>
      <h2 className="mb-4 font-heading text-lg font-bold">Alamat Pengiriman</h2>
      <p className="font-medium text-text-primary">{address.name}</p>
      <p className="mt-2 flex items-start gap-2 text-sm text-text-secondary">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        {address.address}, Kecamatan {address.district}, {address.city}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
        <Phone className="h-4 w-4" />
        {address.phone}
      </p>
    </Card>
  );
}
