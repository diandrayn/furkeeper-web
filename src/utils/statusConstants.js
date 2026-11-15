// ============================================================================
// statusConstants.js — SATU sumber kebenaran untuk status pesanan & booking.
// Nilai status di sini PERSIS sama dengan CHECK constraint di database
// (supabase/sync_orders_booking_migration.sql) sehingga pembeli, penjual/
// penyedia jasa, dan admin melihat enum yang sama dan bisa pindah-role.
// ============================================================================

/** Urutan normal alur pesanan produk (untuk stepper). */
export const ORDER_FLOW = ['pending_payment', 'processing', 'shipped', 'completed'];
export const ORDER_STATUSES = ['pending_payment', 'processing', 'shipped', 'completed', 'cancelled'];

/** Urutan normal alur booking jasa (untuk stepper). */
export const BOOKING_FLOW = ['pending_confirmation', 'confirmed', 'in_progress', 'completed'];
export const BOOKING_STATUSES = ['pending_confirmation', 'confirmed', 'in_progress', 'completed', 'cancelled'];

export const STATUS_LABELS = {
  id: {
    pending_payment: 'Menunggu Pembayaran',
    processing: 'Diproses',
    shipped: 'Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    pending_confirmation: 'Menunggu Konfirmasi',
    confirmed: 'Dikonfirmasi',
    in_progress: 'Berlangsung',
  },
  en: {
    pending_payment: 'Waiting for Payment',
    processing: 'Processing',
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled',
    pending_confirmation: 'Awaiting Confirmation',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
  },
};

/** Label status sesuai bahasa aktif (`'id'` | `'en'`). */
export function statusLabel(status, lang = 'id') {
  return STATUS_LABELS[lang === 'en' ? 'en' : 'id']?.[status] || status;
}

/** Warna badge status (dipakai StatusPill bagian pembeli/penjual). */
export function statusBadge(status, lang = 'id') {
  const label = statusLabel(status, lang);
  if (status === 'completed') return 'bg-status-success/20 text-status-success';
  if (status === 'cancelled') return 'bg-status-danger/15 text-status-danger';
  if (status === 'shipped' || status === 'in_progress' || status === 'confirmed') {
    return 'bg-brand-peach text-brand-burgundy';
  }
  // pending_payment / pending_confirmation / processing
  return label === 'Diproses' || label === 'Processing'
    ? 'bg-status-warning/25 text-[#8a6d1f]'
    : 'bg-status-warning/25 text-[#8a6d1f]';
}

// ---------------------------------------------------------------------------
// Transisi yang diizinkan (actor -> from -> [to]) — dicocokkan dengan
// validasi di RPC set_order_status / set_booking_status.
// ---------------------------------------------------------------------------
export const ORDER_TRANSITIONS = {
  seller: {
    pending_payment: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['completed', 'cancelled'],
  },
  buyer: {
    pending_payment: ['cancelled'],
    shipped: ['completed'],
  },
};

export const BOOKING_TRANSITIONS = {
  provider: {
    pending_confirmation: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
  },
  buyer: {
    pending_confirmation: ['cancelled'],
    confirmed: ['cancelled'],
    in_progress: ['completed'],
  },
};

export function canTransition(order, actor, fromStatus, toStatus) {
  return (order === 'order' ? ORDER_TRANSITIONS : BOOKING_TRANSITIONS)[actor]?.[fromStatus]?.includes(toStatus) ?? false;
}

/** Aksi penjual berikutnya untuk satu status pesanan (untuk tombol modal). */
export function nextOrderAction(status) {
  if (status === 'pending_payment') return ['processing', 'confirmOrder'];
  if (status === 'processing') return ['shipped', 'markShipped'];
  if (status === 'shipped') return ['completed', 'markCompleted'];
  return null;
}

/** Aksi penyedia jasa berikutnya untuk satu status booking. */
export function nextBookingAction(status) {
  if (status === 'pending_confirmation') return ['confirmed', 'acceptBooking'];
  if (status === 'confirmed') return ['in_progress', 'startService'];
  if (status === 'in_progress') return ['completed', 'markCompleted'];
  return null;
}

/** Status yang boleh dibatalkan oleh penjual/penyedia. */
export function canSellerCancel(status) {
  return status === 'pending_payment' || status === 'processing' || status === 'shipped'
    || status === 'pending_confirmation' || status === 'confirmed' || status === 'in_progress';
}