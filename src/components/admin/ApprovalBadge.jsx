import { LISTING_APPROVAL_LABELS } from '../../utils/admin';

const TONES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

/** Status approval sebuah listing: Menunggu / Disetujui / Ditolak. */
export default function ApprovalBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[status] || 'bg-gray-100 text-gray-600'} ${className}`}
    >
      {LISTING_APPROVAL_LABELS[status] || status}
    </span>
  );
}
