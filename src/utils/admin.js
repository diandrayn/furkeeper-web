import { apiGet, apiPost } from '../lib/apiClient';

const get = (action, params) => apiGet(`/api/admin/${action}`, params);
const post = (action, payload) => apiPost(`/api/admin/${action}`, payload);

export const LISTING_APPROVAL_LABELS = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

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

export const HELP_MESSAGE_STATUS_LABELS = {
  belum_dibalas: 'Belum Dibalas',
  sudah_dibalas: 'Sudah Dibalas',
};

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
  in_progress: 'Sedang Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const WITHDRAWAL_STATUS_LABELS = {
  pending: 'Menunggu',
  processing: 'Diproses',
  completed: 'Selesai',
  rejected: 'Ditolak',
};

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

export const ACTIVITY_TARGET_TYPE_LABELS = {
  user: 'Pengguna',
  store: 'Toko',
  product: 'Produk',
  service: 'Jasa',
  review: 'Ulasan',
  report: 'Laporan',
  category: 'Kategori',
  order: 'Pesanan',
  booking: 'Booking',
  help_message: 'Pesan bantuan',
  faq: 'FAQ',
  content: 'Konten',
  setting: 'Pengaturan',
  withdrawal: 'Pencairan dana',
};

export const fetchTransactionSummary = () => get('fetchTransactionSummary');
export const fetchAdminStats = () => get('fetchAdminStats');
export const fetchPartnerApplications = (options = {}) => get('fetchPartnerApplications', options);
export const reviewPartnerApplication = (userId, type, decision, reason, userLabel) =>
  post('reviewPartnerApplication', { userId, type, decision, reason, userLabel });
export const fetchAllUsers = (options = {}) => get('fetchAllUsers', options);
export const setUserSuspended = (userId, isSuspended, reason, userLabel) =>
  post('setUserSuspended', { userId, isSuspended, reason, userLabel });
export const fetchAllStores = () => get('fetchAllStores');
export const fetchStoreById = (storeId) => get('fetchStoreById', { storeId });
export const fetchProductsByStore = (storeId) => get('fetchProductsByStore', { storeId });
export const fetchServicesByStore = (storeId) => get('fetchServicesByStore', { storeId });
export const fetchAllProducts = (options = {}) => get('fetchAllProducts', options);
export const setProductActive = (id, isActive, productLabel) =>
  post('setProductActive', { id, isActive, productLabel });
export const deleteProductAdmin = (id, productLabel) => post('deleteProductAdmin', { id, productLabel });
export const fetchAllServices = (options = {}) => get('fetchAllServices', options);
export const reviewListing = (kind, id, decision, reason, listingLabel) =>
  post('reviewListing', { kind, id, decision, reason, listingLabel });
export const setServiceActive = (id, isActive, serviceLabel) =>
  post('setServiceActive', { id, isActive, serviceLabel });
export const deleteServiceAdmin = (id, serviceLabel) => post('deleteServiceAdmin', { id, serviceLabel });
export const fetchAllReviews = () => get('fetchAllReviews');
export const deleteReviewAdmin = (id, reviewLabel) => post('deleteReviewAdmin', { id, reviewLabel });
export const fetchAllOrders = (options = {}) => get('fetchAllOrders', options);
export const fetchAllBookings = (options = {}) => get('fetchAllBookings', options);
export const fetchAllReports = (options = {}) => get('fetchAllReports', options);
export const setReportStatus = (reportId, status, reportLabel, reporterId) =>
  post('setReportStatus', { reportId, status, reportLabel, reporterId });
export const setReportPriority = (reportId, priority, reportLabel) =>
  post('setReportPriority', { reportId, priority, reportLabel });
export const fetchReportMessages = (reportId) => get('fetchReportMessages', { reportId });
export const sendReportReply = (reportId, body, reportLabel, reporterId) =>
  post('sendReportReply', { reportId, body, reportLabel, reporterId });
export const fetchHelpMessages = (options = {}) => get('fetchHelpMessages', options);
export const replyHelpMessage = (messageId, reply, senderLabel, senderUserId) =>
  post('replyHelpMessage', { messageId, reply, senderLabel, senderUserId });
export const fetchCategoryTree = (kind) => get('fetchCategoryTree', { kind });
export const createCategory = (kind, payload) => post('createCategory', { kind, ...payload });
export const renameCategory = (kind, id, name) => post('renameCategory', { kind, id, name });
export const deleteCategory = (kind, id, categoryLabel) =>
  post('deleteCategory', { kind, id, categoryLabel });
export const moveCategory = (kind, siblings, id, direction) =>
  post('moveCategory', { kind, siblings, id, direction });
export const fetchAllAdmins = (options = {}) => get('fetchAllAdmins', options);
export const searchPromotableUsers = (search) => get('searchPromotableUsers', { search });
export const promoteToAdmin = (userId, scope, userLabel) =>
  post('promoteToAdmin', { userId, scope, userLabel });
export const setAdminScope = (adminId, scope, adminLabel) =>
  post('setAdminScope', { adminId, scope, adminLabel });
export const demoteAdmin = (adminId, adminLabel) => post('demoteAdmin', { adminId, adminLabel });
export const fetchPlatformSettings = () => get('fetchPlatformSettings');
export const updateCommissionRates = (commissionProdukPercent, commissionJasaPercent) =>
  post('updateCommissionRates', { commissionProdukPercent, commissionJasaPercent });
export const fetchCommissionRecap = (options = {}) => get('fetchCommissionRecap', options);
export const fetchAllWithdrawals = (options = {}) => get('fetchAllWithdrawals', options);
export const setWithdrawalStatus = (id, status, note, withdrawalLabel) =>
  post('setWithdrawalStatus', { id, status, note, withdrawalLabel });
export const fetchAllPlatformContent = () => get('fetchAllPlatformContent');
export const savePlatformContent = (key, content, isNew) =>
  post('savePlatformContent', { key, content, isNew });
export const deletePlatformContent = (key, contentLabel) =>
  post('deletePlatformContent', { key, contentLabel });
export const fetchAllFaqs = () => get('fetchAllFaqs');
export const saveFaq = (faq) => post('saveFaq', { faq });
export const deleteFaq = (id, faqLabel) => post('deleteFaq', { id, faqLabel });
export const moveFaq = (faqs, id, direction) => post('moveFaq', { faqs, id, direction });
export const fetchActivityLogActors = () => get('fetchActivityLogActors');
export const fetchActivityLog = (options = {}) => get('fetchActivityLog', options);

export function slugifyContentKey(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
