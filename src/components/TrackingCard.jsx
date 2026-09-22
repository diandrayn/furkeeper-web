import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { formatDateId } from '../utils/status';

export default function TrackingCard({ tracking }) {
  const [copied, setCopied] = useState(false);

  if (!tracking) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tracking.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-4 font-heading text-lg font-bold">Pelacakan Pengiriman</h2>
      <p className="text-sm text-text-secondary">Kurir</p>
      <p className="font-medium text-text-primary">{tracking.courier}</p>
      <p className="mt-3 text-sm text-text-secondary">Nomor resi</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="font-medium text-text-primary">{tracking.trackingNumber}</p>
        <Button variant="ghost" size="sm" icon={<Copy className="h-4 w-4" />} onClick={handleCopy}>
          {copied ? 'Tersalin' : 'Salin'}
        </Button>
      </div>
      {tracking.eta && (
        <p className="mt-3 text-sm text-text-secondary">
          Estimasi tiba: <span className="font-medium text-text-primary">{formatDateId(tracking.eta)}</span>
        </p>
      )}
      {tracking.trackingUrl && (
        <Button
          variant="outline"
          className="mt-4"
          icon={<ExternalLink className="h-4 w-4" />}
          onClick={() => window.open(tracking.trackingUrl, '_blank', 'noopener,noreferrer')}
        >
          Buka Link Lacak
        </Button>
      )}
    </Card>
  );
}
