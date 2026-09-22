export function historyStatusLabel(item) {
  if (item.type === 'product') {
    if (item.status === 'Dikonfirmasi' || item.status === 'Disiapkan') return 'Diproses';
    return item.status;
  }
  if (item.status === 'Menunggu Konfirmasi' || item.status === 'Dikonfirmasi') return 'Diproses';
  return item.status;
}

export function statusBadgeClass(label) {
  if (label === 'Diproses') return 'bg-status-warning/30 text-text-primary';
  if (label === 'Dikirim' || label === 'Berlangsung') return 'bg-brand-peach text-brand-burgundy';
  if (label === 'Selesai') return 'bg-status-success/20 text-status-success';
  if (label === 'Dibatalkan') return 'bg-status-danger/15 text-status-danger';
  return 'bg-gray-100 text-text-secondary';
}

export function isShippedOrLater(status) {
  return status === 'Dikirim' || status === 'Selesai';
}

export function formatDateId(value) {
  if (!value) return '';
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatRelativeTimeId(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSeconds < 0) return 'Baru saja';
  if (diffInSeconds < 60) return 'Baru saja';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari lalu`;

  return formatDateId(value);
}

export function dayGroupLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Lebih Awal';

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffInDays = Math.floor((startOfToday - startOfDate) / 86400000);

  if (diffInDays === 0) return 'Hari Ini';
  if (diffInDays === 1) return 'Kemarin';
  return 'Lebih Awal';
}

export function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
