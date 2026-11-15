import { MapPin, Phone } from 'lucide-react';
import Card from './Card';

// Orders store the shipping address as a formatted snapshot string:
//   "<recipient> - <phone>\n<street>\n<district>, <city>, <postal code>"
// Older/other callers may pass a structured address object instead.
function normalizeAddress(address) {
  if (!address) return null;
  if (typeof address !== 'string') return address;

  const [firstLine = '', street = '', region = ''] = address.split('\n');
  const [name = '', phone = ''] = firstLine.split(/\s+[—-]\s+/);
  const [district = '', city = '', postalCode = ''] = region.split(',').map((part) => part.trim());

  return {
    name: name.trim(),
    phone: phone.trim(),
    address: street.trim(),
    district,
    city,
    postalCode,
  };
}

export default function ShippingInfoCard({ address }) {
  const value = normalizeAddress(address);
  if (!value) return null;

  return (
    <Card>
      <h2 className="mb-4 font-heading text-lg font-bold">Alamat Pengiriman</h2>
      {value.name && <p className="font-medium text-text-primary">{value.name}</p>}
      <p className="mt-2 flex items-start gap-2 text-sm text-text-secondary">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        {[value.address, value.district ? `Kecamatan ${value.district}` : '', value.city]
          .filter(Boolean)
          .join(', ')}
      </p>
      {value.phone && (
        <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
          <Phone className="h-4 w-4" />
          {value.phone}
        </p>
      )}
    </Card>
  );
}
