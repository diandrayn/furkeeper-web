// Data layer for the *reporter's* side of Kelola Laporan — a
// pembeli/penjual/penyedia jasa filing a report from their own screens
// (ProductDetailPage, ServiceDetailPage, OrderStatusPage,
// BookingStatusPage) and following it up from
// /bantuan-saya?tab=laporan. Counterpart to utils/admin.js's admin-only
// fetchAllReports / setReportStatus / sendReportReply, scoped to "my own
// reports" via the "reporter creates/reads own..." RLS policies already
// added in supabase/reports_migration.sql (replies additionally need
// supabase/reports_close_thread_migration.sql, which stops a reporter
// from posting once status = 'selesai').
import { supabase } from '../lib/supabaseClient';
import { REPORT_CATEGORY_LABELS, REPORT_STATUS_LABELS } from './admin';

export { REPORT_CATEGORY_LABELS, REPORT_STATUS_LABELS };

/** Thrown by submitReport for the two cases the UI shows a specific
 * message for ('self' — melaporkan toko sendiri, 'duplicate' — laporan
 * yang sama masih baru/diproses). Anything else bubbles up as a plain
 * Supabase error. */
export class ReportError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function isOwnStore(storeId, reporterId) {
  const { data, error } = await supabase.from('stores').select('owner_id').eq('id', storeId).maybeSingle();
  if (error) throw error;
  return data?.owner_id === reporterId;
}

/** "Target yang sama" = laporan lain dari reporter yang sama, ke toko yang
 * sama, dengan konteks yang sama (order/booking/product/service — mana
 * pun yang relevan), yang statusnya masih 'baru' atau 'diproses'. */
async function hasActiveDuplicate({ reporterId, reportedStoreId, orderId, bookingId, productId, serviceId }) {
  let query = supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', reporterId)
    .eq('reported_store_id', reportedStoreId)
    .in('status', ['baru', 'diproses']);
  if (orderId) query = query.eq('order_id', orderId);
  else if (bookingId) query = query.eq('booking_id', bookingId);
  else if (productId) query = query.eq('product_id', productId);
  else if (serviceId) query = query.eq('service_id', serviceId);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

/**
 * Files a new report against a store/penyedia jasa. Returns the new
 * report's id. Throws ReportError('self' | 'duplicate') for the two
 * blocked cases, otherwise a raw Supabase error.
 */
export async function submitReport({
  reporterId,
  reportedStoreId,
  category,
  description,
  orderId = null,
  bookingId = null,
  productId = null,
  serviceId = null,
}) {
  if (await isOwnStore(reportedStoreId, reporterId)) {
    throw new ReportError('self', 'Kamu tidak bisa melaporkan toko/jasa milik sendiri.');
  }
  if (await hasActiveDuplicate({ reporterId, reportedStoreId, orderId, bookingId, productId, serviceId })) {
    throw new ReportError(
      'duplicate',
      'Kamu sudah mengajukan laporan untuk ini dan laporannya masih diproses admin.',
    );
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      reported_store_id: reportedStoreId,
      category,
      description,
      order_id: orderId,
      booking_id: bookingId,
      product_id: productId,
      service_id: serviceId,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

function mapMyReportRow(row) {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    reportedStoreName: row.reported_store?.name || '-',
    orderId: row.order_id,
    bookingId: row.booking_id,
    productId: row.product_id,
    productName: row.products?.name || null,
    serviceId: row.service_id,
    serviceName: row.services?.name || null,
  };
}

/** Laporan yang pernah diajukan user ini, terbaru dulu. */
export async function fetchMyReports(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('reports')
    .select('*, reported_store:stores!reports_reported_store_id_fkey(name), products(name), services(name)')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapMyReportRow);
}

function mapMyMessageRow(row) {
  return {
    id: row.id,
    isAdmin: row.is_admin,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function fetchMyReportMessages(reportId) {
  const { data, error } = await supabase
    .from('report_messages')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapMyMessageRow);
}

/** Balasan reporter sendiri di thread laporannya. RLS
 * (reports_close_thread_migration.sql) menolak ini kalau status laporan
 * sudah 'selesai' — UI tetap menonaktifkan kolom balas duluan supaya
 * errornya tidak perlu sampai ke pengguna. */
export async function sendMyReportReply(reportId, userId, body) {
  const { error } = await supabase
    .from('report_messages')
    .insert({ report_id: reportId, sender_id: userId, is_admin: false, body });
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Indikator "ada balasan baru" untuk menu/nav Bantuan Saya — memakai
// tabel notifications yang sama dengan yang ditulis utils/admin.js saat
// admin membalas laporan / mengubah status (lihat setReportStatus,
// sendReportReply). "own notifications" RLS (schema.sql) sudah
// mengizinkan user membaca & meng-update baris miliknya sendiri.
// ---------------------------------------------------------------------
const REPORT_NOTIFICATION_TYPES = ['report_reply', 'report_status'];

export async function hasUnreadReportNotifications(userId) {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('is_read', false)
    .in('type', REPORT_NOTIFICATION_TYPES)
    .limit(1);
  if (error) {
    console.error('hasUnreadReportNotifications failed:', error);
    return false;
  }
  return Boolean(data?.length);
}

export async function markReportNotificationsRead(userId) {
  if (!userId) return;
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .in('type', REPORT_NOTIFICATION_TYPES);
  if (error) console.error('markReportNotificationsRead failed:', error);
}
