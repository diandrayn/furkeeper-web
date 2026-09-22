const STYLES = {
  'Menunggu Konfirmasi': 'bg-status-warning/25 text-[#8a6d1f]',
  Diproses: 'bg-status-warning/25 text-[#8a6d1f]',
  Dikonfirmasi: 'bg-brand-peach text-brand-burgundy',
  Dikirim: 'bg-brand-peach text-brand-burgundy',
  Berlangsung: 'bg-brand-peach text-brand-burgundy',
  Selesai: 'bg-status-success/20 text-status-success',
  Dibatalkan: 'bg-status-danger/15 text-status-danger',
  aktif: 'bg-status-success/20 text-status-success',
  nonaktif: 'bg-gray-100 text-text-secondary',
  habis: 'bg-status-danger/15 text-status-danger',
};

const LABELS = {
  aktif: 'Aktif',
  nonaktif: 'Nonaktif',
  habis: 'Stok Habis',
};

export default function StatusPill({ status, className = '' }) {
  const style = STYLES[status] || 'bg-gray-100 text-text-secondary';
  const label = LABELS[status] || status;

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style} ${className}`}>
      {label}
    </span>
  );
}
