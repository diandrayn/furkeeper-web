const variantAliases = {
  Terlaris: 'best-seller',
  Baru: 'new',
  'Respon Cepat': 'fast-response',
  Terpercaya: 'trusted',
  'Best Seller': 'best-seller',
  New: 'new',
  'Fast Response': 'fast-response',
  Trusted: 'trusted',
};

const badgeStyles = {
  'best-seller': 'bg-status-danger text-white',
  new: 'bg-status-success text-white',
  optional: 'bg-gray-100 text-text-secondary',
  'fast-response': 'bg-brand-peach text-brand-burgundy',
  trusted: 'bg-status-success/20 text-brand-burgundy',
  discount: 'bg-status-danger text-white',
  pending: 'bg-status-warning/30 text-text-primary',
  active: 'bg-status-success/20 text-brand-burgundy',
  rejected: 'bg-status-danger/15 text-status-danger',
};

const badgeLabels = {
  'best-seller': 'Terlaris',
  new: 'Baru',
  optional: 'Opsional',
  'fast-response': 'Respon Cepat',
  trusted: 'Terpercaya',
};

export default function Badge({ variant = 'new', label, className = '' }) {
  const resolved = variantAliases[variant] || variant;
  const styles = badgeStyles[resolved] || badgeStyles.new;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles} ${className}`}
    >
      {label || badgeLabels[resolved] || variant}
    </span>
  );
}
