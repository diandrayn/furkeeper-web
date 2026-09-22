// Data layer for the Admin panel (/admin/*) — everything here talks to the
// real Supabase tables (profiles, stores, products, services, reviews),
// relying on the "admin can read/update/delete everything" RLS policies
// added in supabase/admin_panel.sql. Run that migration + promote an
// account to role 'admin' before any of this will return data instead of
// empty arrays.
import { supabase } from '../lib/supabaseClient';

// ---------------------------------------------------------------------
// Log Aktivitas Admin (§2.13) — append-only audit trail. Every mutating
// admin action below calls this at the end (fire-and-forget: a logging
// failure is reported to the console but never blocks or rolls back the
// action itself — the moderation action mattering more than its own
// receipt). Needs supabase/activity_log_migration.sql.
// ---------------------------------------------------------------------
export const ACTIVITY_ACTION_LABELS = {
  approve_partner: 'Menyetujui pendaftaran mitra',
  reject_partner: 'Menolak pendaftaran mitra',
  suspend_user: 'Men-suspend akun pengguna',
  unsuspend_user: 'Mengaktifkan kembali akun pengguna',
  activate_product: 'Mengaktifkan produk',
  deactivate_product: 'Menonaktifkan produk',
  delete_product: 'Menghapus produk',
  activate_service: 'Mengaktifkan jasa',
  deactivate_service: 'Menonaktifkan jasa',
  delete_service: 'Menghapus jasa',
  delete_review: 'Menghapus ulasan',
  update_report_status: 'Mengubah status laporan',
  update_report_priority: 'Mengubah prioritas laporan',
  reply_report: 'Membalas laporan',
  create_category: 'Menambah kategori',
  rename_category: 'Mengubah nama kategori',
  delete_category: 'Menghapus kategori',
  reply_help_message: 'Membalas pesan bantuan',
  promote_admin: 'Menambahkan admin baru',
  update_admin_scope: 'Mengubah hak akses admin',
  demote_admin: 'Menurunkan admin ke pengguna biasa',
  update_commission_rate: 'Mengubah rate komisi platform',
  update_withdrawal_status: 'Mengubah status pencairan dana',
  approve_product: 'Menyetujui produk',
  reject_product: 'Menolak produk',
  approve_service: 'Menyetujui jasa',
  reject_service: 'Menolak jasa',
  create_faq: 'Menambah FAQ',
  update_faq: 'Mengubah FAQ',
  delete_faq: 'Menghapus FAQ',
  update_platform_content: 'Mengubah konten statis platform',
  create_platform_content: 'Menambah konten statis platform',
  delete_platform_content: 'Menghapus konten statis platform',
};

async function logAdminActivity(action, targetType, targetId, targetLabel = null, detail = null) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('admin_activity_log').insert({
      actor_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      target_label: targetLabel,
      detail,
    });
    if (error) throw error;
  } catch (err) {
    // Never let a logging failure surface as if the action itself failed.
    console.error('logAdminActivity failed:', err);
  }
}

function mapUserRow(row) {
  return {
    id: row.id,
    fullName: row.full_name || '(Tanpa nama)',
    email: row.email || '-',
    phone: row.phone || '',
    avatarUrl: row.avatar_url,
    role: row.role,
    sellerStatus: row.seller_status,
    providerStatus: row.provider_status,
    business: row.business,
    partnerSubmittedAt: row.partner_submitted_at,
    isSuspended: row.is_suspended,
    suspendedReason: row.suspended_reason,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------
// Overview / stats
// ---------------------------------------------------------------------
async function countRows(table, filters = {}) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

/** Like countRows, but resolves to 0 instead of throwing — for optional
 * stats whose table depends on a migration that may not be applied yet,
 * so a missing one doesn't take down the whole Overview page. */
async function countRowsSafe(table, filters = {}) {
  try {
    return await countRows(table, filters);
  } catch (err) {
    console.error(`countRowsSafe(${table}) failed:`, err);
    return 0;
  }
}

// Status yang dihitung sebagai "transaksi" pada ringkasan Overview. Pesanan
// yang masih menunggu pembayaran dan transaksi yang dibatalkan sengaja tidak
// ikut — belum/tidak menjadi uang masuk. Ubah di sini kalau definisinya
// berubah.
const SUMMARY_ORDER_STATUSES = ['processing', 'shipped', 'completed'];
const SUMMARY_BOOKING_STATUSES = ['confirmed', 'in_progress', 'completed'];

/** Reads every row of a query page by page — PostgREST caps one response
 * (1000 rows by default), so a busy week would otherwise be silently cut off.
 * `buildQuery` must return a FRESH query builder each call. */
async function fetchAllRows(buildQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Monday 00:00 of the current week (minggu Indonesia mulai Senin). */
function startOfWeek() {
  const d = startOfToday();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/** Jumlah & nilai transaksi (pesanan produk + booking jasa) hari ini dan
 * minggu ini, dalam zona waktu browser admin. */
export async function fetchTransactionSummary() {
  const today = startOfToday();
  const weekIso = startOfWeek().toISOString();

  const [orders, bookings] = await Promise.all([
    fetchAllRows(() =>
      supabase
        .from('orders')
        .select('id, total, created_at')
        .in('status', SUMMARY_ORDER_STATUSES)
        .gte('created_at', weekIso)
        .order('created_at', { ascending: false })
        .order('id'),
    ),
    fetchAllRows(() =>
      supabase
        .from('bookings')
        .select('id, price, created_at')
        .in('status', SUMMARY_BOOKING_STATUSES)
        .gte('created_at', weekIso)
        .order('created_at', { ascending: false })
        .order('id'),
    ),
  ]);

  const bucket = (since) => {
    const acc = { orderCount: 0, orderValue: 0, bookingCount: 0, bookingValue: 0 };
    orders.forEach((o) => {
      if (new Date(o.created_at) >= since) {
        acc.orderCount += 1;
        acc.orderValue += Number(o.total) || 0;
      }
    });
    bookings.forEach((b) => {
      if (new Date(b.created_at) >= since) {
        acc.bookingCount += 1;
        acc.bookingValue += Number(b.price) || 0;
      }
    });
    return { ...acc, count: acc.orderCount + acc.bookingCount, value: acc.orderValue + acc.bookingValue };
  };

  return { today: bucket(today), week: bucket(new Date(weekIso)) };
}

export async function fetchAdminStats() {
  const [
    totalBuyers,
    totalSellers,
    totalProviders,
    pendingSellers,
    pendingProviders,
    suspended,
    totalProducts,
    activeProducts,
    totalServices,
    activeServices,
    totalReviews,
    totalStores,
    unreadHelpMessages,
    newReports,
    inProgressReports,
    pendingProducts,
    pendingServices,
    transactionSummary,
  ] = await Promise.all([
    countRows('profiles', { role: 'buyer' }),
    countRows('profiles', { role: 'seller' }),
    countRows('profiles', { role: 'service' }),
    countRows('profiles', { role: 'seller', seller_status: 'pending' }),
    countRows('profiles', { role: 'service', provider_status: 'pending' }),
    countRows('profiles', { is_suspended: true }),
    countRows('products'),
    countRows('products', { is_active: true }),
    countRows('services'),
    countRows('services', { is_active: true }),
    countRows('reviews'),
    countRows('stores'),
    countRowsSafe('help_messages', { status: 'belum_dibalas' }),
    // "Belum ditindaklanjuti" = status baru; yang sudah 'diproses' sedang
    // ditangani, jadi dihitung terpisah.
    countRowsSafe('reports', { status: 'baru' }),
    countRowsSafe('reports', { status: 'diproses' }),
    countRowsSafe('products', { approval_status: 'pending' }),
    countRowsSafe('services', { approval_status: 'pending' }),
    fetchTransactionSummary().catch((err) => {
      console.error('fetchTransactionSummary failed:', err);
      return null; // Overview menampilkan "tidak tersedia", bukan angka 0 yang menyesatkan.
    }),
  ]);

  return {
    totalUsers: totalBuyers + totalSellers + totalProviders,
    totalBuyers,
    totalSellers,
    totalProviders,
    pendingApplications: pendingSellers + pendingProviders,
    suspended,
    totalProducts,
    activeProducts,
    totalServices,
    activeServices,
    totalReviews,
    totalStores,
    unreadHelpMessages,
    newReports,
    inProgressReports,
    pendingProducts,
    pendingServices,
    pendingListings: pendingProducts + pendingServices,
    transactionSummary,
  };
}

// ---------------------------------------------------------------------
// Partner (mitra) applications — the sign-up flow writes straight onto
// profiles.seller_status / provider_status (see handle_new_user() in
// supabase/admin_panel.sql), so "pending applications" is just a filtered
// read of profiles, not a separate table.
// ---------------------------------------------------------------------
export async function fetchPartnerApplications({ status = 'pending' } = {}) {
  // '-'none' is a real filter too: legacy/inconsistent mitra accounts whose
  // role is already seller/service but whose status column never got written
  // (see supabase/backfill_partner_status.sql / diagnostic_partner_status.sql)
  // must still be reviewable — an admin approving one fixes it without a SQL
  // backfill. 'none' means BOTH statuses are unrecorded (a normal seller has
  // seller_status set even if provider_status stays 'none'), so it uses
  // and() instead of or().
  const statusFilter =
    status === 'all'
      ? 'seller_status.neq.none,provider_status.neq.none'
      : `seller_status.eq.${status},provider_status.eq.${status}`;
  let query = supabase
    .from('profiles')
    .select('*')
    .in('role', ['seller', 'service'])
    .order('partner_submitted_at', { ascending: false });
  query = status === 'none' ? query.and(statusFilter) : query.or(statusFilter);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapUserRow);
}

/** type is 'seller' | 'service' — matches profiles.role for that account. */
export async function reviewPartnerApplication(userId, type, decision, reason, userLabel = null) {
  const field = type === 'service' ? 'provider_status' : 'seller_status';
  const patch = { [field]: decision, updated_at: new Date().toISOString() };
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;

  await logAdminActivity(
    decision === 'approved' ? 'approve_partner' : 'reject_partner',
    'user',
    userId,
    userLabel,
    reason ? { type, reason } : { type },
  );

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'partner_application',
    title:
      decision === 'approved'
        ? 'Pendaftaran mitra disetujui'
        : 'Pendaftaran mitra ditolak',
    body:
      decision === 'approved'
        ? 'Selamat! Akun mitra kamu sudah aktif — kamu sekarang bisa membuka dashboard dan mulai berjualan/menerima booking.'
        : reason || 'Pengajuan mitra kamu belum bisa disetujui. Silakan ajukan ulang dengan data yang lebih lengkap.',
    link: decision === 'approved' ? (type === 'service' ? '/dashboard/jasa' : '/dashboard/toko') : '/pengajuan-ulang',
  });
}

// ---------------------------------------------------------------------
// Users (buyers + mitra) — suspend / reactivate
// ---------------------------------------------------------------------
export async function fetchAllUsers({ search = '', role = 'all' } = {}) {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (role !== 'all') query = query.eq('role', role);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapUserRow);
}

export async function setUserSuspended(userId, isSuspended, reason = null, userLabel = null) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: isSuspended, suspended_reason: isSuspended ? reason : null })
    .eq('id', userId);
  if (error) throw error;

  await logAdminActivity(
    isSuspended ? 'suspend_user' : 'unsuspend_user',
    'user',
    userId,
    userLabel,
    isSuspended ? { reason } : null,
  );

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'account_status',
    title: isSuspended ? 'Akun kamu disuspend sementara' : 'Akun kamu diaktifkan kembali',
    body: isSuspended
      ? reason || 'Akun kamu dinonaktifkan sementara oleh admin karena melanggar ketentuan platform.'
      : 'Akun kamu sudah aktif kembali dan dapat digunakan seperti biasa.',
  });
}

// ---------------------------------------------------------------------
// Stores — browse mitra by their storefront first, then drill into what
// that store is actually selling/offering (this is the flow the panel's
// nav leads with, rather than one flat cross-platform product list).
// ---------------------------------------------------------------------
function mapStoreRow(row) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind, // 'seller' | 'service'
    location: row.location,
    district: row.district,
    trusted: row.trusted,
    fastResponse: row.fast_response,
    rating: row.rating || 0,
    createdAt: row.created_at,
    ownerId: row.owner_id,
    ownerName: row.profiles?.full_name || '-',
    ownerEmail: row.profiles?.email || '-',
    listingCount: row.kind === 'service' ? row.services?.[0]?.count || 0 : row.products?.[0]?.count || 0,
  };
}

export async function fetchAllStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*, profiles(full_name, email), products(count), services(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapStoreRow);
}

export async function fetchStoreById(storeId) {
  const { data, error } = await supabase
    .from('stores')
    .select('*, profiles(full_name, email)')
    .eq('id', storeId)
    .single();
  if (error) throw error;
  return mapStoreRow(data);
}

export async function fetchProductsByStore(storeId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((row) => mapProductRow({ ...row, stores: null }));
}

export async function fetchServicesByStore(storeId) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((row) => mapServiceRow({ ...row, stores: null }));
}

// ---------------------------------------------------------------------
// Listings — products & services, platform-wide (every store, not just
// the signed-in owner's). Two independent axes:
//   * approval_status (pending | approved | rejected) — the approval flow
//     (§2.5): a new listing waits for an admin; a rejection needs a reason;
//     an approved listing edited by its owner falls back to pending. The
//     database enforces this (supabase/listing_approval_migration.sql), the
//     functions here just drive the admin's side of it.
//   * is_active — plain show/hide, still available for pulling a live
//     listing down without rejecting it.
// Only listings that are approved (and active) are visible publicly.
// ---------------------------------------------------------------------
export const LISTING_APPROVAL_LABELS = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

function mapProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    petType: row.pet_type,
    price: row.price,
    stock: row.stock,
    imageUrl: row.image_url,
    isActive: row.is_active,
    approvalStatus: row.approval_status || 'approved',
    rejectionReason: row.rejection_reason || null,
    reviewedAt: row.reviewed_at || null,
    createdAt: row.created_at,
    storeId: row.store_id,
    storeName: row.stores?.name || '-',
    ownerName: row.stores?.profiles?.full_name || '-',
  };
}

/** approvalStatus: 'all' | 'pending' | 'approved' | 'rejected' */
export async function fetchAllProducts({ approvalStatus = 'all' } = {}) {
  let query = supabase
    .from('products')
    .select('*, stores(name, owner_id, profiles(full_name))')
    .order('created_at', { ascending: false });
  if (approvalStatus !== 'all') query = query.eq('approval_status', approvalStatus);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapProductRow);
}

export async function setProductActive(id, isActive, productLabel = null) {
  const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
  await logAdminActivity(isActive ? 'activate_product' : 'deactivate_product', 'product', id, productLabel);
}

export async function deleteProductAdmin(id, productLabel = null) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  await logAdminActivity('delete_product', 'product', id, productLabel);
}

function mapServiceRow(row) {
  return {
    id: row.id,
    name: row.name,
    serviceType: row.service_type,
    priceFrom: row.price_from,
    imageUrl: row.image_url,
    isActive: row.is_active,
    approvalStatus: row.approval_status || 'approved',
    rejectionReason: row.rejection_reason || null,
    reviewedAt: row.reviewed_at || null,
    createdAt: row.created_at,
    storeId: row.store_id,
    storeName: row.stores?.name || '-',
    ownerName: row.stores?.profiles?.full_name || '-',
  };
}

/** approvalStatus: 'all' | 'pending' | 'approved' | 'rejected' */
export async function fetchAllServices({ approvalStatus = 'all' } = {}) {
  let query = supabase
    .from('services')
    .select('*, stores(name, owner_id, profiles(full_name))')
    .order('created_at', { ascending: false });
  if (approvalStatus !== 'all') query = query.eq('approval_status', approvalStatus);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapServiceRow);
}

/** Approve or reject a listing. kind is 'product' | 'service'; decision is
 * 'approved' | 'rejected'. A rejection REQUIRES a reason (checked here and
 * again by a database constraint). The owner is notified either way. */
export async function reviewListing(kind, id, decision, reason = null, listingLabel = null) {
  if (decision !== 'approved' && decision !== 'rejected') throw new Error(`Invalid decision: ${decision}`);
  const cleanReason = (reason || '').trim();
  if (decision === 'rejected' && !cleanReason) throw new Error('Alasan penolakan wajib diisi.');

  const isService = kind === 'service';
  const table = isService ? 'services' : 'products';
  const { data, error } = await supabase
    .from(table)
    .update({ approval_status: decision, rejection_reason: decision === 'rejected' ? cleanReason : null })
    .eq('id', id)
    .select('name, stores(owner_id)')
    .single();
  if (error) throw error;

  const name = listingLabel || data?.name || null;
  const action = `${decision === 'approved' ? 'approve' : 'reject'}_${isService ? 'service' : 'product'}`;
  await logAdminActivity(action, isService ? 'service' : 'product', id, name, decision === 'rejected' ? { reason: cleanReason } : null);

  const ownerId = data?.stores?.owner_id;
  if (ownerId) {
    const noun = isService ? 'Jasa' : 'Produk';
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: ownerId,
      type: 'listing_review',
      title: decision === 'approved' ? `${noun} kamu disetujui` : `${noun} kamu ditolak`,
      body:
        decision === 'approved'
          ? `"${data.name}" sudah disetujui dan sekarang tayang di platform.`
          : `"${data.name}" belum bisa disetujui: ${cleanReason} Perbarui listing-nya, lalu akan ditinjau ulang.`,
      link: isService ? '/dashboard/jasa/layanan' : '/dashboard/toko/produk',
    });
    // The review itself already succeeded; a failed notification (e.g. the
    // notifications.type column rejecting a new value) must not undo it.
    if (notifError) console.error('reviewListing notification failed:', notifError);
  }
}

export async function setServiceActive(id, isActive, serviceLabel = null) {
  const { error } = await supabase.from('services').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
  await logAdminActivity(isActive ? 'activate_service' : 'deactivate_service', 'service', id, serviceLabel);
}

export async function deleteServiceAdmin(id, serviceLabel = null) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
  await logAdminActivity('delete_service', 'service', id, serviceLabel);
}

// ---------------------------------------------------------------------
// Reviews — moderate (delete) fake/abusive reviews platform-wide.
// ---------------------------------------------------------------------
function mapReviewRow(row) {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    reply: row.reply,
    createdAt: row.created_at,
    authorName: row.profiles?.full_name || 'Pengguna',
    targetName: row.products?.name || row.services?.name || '-',
    targetType: row.product_id ? 'product' : 'service',
  };
}

export async function fetchAllReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(full_name), products(name), services(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapReviewRow);
}

export async function deleteReviewAdmin(id, reviewLabel = null) {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
  await logAdminActivity('delete_review', 'review', id, reviewLabel);
}

// ---------------------------------------------------------------------
// Transaksi — orders (pembelian produk) & bookings (pemesanan jasa),
// platform-wide. Read-only reference for admin: melihat status & isi
// transaksi supaya bisa dicocokkan saat menangani laporan sengketa
// (lihat utils/admin.js fetchAllReports di modul Kelola Laporan).
// ---------------------------------------------------------------------
export const ORDER_STATUS_LABELS = {
  pending_payment: 'Menunggu Pembayaran',
  processing: 'Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const BOOKING_STATUS_LABELS = {
  pending_confirmation: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  in_progress: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

function mapOrderRow(row) {
  return {
    id: row.id,
    status: row.status,
    paymentMethod: row.payment_method,
    subtotal: row.subtotal,
    shippingCost: row.shipping_cost,
    total: row.total,
    trackingNumber: row.tracking_number,
    createdAt: row.created_at,
    buyerName: row.profiles?.full_name || '-',
    buyerEmail: row.profiles?.email || '-',
    items: (row.order_items || []).map((item) => ({
      id: item.id,
      name: item.name,
      variant: item.variant,
      price: item.price,
      quantity: item.quantity,
      storeName: item.stores?.name || '-',
    })),
  };
}

export async function fetchAllOrders({ search = '', status = 'all' } = {}) {
  let query = supabase
    .from('orders')
    .select('*, profiles(full_name, email), order_items(*, stores(name))')
    .order('created_at', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  let mapped = data.map(mapOrderRow);
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    mapped = mapped.filter(
      (o) =>
        o.id.toLowerCase().includes(term) ||
        o.buyerName.toLowerCase().includes(term) ||
        o.buyerEmail.toLowerCase().includes(term) ||
        o.items.some((i) => i.name.toLowerCase().includes(term) || i.storeName.toLowerCase().includes(term)),
    );
  }
  return mapped;
}

function mapBookingRow(row) {
  return {
    id: row.id,
    status: row.status,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    price: row.price,
    notes: row.notes,
    createdAt: row.created_at,
    buyerName: row.profiles?.full_name || '-',
    buyerEmail: row.profiles?.email || '-',
    petName: row.pets?.name || '-',
    serviceName: row.services?.name || '-',
    storeName: row.services?.stores?.name || '-',
    packageName: row.service_packages?.name || null,
  };
}

export async function fetchAllBookings({ search = '', status = 'all' } = {}) {
  let query = supabase
    .from('bookings')
    .select('*, profiles(full_name, email), pets(name), services(name, stores(name)), service_packages(name)')
    .order('created_at', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  let mapped = data.map(mapBookingRow);
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    mapped = mapped.filter(
      (b) =>
        b.id.toLowerCase().includes(term) ||
        b.buyerName.toLowerCase().includes(term) ||
        b.buyerEmail.toLowerCase().includes(term) ||
        b.serviceName.toLowerCase().includes(term) ||
        b.storeName.toLowerCase().includes(term),
    );
  }
  return mapped;
}

// ---------------------------------------------------------------------
// Laporan — sengketa yang diajukan pembeli/penjual/penyedia jasa terhadap
// pihak lain. Butuh supabase/reports_migration.sql (tabel reports +
// report_messages) di atas admin_panel.sql.
// ---------------------------------------------------------------------
export const REPORT_CATEGORY_LABELS = {
  penipuan: 'Penipuan',
  barang_tidak_sesuai: 'Barang Tidak Sesuai',
  jasa_tidak_selesai: 'Jasa Tidak Selesai',
  pelecehan: 'Pelecehan',
  lainnya: 'Lainnya',
};

export const REPORT_PRIORITY_LABELS = {
  low: 'Rendah',
  normal: 'Normal',
  high: 'Tinggi',
  urgent: 'Mendesak',
};

export const REPORT_STATUS_LABELS = {
  baru: 'Baru',
  diproses: 'Diproses',
  selesai: 'Selesai',
};

function mapReportRow(row) {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reporterId: row.reporter_id,
    reporterName: row.reporter?.full_name || '-',
    reporterEmail: row.reporter?.email || '-',
    reportedUserId: row.reported_user_id,
    reportedUserName: row.reported_user?.full_name || null,
    reportedStoreId: row.reported_store_id,
    reportedStoreName: row.reported_store?.name || null,
    orderId: row.order_id,
    bookingId: row.booking_id,
    productId: row.product_id,
    productName: row.products?.name || null,
    serviceId: row.service_id,
    serviceName: row.services?.name || null,
  };
}

export async function fetchAllReports({ search = '', status = 'all', priority = 'all' } = {}) {
  let query = supabase
    .from('reports')
    .select(
      '*, reporter:profiles!reports_reporter_id_fkey(full_name, email), reported_user:profiles!reports_reported_user_id_fkey(full_name, email), reported_store:stores!reports_reported_store_id_fkey(name), products(name), services(name)',
    )
    .order('created_at', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);
  if (priority !== 'all') query = query.eq('priority', priority);
  const { data, error } = await query;
  if (error) throw error;
  let mapped = data.map(mapReportRow);
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    mapped = mapped.filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.reporterName.toLowerCase().includes(term) ||
        (r.reportedUserName || '').toLowerCase().includes(term) ||
        (r.reportedStoreName || '').toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term),
    );
  }
  return mapped;
}

/**
 * reporterId is the report's reporter_id — pass it (the caller already
 * has the report row loaded) so a notification can go out when the
 * status moves to 'diproses' or 'selesai' (§4E). Moving back to 'baru'
 * doesn't notify — that's an internal admin correction, not news for the
 * reporter.
 */
export async function setReportStatus(reportId, status, reportLabel = null, reporterId = null) {
  const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
  if (error) throw error;
  await logAdminActivity('update_report_status', 'report', reportId, reportLabel, { status });

  if (reporterId && (status === 'diproses' || status === 'selesai')) {
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: reporterId,
      type: 'report_status',
      title: status === 'selesai' ? 'Laporan kamu sudah selesai ditangani' : 'Laporan kamu sedang diproses',
      body:
        status === 'selesai'
          ? `Laporan "${reportLabel || 'kamu'}" sudah selesai ditangani oleh admin.`
          : `Laporan "${reportLabel || 'kamu'}" sedang ditangani oleh admin.`,
      link: `/bantuan-saya?tab=laporan&id=${reportId}`,
    });
    // Notifikasi gagal terkirim tidak boleh membatalkan perubahan status
    // itu sendiri — statusnya sudah tersimpan dan tetap terlihat di
    // /bantuan-saya begitu pelapor membuka halamannya.
    if (notifError) console.error('Gagal mengirim notifikasi perubahan status laporan:', notifError);
  }
}

export async function setReportPriority(reportId, priority, reportLabel = null) {
  const { error } = await supabase.from('reports').update({ priority }).eq('id', reportId);
  if (error) throw error;
  await logAdminActivity('update_report_priority', 'report', reportId, reportLabel, { priority });
}

function mapReportMessageRow(row) {
  return {
    id: row.id,
    reportId: row.report_id,
    senderId: row.sender_id,
    senderName: row.profiles?.full_name || (row.is_admin ? 'Admin' : '-'),
    isAdmin: row.is_admin,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function fetchReportMessages(reportId) {
  const { data, error } = await supabase
    .from('report_messages')
    .select('*, profiles(full_name)')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapReportMessageRow);
}

/** reporterId is the report's reporter_id — pass it so the reporter gets
 * notified that admin replied (§4E). This always fires exactly one
 * notification for the reply, even on a first reply that also flips the
 * status from 'baru' to 'diproses' below — that status flip is a plain
 * update (not a call to setReportStatus), so it doesn't also trigger a
 * separate "status changed" notification. */
export async function sendReportReply(reportId, adminId, body, reportLabel = null, reporterId = null) {
  const { error } = await supabase
    .from('report_messages')
    .insert({ report_id: reportId, sender_id: adminId, is_admin: true, body });
  if (error) throw error;
  // Balasan admin otomatis memindahkan status dari "baru" ke "diproses"
  // kalau belum ditangani sama sekali.
  await supabase.from('reports').update({ status: 'diproses' }).eq('id', reportId).eq('status', 'baru');
  await logAdminActivity('reply_report', 'report', reportId, reportLabel);

  if (reporterId) {
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: reporterId,
      type: 'report_reply',
      title: 'Admin membalas laporan kamu',
      body: `Laporan "${reportLabel || 'kamu'}" sudah dibalas oleh admin.`,
      link: `/bantuan-saya?tab=laporan&id=${reportId}`,
    });
    if (notifError) console.error('Gagal mengirim notifikasi balasan laporan:', notifError);
  }
}

// ---------------------------------------------------------------------
// Kelola Pesan (FAQ / Pusat Bantuan) — inbox pesan dari halaman
// Bantuan/Kontak (§2.9). Needs supabase/help_messages_migration.sql.
// ---------------------------------------------------------------------
export const HELP_MESSAGE_STATUS_LABELS = {
  belum_dibalas: 'Belum Dibalas',
  sudah_dibalas: 'Sudah Dibalas',
};

function mapHelpMessageRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    subject: row.subject || '-',
    body: row.body,
    status: row.status,
    adminReply: row.admin_reply,
    repliedByName: row.replied_by_profile?.full_name || null,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
  };
}

export async function fetchHelpMessages({ search = '', status = 'all' } = {}) {
  let query = supabase
    .from('help_messages')
    .select('*, replied_by_profile:profiles!help_messages_replied_by_fkey(full_name)')
    .order('created_at', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  let mapped = data.map(mapHelpMessageRow);
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    mapped = mapped.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.subject.toLowerCase().includes(term) ||
        m.body.toLowerCase().includes(term),
    );
  }
  return mapped;
}

/**
 * senderUserId is the help_messages row's user_id (null for old,
 * pre-login-requirement messages sent by a visitor who wasn't signed in —
 * see help_messages_user_access_migration.sql). Those senders have no
 * account to notify or read the reply from, so the notification is only
 * sent when it's set.
 */
export async function replyHelpMessage(messageId, adminId, reply, senderLabel = null, senderUserId = null) {
  const { error } = await supabase
    .from('help_messages')
    .update({ status: 'sudah_dibalas', admin_reply: reply, replied_by: adminId, replied_at: new Date().toISOString() })
    .eq('id', messageId);
  if (error) throw error;
  await logAdminActivity('reply_help_message', 'help_message', messageId, senderLabel);

  if (senderUserId) {
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: senderUserId,
      type: 'help_message_reply',
      title: 'Admin membalas pesan kamu',
      body: senderLabel ? `Pesan "${senderLabel}" kamu sudah dibalas oleh admin.` : 'Pesan bantuan kamu sudah dibalas oleh admin.',
      link: `/bantuan-saya?tab=pesan&id=${messageId}`,
    });
    // A notification failing to insert shouldn't undo the reply itself —
    // the reply is already saved and visible on /bantuan-saya either way.
    if (notifError) console.error('Gagal mengirim notifikasi balasan pesan bantuan:', notifError);
  }
}

// ---------------------------------------------------------------------
// Kelola Kategori — dua tabel terpisah, produk vs jasa
// (product_categories, service_categories) karena strukturnya beda per
// spesifikasi §4. Satu level subkategori lewat parent_id. Butuh
// supabase/categories_migration.sql.
// ---------------------------------------------------------------------
function categoryTable(kind) {
  return kind === 'service' ? 'service_categories' : 'product_categories';
}

function mapCategoryRow(row) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/** Returns top-level categories, each with a `children` array of its subcategories. */
export async function fetchCategoryTree(kind) {
  const { data, error } = await supabase
    .from(categoryTable(kind))
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  const rows = data.map(mapCategoryRow);
  const byParent = new Map();
  rows.forEach((row) => {
    const key = row.parentId || 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(row);
  });
  const roots = byParent.get('root') || [];
  return roots.map((root) => ({ ...root, children: byParent.get(root.id) || [] }));
}

export async function createCategory(kind, { name, parentId = null }) {
  const table = categoryTable(kind);
  const { count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', parentId ?? null);
  const { error } = await supabase.from(table).insert({ name, parent_id: parentId, sort_order: count || 0 });
  if (error) throw error;
  await logAdminActivity('create_category', 'category', null, name, { kind });
}

export async function renameCategory(kind, id, name) {
  const { error } = await supabase.from(categoryTable(kind)).update({ name }).eq('id', id);
  if (error) throw error;
  await logAdminActivity('rename_category', 'category', id, name, { kind });
}

export async function deleteCategory(kind, id, categoryLabel = null) {
  const { error } = await supabase.from(categoryTable(kind)).delete().eq('id', id);
  if (error) throw error;
  await logAdminActivity('delete_category', 'category', id, categoryLabel, { kind });
}

/** Swaps sort_order with the sibling immediately before/after this one. */
export async function moveCategory(kind, siblings, id, direction) {
  const index = siblings.findIndex((s) => s.id === id);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= siblings.length) return;
  const table = categoryTable(kind);
  const a = siblings[index];
  const b = siblings[swapIndex];
  await Promise.all([
    supabase.from(table).update({ sort_order: b.sortOrder }).eq('id', a.id),
    supabase.from(table).update({ sort_order: a.sortOrder }).eq('id', b.id),
  ]);
}

// ---------------------------------------------------------------------
// Manajemen Role Admin (§2.12) — daftar akun admin + pembagian hak akses.
// Needs supabase/admin_roles_migration.sql (profiles.admin_scope).
// role tetap flat ('admin') seperti sebelumnya; admin_scope hanya menambah
// label pembagian tugas di atasnya, dibaca oleh panel — bukan lapisan RLS
// baru (lihat komentar di migration).
// ---------------------------------------------------------------------
export const ADMIN_SCOPE_LABELS = {
  full: 'Admin Penuh',
  approval: 'Admin Approval',
  support: 'Admin Support',
};

export const ADMIN_SCOPE_DESCRIPTIONS = {
  full: 'Akses penuh ke seluruh menu dashboard admin.',
  approval: 'Fokus menyetujui/menolak pendaftaran mitra, produk, dan jasa.',
  support: 'Fokus menangani laporan pengguna dan pesan pusat bantuan.',
};

function mapAdminRow(row) {
  return {
    id: row.id,
    fullName: row.full_name || '(Tanpa nama)',
    email: row.email || '-',
    avatarUrl: row.avatar_url,
    scope: row.admin_scope || 'full',
    isSuspended: row.is_suspended,
    createdAt: row.created_at,
  };
}

export async function fetchAllAdmins({ search = '' } = {}) {
  let query = supabase.from('profiles').select('*').eq('role', 'admin').order('created_at', { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  let mapped = data.map(mapAdminRow);
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    mapped = mapped.filter((a) => a.fullName.toLowerCase().includes(term) || a.email.toLowerCase().includes(term));
  }
  return mapped;
}

/** Search non-admin users by name/email, as candidates to promote to admin. */
export async function searchPromotableUsers(search) {
  if (!search.trim()) return [];
  const term = `%${search.trim()}%`;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('role', 'admin')
    .or(`full_name.ilike.${term},email.ilike.${term}`)
    .limit(8);
  if (error) throw error;
  return data.map(mapUserRow);
}

export async function promoteToAdmin(userId, scope, userLabel = null) {
  const { error } = await supabase.from('profiles').update({ role: 'admin', admin_scope: scope }).eq('id', userId);
  if (error) throw error;
  await logAdminActivity('promote_admin', 'user', userId, userLabel, { scope });

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'account_status',
    title: 'Akun kamu dijadikan Admin',
    body: `Akun kamu sekarang memiliki akses Admin (${ADMIN_SCOPE_LABELS[scope] || scope}) pada dashboard admin platform.`,
  });
}

export async function setAdminScope(adminId, scope, adminLabel = null) {
  const { error } = await supabase.from('profiles').update({ admin_scope: scope }).eq('id', adminId);
  if (error) throw error;
  await logAdminActivity('update_admin_scope', 'user', adminId, adminLabel, { scope });
}

/** Demotes an admin back to a plain buyer account. Cannot target yourself
 * (blocked both here and server-side by protect_profile_privilege). */
export async function demoteAdmin(adminId, adminLabel = null) {
  const { error } = await supabase.from('profiles').update({ role: 'buyer', admin_scope: 'full' }).eq('id', adminId);
  if (error) throw error;
  await logAdminActivity('demote_admin', 'user', adminId, adminLabel);

  await supabase.from('notifications').insert({
    user_id: adminId,
    type: 'account_status',
    title: 'Akses Admin dicabut',
    body: 'Akun kamu tidak lagi memiliki akses ke dashboard admin platform.',
  });
}

// ---------------------------------------------------------------------
// Kelola Keuangan (§2.10) — rate komisi platform + rekap, dan pencairan
// dana (withdrawal) dari penjual/penyedia jasa. Needs
// supabase/finance_migration.sql (platform_settings + withdrawals).
// ---------------------------------------------------------------------
export const WITHDRAWAL_STATUS_LABELS = {
  pending: 'Menunggu',
  processing: 'Diproses',
  completed: 'Selesai',
  rejected: 'Ditolak',
};

export async function fetchPlatformSettings() {
  const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return {
    commissionProdukPercent: Number(data.commission_produk_percent),
    commissionJasaPercent: Number(data.commission_jasa_percent),
    updatedAt: data.updated_at,
  };
}

export async function updateCommissionRates(commissionProdukPercent, commissionJasaPercent) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('platform_settings')
    .update({
      commission_produk_percent: commissionProdukPercent,
      commission_jasa_percent: commissionJasaPercent,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    })
    .eq('id', 1);
  if (error) throw error;
  await logAdminActivity('update_commission_rate', 'setting', null, 'Komisi Platform', {
    commissionProdukPercent,
    commissionJasaPercent,
  });
}

/** Rekap komisi platform dari transaksi selesai dalam rentang tanggal
 * [from, to] (ISO string, boleh null = tanpa batas), dihitung dari rate
 * SAAT INI (lihat catatan di finance_migration.sql — bukan ledger histori
 * per transaksi). */
export async function fetchCommissionRecap({ from = null, to = null } = {}) {
  const settings = await fetchPlatformSettings();

  let orderQuery = supabase.from('orders').select('id').eq('status', 'completed');
  if (from) orderQuery = orderQuery.gte('created_at', from);
  if (to) orderQuery = orderQuery.lte('created_at', to);
  const { data: orders, error: orderErr } = await orderQuery;
  if (orderErr) throw orderErr;

  let grossProduk = 0;
  if (orders.length) {
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('price, quantity, order_id')
      .in('order_id', orders.map((o) => o.id));
    if (itemsErr) throw itemsErr;
    grossProduk = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  let bookingQuery = supabase.from('bookings').select('price').eq('status', 'completed');
  if (from) bookingQuery = bookingQuery.gte('created_at', from);
  if (to) bookingQuery = bookingQuery.lte('created_at', to);
  const { data: bookings, error: bookingErr } = await bookingQuery;
  if (bookingErr) throw bookingErr;
  const grossJasa = bookings.reduce((sum, b) => sum + b.price, 0);

  const commissionProduk = Math.round((grossProduk * settings.commissionProdukPercent) / 100);
  const commissionJasa = Math.round((grossJasa * settings.commissionJasaPercent) / 100);

  return {
    produkRate: settings.commissionProdukPercent,
    jasaRate: settings.commissionJasaPercent,
    grossProduk,
    grossJasa,
    commissionProduk,
    commissionJasa,
    totalCommission: commissionProduk + commissionJasa,
    orderCount: orders.length,
    bookingCount: bookings.length,
  };
}

function mapWithdrawalRow(row) {
  return {
    id: row.id,
    storeId: row.store_id,
    storeName: row.stores?.name || '-',
    storeKind: row.stores?.kind,
    ownerName: row.stores?.profiles?.full_name || '-',
    ownerEmail: row.stores?.profiles?.email || '-',
    amount: row.amount,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountHolder: row.account_holder,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    processedAt: row.processed_at,
  };
}

export async function fetchAllWithdrawals({ status = 'all' } = {}) {
  let query = supabase
    .from('withdrawals')
    .select('*, stores(name, kind, profiles(full_name, email))')
    .order('created_at', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapWithdrawalRow);
}

export async function setWithdrawalStatus(id, status, note = null, withdrawalLabel = null) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const patch = { status, admin_note: note };
  if (status === 'completed' || status === 'rejected') {
    patch.processed_at = new Date().toISOString();
    patch.processed_by = user?.id || null;
  }
  const { error } = await supabase.from('withdrawals').update(patch).eq('id', id);
  if (error) throw error;
  await logAdminActivity('update_withdrawal_status', 'withdrawal', id, withdrawalLabel, { status, note });
}

// ---------------------------------------------------------------------
// Pengaturan Platform (§2.14) — konten statis (Syarat & Ketentuan,
// Kebijakan Privasi, Kebijakan Pembatalan, dll). Needs
// supabase/platform_content_migration.sql. Baca sisi publik ada di
// src/utils/platformContent.js — di sini hanya sisi admin (list + tulis).
// ---------------------------------------------------------------------
const DEFAULT_CONTENT_KEYS = ['syarat_ketentuan', 'kebijakan_privasi', 'kebijakan_pembatalan'];

function mapPlatformContentRow(row) {
  return {
    key: row.key,
    title: row.title,
    body: row.body || '',
    updatedAt: row.updated_at,
    isDefault: DEFAULT_CONTENT_KEYS.includes(row.key),
  };
}

export async function fetchAllPlatformContent() {
  const { data, error } = await supabase.from('platform_content').select('*').order('title', { ascending: true });
  if (error) throw error;
  return data.map(mapPlatformContentRow);
}

/** Creates a new content block (isNew) or updates an existing one's title/body. */
export async function savePlatformContent(key, { title, body }, isNew = false) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('platform_content')
    .upsert({ key, title, body, updated_at: new Date().toISOString(), updated_by: user?.id || null });
  if (error) throw error;
  await logAdminActivity(isNew ? 'create_platform_content' : 'update_platform_content', 'content', null, title);
}

export async function deletePlatformContent(key, contentLabel = null) {
  const { error } = await supabase.from('platform_content').delete().eq('key', key);
  if (error) throw error;
  await logAdminActivity('delete_platform_content', 'content', null, contentLabel);
}

/** Slugifies a title into a safe, unique-ish key for a brand-new content block. */
export function slugifyContentKey(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ---------------------------------------------------------------------
// Kelola FAQ (§2.9, opsional) — daftar pertanyaan-jawaban publik di
// Pusat Bantuan, dikelola admin. Terpisah dari inbox "Pesan Bantuan" di
// atas (itu pesan MASUK dari pengguna; ini konten yang TAMPIL ke pengguna).
// Needs supabase/faq_migration.sql. Baca sisi publik: fetchPublishedFaqs()
// di src/utils/platformContent.js.
// ---------------------------------------------------------------------
function mapFaqRow(row) {
  return {
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    updatedAt: row.updated_at,
  };
}

export async function fetchAllFaqs() {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapFaqRow);
}

/** Creates a FAQ (no id) or updates one (id). New FAQs go to the end of the list. */
export async function saveFaq({ id = null, category, question, answer, isPublished }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fields = {
    category: category.trim() || 'Umum',
    question: question.trim(),
    answer: answer.trim(),
    is_published: isPublished,
    updated_at: new Date().toISOString(),
    updated_by: user?.id || null,
  };

  if (id) {
    const { error } = await supabase.from('faqs').update(fields).eq('id', id);
    if (error) throw error;
    await logAdminActivity('update_faq', 'faq', id, fields.question);
    return;
  }

  const { data: last, error: lastError } = await supabase
    .from('faqs')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  if (lastError) throw lastError;
  const nextOrder = last?.length ? last[0].sort_order + 1 : 0;
  const { data, error } = await supabase
    .from('faqs')
    .insert({ ...fields, sort_order: nextOrder })
    .select('id')
    .single();
  if (error) throw error;
  await logAdminActivity('create_faq', 'faq', data.id, fields.question);
}

export async function deleteFaq(id, faqLabel = null) {
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw error;
  await logAdminActivity('delete_faq', 'faq', id, faqLabel);
}

/** Moves a FAQ one step up/down. Renumbers the whole list 0..n-1 (only rows
 * whose number actually changes are written), so gaps or duplicates left by
 * earlier deletes can never make a move a no-op or collide with a neighbour. */
export async function moveFaq(faqs, id, direction) {
  const index = faqs.findIndex((f) => f.id === id);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= faqs.length) return;

  const reordered = [...faqs];
  [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];

  const results = await Promise.all(
    reordered
      .map((faq, position) => ({ faq, position }))
      .filter(({ faq, position }) => faq.sortOrder !== position)
      .map(({ faq, position }) => supabase.from('faqs').update({ sort_order: position }).eq('id', faq.id)),
  );
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;
}

// ---------------------------------------------------------------------
// Kelola Log Aktivitas Admin (§2.13) — read side. Writes happen via
// logAdminActivity() above, called from every mutation in this file.
// Needs supabase/activity_log_migration.sql.
// ---------------------------------------------------------------------
export const ACTIVITY_TARGET_TYPE_LABELS = {
  user: 'Pengguna',
  store: 'Toko',
  product: 'Produk',
  service: 'Jasa',
  review: 'Ulasan',
  report: 'Laporan',
  category: 'Kategori',
  order: 'Transaksi',
  booking: 'Booking',
  help_message: 'Pesan Bantuan',
  withdrawal: 'Pencairan Dana',
  setting: 'Pengaturan',
  content: 'Konten Statis',
  faq: 'FAQ',
};

function mapActivityLogRow(row) {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.profiles?.full_name || '(Admin tidak dikenal)',
    action: row.action,
    actionLabel: ACTIVITY_ACTION_LABELS[row.action] || row.action,
    targetType: row.target_type,
    targetTypeLabel: ACTIVITY_TARGET_TYPE_LABELS[row.target_type] || row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

/** List of distinct admins who've logged an action, for the "aktor" filter dropdown. */
export async function fetchActivityLogActors() {
  const { data, error } = await supabase.from('profiles').select('id, full_name').eq('role', 'admin').order('full_name');
  if (error) throw error;
  return data.map((row) => ({ id: row.id, name: row.full_name || '(Tanpa nama)' }));
}

export async function fetchActivityLog({ search = '', actorId = 'all', targetType = 'all', dateFrom = null, dateTo = null } = {}) {
  let query = supabase
    .from('admin_activity_log')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (actorId !== 'all') query = query.eq('actor_id', actorId);
  if (targetType !== 'all') query = query.eq('target_type', targetType);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo);
  const { data, error } = await query;
  if (error) throw error;
  let mapped = data.map(mapActivityLogRow);
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    mapped = mapped.filter(
      (log) =>
        log.actorName.toLowerCase().includes(term) ||
        log.actionLabel.toLowerCase().includes(term) ||
        (log.targetLabel || '').toLowerCase().includes(term),
    );
  }
  return mapped;
}
