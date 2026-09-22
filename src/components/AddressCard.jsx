import { MapPin, Phone } from 'lucide-react';
import Button from './Button';

export default function AddressCard({ address, onChange }) {
  if (!address) return null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="font-heading text-base font-bold text-text-primary">
          {address.name}
          {address.label ? (
            <span className="ml-2 text-xs font-medium text-text-secondary">({address.label})</span>
          ) : null}
        </p>
        <p className="mt-2 flex items-start gap-2 text-sm text-text-secondary">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          {address.address}, Kecamatan {address.district}, {address.city}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
          <Phone className="h-4 w-4" />
          {address.phone}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onChange}>
        Ganti Alamat
      </Button>
    </div>
  );
}
