import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';
import { logAdminActivity } from '@/lib/adminLog';
import { notify } from '@/lib/notify';
import { mapDashboardProduct, mapDashboardService } from '@/lib/mappers';

const SUMMARY_ORDER_STATUSES = ['processing', 'shipped', 'completed'];
const SUMMARY_BOOKING_STATUSES = ['confirmed', 'in_progress', 'completed'];
const DEFAULT_CONTENT_KEYS = ['syarat_ketentuan', 'kebijakan_privasi', 'kebijakan_pembatalan'];

const ADMIN_SCOPE_LABELS = {
  full: 'Admin Penuh',
  approval: 'Admin Approval',
  support: 'Admin Support',
};

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

function mapAdminStoreRow(row) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    location: row.location,
    district: row.district,
    trusted: row.trusted,
    fastResponse: row.fast_response,
    rating: Number(row.rating || 0),
    createdAt: row.created_at,
    ownerId: row.owner_id,
    ownerName: row.profile?.full_name || '-',
    ownerEmail: row.profile?.email || '-',
    listingCount: row.kind === 'service' ? row._count?.services || 0 : row._count?.products || 0,
  };
}

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
    storeName: row.store?.name || '-',
    ownerName: row.store?.profile?.full_name || '-',
  };
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
    storeName: row.store?.name || '-',
    ownerName: row.store?.profile?.full_name || '-',
  };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export async function fetchTransactionSummary() {
  const today = startOfToday();
  const week = startOfWeek();
  const [orders, bookings] = await Promise.all([
    prisma.orders.findMany({
      where: { status: { in: SUMMARY_ORDER_STATUSES }, created_at: { gte: week } },
      select: { id: true, total: true, created_at: true },
    }),
    prisma.bookings.findMany({
      where: { status: { in: SUMMARY_BOOKING_STATUSES }, created_at: { gte: week } },
      select: { id: true, price: true, created_at: true },
    }),
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
  return { today: bucket(today), week: bucket(week) };
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
  ] = await Promise.all([
    prisma.profiles.count({ where: { role: 'buyer' } }),
    prisma.profiles.count({ where: { role: 'seller' } }),
    prisma.profiles.count({ where: { role: 'service' } }),
    prisma.profiles.count({ where: { role: 'seller', seller_status: 'pending' } }),
    prisma.profiles.count({ where: { role: 'service', provider_status: 'pending' } }),
    prisma.profiles.count({ where: { is_suspended: true } }),
    prisma.products.count(),
    prisma.products.count({ where: { is_active: true } }),
    prisma.services.count(),
    prisma.services.count({ where: { is_active: true } }),
    prisma.reviews.count(),
    prisma.stores.count(),
    prisma.help_messages.count({ where: { status: 'belum_dibalas' } }),
    prisma.reports.count({ where: { status: 'baru' } }),
    prisma.reports.count({ where: { status: 'diproses' } }),
    prisma.products.count({ where: { approval_status: 'pending' } }),
    prisma.services.count({ where: { approval_status: 'pending' } }),
  ]);
  let transactionSummary = null;
  try {
    transactionSummary = await fetchTransactionSummary();
  } catch (err) {
    console.error('fetchTransactionSummary failed:', err);
  }
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

export async function fetchPartnerApplications({ status = 'pending' } = {}) {
  const where = { role: { in: ['seller', 'service'] } };
  if (status === 'all') {
    where.OR = [{ seller_status: { not: 'none' } }, { provider_status: { not: 'none' } }];
  } else if (status === 'none') {
    where.seller_status = 'none';
    where.provider_status = 'none';
  } else {
    where.OR = [{ seller_status: status }, { provider_status: status }];
  }
  const data = await prisma.profiles.findMany({
    where,
    orderBy: { partner_submitted_at: 'desc' },
  });
  return data.map(mapUserRow);
}

export async function reviewPartnerApplication(admin, userId, type, decision, reason, userLabel = null) {
  const field = type === 'service' ? 'provider_status' : 'seller_status';
  await prisma.profiles.update({ where: { id: userId }, data: { [field]: decision } });
  await logAdminActivity(
    admin,
    decision === 'approved' ? 'approve_partner' : 'reject_partner',
    'user',
    userId,
    userLabel,
    reason ? { type, reason } : { type },
  );
  await notify(userId, {
    type: 'partner_application',
    title: decision === 'approved' ? 'Pendaftaran mitra disetujui' : 'Pendaftaran mitra ditolak',
    body:
      decision === 'approved'
        ? 'Selamat! Akun mitra kamu sudah aktif — kamu sekarang bisa membuka dashboard dan mulai berjualan/menerima booking.'
        : reason || 'Pengajuan mitra kamu belum bisa disetujui. Silakan ajukan ulang dengan data yang lebih lengkap.',
    link: decision === 'approved' ? (type === 'service' ? '/dashboard/jasa' : '/dashboard/toko') : '/pengajuan-ulang',
  });
  return { ok: true };
}

export async function fetchAllUsers({ search = '', role = 'all' } = {}) {
  const where = {};
  if (role !== 'all') where.role = role;
  if (search.trim()) {
    where.OR = [
      { full_name: { contains: search.trim() } },
      { email: { contains: search.trim() } },
    ];
  }
  const data = await prisma.profiles.findMany({ where, orderBy: { created_at: 'desc' } });
  return data.map(mapUserRow);
}

export async function setUserSuspended(admin, userId, isSuspended, reason = null, userLabel = null) {
  await prisma.profiles.update({
    where: { id: userId },
    data: { is_suspended: isSuspended, suspended_reason: isSuspended ? reason : null },
  });
  await logAdminActivity(
    admin,
    isSuspended ? 'suspend_user' : 'unsuspend_user',
    'user',
    userId,
    userLabel,
    isSuspended ? { reason } : null,
  );
  await notify(userId, {
    type: 'account_status',
    title: isSuspended ? 'Akun kamu disuspend sementara' : 'Akun kamu diaktifkan kembali',
    body: isSuspended
      ? reason || 'Akun kamu dinonaktifkan sementara oleh admin karena melanggar ketentuan platform.'
      : 'Akun kamu sudah aktif kembali dan dapat digunakan seperti biasa.',
  });
  return { ok: true };
}

export async function fetchAllStores() {
  const data = await prisma.stores.findMany({
    include: { profile: { select: { full_name: true, email: true } }, _count: { select: { products: true, services: true } } },
    orderBy: { created_at: 'desc' },
  });
  return data.map(mapAdminStoreRow);
}

export async function fetchStoreById(storeId) {
  const data = await prisma.stores.findUnique({
    where: { id: storeId },
    include: { profile: { select: { full_name: true, email: true } }, _count: { select: { products: true, services: true } } },
  });
  if (!data) throw new HttpError(404, 'Toko tidak ditemukan.');
  return mapAdminStoreRow(data);
}

export async function fetchProductsByStore(storeId) {
  const data = await prisma.products.findMany({ where: { store_id: storeId }, orderBy: { created_at: 'desc' } });
  return data.map(mapDashboardProduct);
}

export async function fetchServicesByStore(storeId) {
  const data = await prisma.services.findMany({ where: { store_id: storeId }, orderBy: { created_at: 'desc' } });
  return data.map(mapDashboardService);
}

export async function fetchAllProducts({ approvalStatus = 'all' } = {}) {
  const where = approvalStatus === 'all' ? {} : { approval_status: approvalStatus };
  const data = await prisma.products.findMany({
    where,
    include: { store: { include: { profile: { select: { full_name: true } } } } },
    orderBy: { created_at: 'desc' },
  });
  return data.map(mapProductRow);
}

export async function setProductActive(admin, id, isActive, productLabel = null) {
  await prisma.products.update({ where: { id }, data: { is_active: isActive } });
  await logAdminActivity(admin, isActive ? 'activate_product' : 'deactivate_product', 'product', id, productLabel);
  return { ok: true };
}

export async function deleteProductAdmin(admin, id, productLabel = null) {
  await prisma.products.delete({ where: { id } });
  await logAdminActivity(admin, 'delete_product', 'product', id, productLabel);
  return { ok: true };
}

export async function fetchAllServices({ approvalStatus = 'all' } = {}) {
  const where = approvalStatus === 'all' ? {} : { approval_status: approvalStatus };
  const data = await prisma.services.findMany({
    where,
    include: { store: { include: { profile: { select: { full_name: true } } } } },
    orderBy: { created_at: 'desc' },
  });
  return data.map(mapServiceRow);
}

export async function reviewListing(admin, kind, id, decision, reason = null, listingLabel = null) {
  if (decision !== 'approved' && decision !== 'rejected') throw new HttpError(400, `Invalid decision: ${decision}`);
  const cleanReason = (reason || '').trim();
  if (decision === 'rejected' && !cleanReason) throw new HttpError(400, 'Alasan penolakan wajib diisi.');
  const isService = kind === 'service';
  const model = isService ? prisma.services : prisma.products;
  const data = await model.update({
    where: { id },
    data: {
      approval_status: decision,
      rejection_reason: decision === 'rejected' ? cleanReason : null,
      reviewed_by: admin.id,
      reviewed_at: new Date(),
    },
    include: { store: { select: { owner_id: true } } },
  });
  const name = listingLabel || data?.name || null;
  const action = `${decision === 'approved' ? 'approve' : 'reject'}_${isService ? 'service' : 'product'}`;
  await logAdminActivity(admin, action, isService ? 'service' : 'product', id, name, decision === 'rejected' ? { reason: cleanReason } : null);
  const ownerId = data?.store?.owner_id;
  if (ownerId) {
    const noun = isService ? 'Jasa' : 'Produk';
    await notify(ownerId, {
      type: 'listing_review',
      title: decision === 'approved' ? `${noun} kamu disetujui` : `${noun} kamu ditolak`,
      body:
        decision === 'approved'
          ? `"${data.name}" sudah disetujui dan sekarang tayang di platform.`
          : `"${data.name}" belum bisa disetujui: ${cleanReason} Perbarui listing-nya, lalu akan ditinjau ulang.`,
      link: isService ? '/dashboard/jasa/layanan' : '/dashboard/toko/produk',
    });
  }
  return { ok: true };
}

export async function setServiceActive(admin, id, isActive, serviceLabel = null) {
  await prisma.services.update({ where: { id }, data: { is_active: isActive } });
  await logAdminActivity(admin, isActive ? 'activate_service' : 'deactivate_service', 'service', id, serviceLabel);
  return { ok: true };
}

export async function deleteServiceAdmin(admin, id, serviceLabel = null) {
  await prisma.services.delete({ where: { id } });
  await logAdminActivity(admin, 'delete_service', 'service', id, serviceLabel);
  return { ok: true };
}

export async function fetchAllReviews() {
  const data = await prisma.reviews.findMany({
    include: { author: { select: { full_name: true } }, product: { select: { name: true } }, service: { select: { name: true } } },
    orderBy: { created_at: 'desc' },
  });
  return data.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    reply: row.reply,
    createdAt: row.created_at,
    authorName: row.author?.full_name || 'Pengguna',
    targetName: row.product?.name || row.service?.name || '-',
    targetType: row.product_id ? 'product' : 'service',
  }));
}

export async function deleteReviewAdmin(admin, id, reviewLabel = null) {
  await prisma.reviews.delete({ where: { id } });
  await logAdminActivity(admin, 'delete_review', 'review', id, reviewLabel);
  return { ok: true };
}

function mapAdminOrderRow(row) {
  return {
    id: row.id,
    status: row.status,
    paymentMethod: row.payment_method,
    subtotal: row.subtotal,
    shippingCost: row.shipping_cost,
    total: row.total,
    trackingNumber: row.tracking_number,
    createdAt: row.created_at,
    payment: row.payment
      ? {
          status: row.payment.status,
          method: row.payment.payment_type || null,
          paidAt: row.payment.paid_at,
          expiresAt: row.payment.expires_at,
        }
      : null,
    buyerName: row.profile?.full_name || '-',
    buyerEmail: row.profile?.email || '-',
    items: (row.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      variant: item.variant,
      price: item.price,
      quantity: item.quantity,
      storeName: item.store?.name || '-',
    })),
  };
}

export async function fetchAllOrders({ search = '', status = 'all' } = {}) {
  const where = status === 'all' ? {} : { status };
  const data = await prisma.orders.findMany({
    where,
    include: { profile: { select: { full_name: true, email: true } }, items: { include: { store: { select: { name: true } } } }, payment: true },
    orderBy: { created_at: 'desc' },
  });
  let mapped = data.map(mapAdminOrderRow);
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

export async function fetchAllBookings({ search = '', status = 'all' } = {}) {
  const where = status === 'all' ? {} : { status };
  const data = await prisma.bookings.findMany({
    where,
    include: {
      buyer: { select: { full_name: true, email: true } },
      pet: { select: { name: true } },
      service: { include: { store: { select: { name: true } } } },
      package: { select: { name: true } },
    },
    orderBy: { created_at: 'desc' },
  });
  let mapped = data.map((row) => ({
    id: row.id,
    status: row.status,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    price: row.price,
    notes: row.notes,
    createdAt: row.created_at,
    buyerName: row.buyer?.full_name || '-',
    buyerEmail: row.buyer?.email || '-',
    petName: row.pet?.name || '-',
    serviceName: row.service?.name || '-',
    storeName: row.service?.store?.name || '-',
    packageName: row.package?.name || null,
  }));
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

async function namesForReports(rows) {
  const productIds = rows.map((r) => r.product_id).filter(Boolean);
  const serviceIds = rows.map((r) => r.service_id).filter(Boolean);
  const [products, services] = await Promise.all([
    productIds.length ? prisma.products.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }) : [],
    serviceIds.length ? prisma.services.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } }) : [],
  ]);
  return {
    products: Object.fromEntries(products.map((p) => [p.id, p.name])),
    services: Object.fromEntries(services.map((s) => [s.id, s.name])),
  };
}

export async function fetchAllReports({ search = '', status = 'all', priority = 'all' } = {}) {
  const where = {};
  if (status !== 'all') where.status = status;
  if (priority !== 'all') where.priority = priority;
  const data = await prisma.reports.findMany({
    where,
    include: {
      reporter: { select: { full_name: true, email: true } },
      reported_user: { select: { full_name: true, email: true } },
      reported_store: { select: { name: true } },
    },
    orderBy: { created_at: 'desc' },
  });
  const names = await namesForReports(data);
  let mapped = data.map((row) => ({
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
    productName: names.products[row.product_id] || null,
    serviceId: row.service_id,
    serviceName: names.services[row.service_id] || null,
  }));
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

export async function setReportStatus(admin, reportId, status, reportLabel = null, reporterId = null) {
  await prisma.reports.update({ where: { id: reportId }, data: { status } });
  await logAdminActivity(admin, 'update_report_status', 'report', reportId, reportLabel, { status });
  if (reporterId && (status === 'diproses' || status === 'selesai')) {
    await notify(reporterId, {
      type: 'report_status',
      title: status === 'selesai' ? 'Laporan kamu sudah selesai ditangani' : 'Laporan kamu sedang diproses',
      body:
        status === 'selesai'
          ? `Laporan "${reportLabel || 'kamu'}" sudah selesai ditangani oleh admin.`
          : `Laporan "${reportLabel || 'kamu'}" sedang ditangani oleh admin.`,
      link: `/bantuan-saya?tab=laporan&id=${reportId}`,
    });
  }
  return { ok: true };
}

export async function setReportPriority(admin, reportId, priority, reportLabel = null) {
  await prisma.reports.update({ where: { id: reportId }, data: { priority } });
  await logAdminActivity(admin, 'update_report_priority', 'report', reportId, reportLabel, { priority });
  return { ok: true };
}

export async function fetchReportMessages(reportId) {
  const data = await prisma.report_messages.findMany({
    where: { report_id: reportId },
    include: { sender: { select: { full_name: true } } },
    orderBy: { created_at: 'asc' },
  });
  return data.map((row) => ({
    id: row.id,
    reportId: row.report_id,
    senderId: row.sender_id,
    senderName: row.sender?.full_name || (row.is_admin ? 'Admin' : '-'),
    isAdmin: row.is_admin,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function sendReportReply(admin, reportId, body, reportLabel = null, reporterId = null) {
  await prisma.report_messages.create({
    data: { report_id: reportId, sender_id: admin.id, is_admin: true, body },
  });
  await prisma.reports.updateMany({ where: { id: reportId, status: 'baru' }, data: { status: 'diproses' } });
  await logAdminActivity(admin, 'reply_report', 'report', reportId, reportLabel);
  if (reporterId) {
    await notify(reporterId, {
      type: 'report_reply',
      title: 'Admin membalas laporan kamu',
      body: `Laporan "${reportLabel || 'kamu'}" sudah dibalas oleh admin.`,
      link: `/bantuan-saya?tab=laporan&id=${reportId}`,
    });
  }
  return { ok: true };
}

export async function fetchHelpMessages({ search = '', status = 'all' } = {}) {
  const where = status === 'all' ? {} : { status };
  const data = await prisma.help_messages.findMany({
    where,
    include: { replier: { select: { full_name: true } } },
    orderBy: { created_at: 'desc' },
  });
  let mapped = data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    subject: row.subject || '-',
    body: row.body,
    status: row.status,
    adminReply: row.admin_reply,
    repliedByName: row.replier?.full_name || null,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
  }));
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

export async function replyHelpMessage(admin, messageId, reply, senderLabel = null, senderUserId = null) {
  await prisma.help_messages.update({
    where: { id: messageId },
    data: { status: 'sudah_dibalas', admin_reply: reply, replied_by: admin.id, replied_at: new Date() },
  });
  await logAdminActivity(admin, 'reply_help_message', 'help_message', messageId, senderLabel);
  if (senderUserId) {
    await notify(senderUserId, {
      type: 'help_message_reply',
      title: 'Admin membalas pesan kamu',
      body: senderLabel ? `Pesan "${senderLabel}" kamu sudah dibalas oleh admin.` : 'Pesan bantuan kamu sudah dibalas oleh admin.',
      link: `/bantuan-saya?tab=pesan&id=${messageId}`,
    });
  }
  return { ok: true };
}

function categoryModel(kind) {
  return kind === 'service' ? prisma.service_categories : prisma.product_categories;
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

export async function fetchCategoryTree(kind) {
  const data = await categoryModel(kind).findMany({ orderBy: { sort_order: 'asc' } });
  const rows = data.map(mapCategoryRow);
  const byParent = new Map();
  rows.forEach((row) => {
    const key = row.parentId || 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(row);
  });
  return (byParent.get('root') || []).map((root) => ({ ...root, children: byParent.get(root.id) || [] }));
}

export async function createCategory(admin, kind, { name, parentId = null }) {
  const count = await categoryModel(kind).count({ where: { parent_id: parentId } });
  await categoryModel(kind).create({ data: { name, parent_id: parentId, sort_order: count || 0 } });
  await logAdminActivity(admin, 'create_category', 'category', null, name, { kind });
  return { ok: true };
}

export async function renameCategory(admin, kind, id, name) {
  await categoryModel(kind).update({ where: { id }, data: { name } });
  await logAdminActivity(admin, 'rename_category', 'category', id, name, { kind });
  return { ok: true };
}

export async function deleteCategory(admin, kind, id, categoryLabel = null) {
  await categoryModel(kind).delete({ where: { id } });
  await logAdminActivity(admin, 'delete_category', 'category', id, categoryLabel, { kind });
  return { ok: true };
}

export async function moveCategory(kind, siblings, id, direction) {
  const index = siblings.findIndex((s) => s.id === id);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= siblings.length) return { ok: true };
  const a = siblings[index];
  const b = siblings[swapIndex];
  await prisma.$transaction([
    categoryModel(kind).update({ where: { id: a.id }, data: { sort_order: b.sortOrder } }),
    categoryModel(kind).update({ where: { id: b.id }, data: { sort_order: a.sortOrder } }),
  ]);
  return { ok: true };
}

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
  const data = await prisma.profiles.findMany({ where: { role: 'admin' }, orderBy: { created_at: 'asc' } });
  let mapped = data.map(mapAdminRow);
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    mapped = mapped.filter((a) => a.fullName.toLowerCase().includes(term) || a.email.toLowerCase().includes(term));
  }
  return mapped;
}

export async function searchPromotableUsers(search) {
  if (!search.trim()) return [];
  const term = search.trim();
  const data = await prisma.profiles.findMany({
    where: {
      role: { not: 'admin' },
      OR: [{ full_name: { contains: term } }, { email: { contains: term } }],
    },
    take: 8,
  });
  return data.map(mapUserRow);
}

export async function promoteToAdmin(admin, userId, scope, userLabel = null) {
  await prisma.profiles.update({ where: { id: userId }, data: { role: 'admin', admin_scope: scope } });
  await logAdminActivity(admin, 'promote_admin', 'user', userId, userLabel, { scope });
  await notify(userId, {
    type: 'account_status',
    title: 'Akun kamu dijadikan Admin',
    body: `Akun kamu sekarang memiliki akses Admin (${ADMIN_SCOPE_LABELS[scope] || scope}) pada dashboard admin platform.`,
  });
  return { ok: true };
}

export async function setAdminScope(admin, adminId, scope, adminLabel = null) {
  await prisma.profiles.update({ where: { id: adminId }, data: { admin_scope: scope } });
  await logAdminActivity(admin, 'update_admin_scope', 'user', adminId, adminLabel, { scope });
  return { ok: true };
}

export async function demoteAdmin(admin, adminId, adminLabel = null) {
  if (adminId === admin.id) throw new HttpError(400, 'Tidak bisa menurunkan diri sendiri.');
  await prisma.profiles.update({ where: { id: adminId }, data: { role: 'buyer', admin_scope: 'full' } });
  await logAdminActivity(admin, 'demote_admin', 'user', adminId, adminLabel);
  await notify(adminId, {
    type: 'account_status',
    title: 'Akses Admin dicabut',
    body: 'Akun kamu tidak lagi memiliki akses ke dashboard admin platform.',
  });
  return { ok: true };
}

export async function fetchPlatformSettings() {
  const data = await prisma.platform_settings.findUnique({ where: { id: 1 } });
  if (!data) {
    const created = await prisma.platform_settings.create({ data: { id: 1 } });
    return {
      commissionProdukPercent: Number(created.commission_produk_percent),
      commissionJasaPercent: Number(created.commission_jasa_percent),
      updatedAt: created.updated_at,
    };
  }
  return {
    commissionProdukPercent: Number(data.commission_produk_percent),
    commissionJasaPercent: Number(data.commission_jasa_percent),
    updatedAt: data.updated_at,
  };
}

export async function updateCommissionRates(admin, commissionProdukPercent, commissionJasaPercent) {
  await prisma.platform_settings.upsert({
    where: { id: 1 },
    update: {
      commission_produk_percent: commissionProdukPercent,
      commission_jasa_percent: commissionJasaPercent,
      updated_by: admin.id,
    },
    create: {
      id: 1,
      commission_produk_percent: commissionProdukPercent,
      commission_jasa_percent: commissionJasaPercent,
      updated_by: admin.id,
    },
  });
  await logAdminActivity(admin, 'update_commission_rate', 'setting', null, 'Komisi Platform', {
    commissionProdukPercent,
    commissionJasaPercent,
  });
  return { ok: true };
}

export async function fetchCommissionRecap({ from = null, to = null } = {}) {
  const settings = await fetchPlatformSettings();
  const createdFilter = {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
  const orderWhere = { status: 'completed', ...(from || to ? { created_at: createdFilter } : {}) };
  const orders = await prisma.orders.findMany({ where: orderWhere, select: { id: true } });
  let grossProduk = 0;
  if (orders.length) {
    const items = await prisma.order_items.findMany({
      where: { order_id: { in: orders.map((o) => o.id) } },
      select: { price: true, quantity: true },
    });
    grossProduk = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  const bookings = await prisma.bookings.findMany({
    where: { status: 'completed', ...(from || to ? { created_at: createdFilter } : {}) },
    select: { price: true },
  });
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

export async function fetchAllWithdrawals({ status = 'all' } = {}) {
  const where = status === 'all' ? {} : { status };
  const data = await prisma.withdrawals.findMany({
    where,
    include: { store: { include: { profile: { select: { full_name: true, email: true } } } } },
    orderBy: { created_at: 'desc' },
  });
  return data.map((row) => ({
    id: row.id,
    storeId: row.store_id,
    storeName: row.store?.name || '-',
    storeKind: row.store?.kind,
    ownerName: row.store?.profile?.full_name || '-',
    ownerEmail: row.store?.profile?.email || '-',
    amount: row.amount,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountHolder: row.account_holder,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    processedAt: row.processed_at,
  }));
}

export async function setWithdrawalStatus(admin, id, status, note = null, withdrawalLabel = null) {
  const patch = { status, admin_note: note };
  if (status === 'completed' || status === 'rejected') {
    patch.processed_at = new Date();
    patch.processed_by = admin.id;
  }
  await prisma.withdrawals.update({ where: { id }, data: patch });
  await logAdminActivity(admin, 'update_withdrawal_status', 'withdrawal', id, withdrawalLabel, { status, note });
  return { ok: true };
}

export async function fetchAllPlatformContent() {
  const data = await prisma.platform_content.findMany({ orderBy: { title: 'asc' } });
  return data.map((row) => ({
    key: row.key,
    title: row.title,
    body: row.body || '',
    updatedAt: row.updated_at,
    isDefault: DEFAULT_CONTENT_KEYS.includes(row.key),
  }));
}

export async function savePlatformContent(admin, key, { title, body }, isNew = false) {
  await prisma.platform_content.upsert({
    where: { key },
    update: { title, body, updated_by: admin.id },
    create: { key, title, body, updated_by: admin.id },
  });
  await logAdminActivity(admin, isNew ? 'create_platform_content' : 'update_platform_content', 'content', null, title);
  return { ok: true };
}

export async function deletePlatformContent(admin, key, contentLabel = null) {
  await prisma.platform_content.delete({ where: { key } });
  await logAdminActivity(admin, 'delete_platform_content', 'content', null, contentLabel);
  return { ok: true };
}

export async function fetchAllFaqs() {
  const data = await prisma.faqs.findMany({ orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }] });
  return data.map((row) => ({
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    updatedAt: row.updated_at,
  }));
}

export async function saveFaq(admin, { id = null, category, question, answer, isPublished }) {
  const fields = {
    category: category.trim() || 'Umum',
    question: question.trim(),
    answer: answer.trim(),
    is_published: isPublished,
    updated_by: admin.id,
  };
  if (id) {
    await prisma.faqs.update({ where: { id }, data: fields });
    await logAdminActivity(admin, 'update_faq', 'faq', id, fields.question);
    return { ok: true };
  }
  const last = await prisma.faqs.findFirst({ orderBy: { sort_order: 'desc' }, select: { sort_order: true } });
  const created = await prisma.faqs.create({ data: { ...fields, sort_order: last ? last.sort_order + 1 : 0 } });
  await logAdminActivity(admin, 'create_faq', 'faq', created.id, fields.question);
  return { ok: true };
}

export async function deleteFaq(admin, id, faqLabel = null) {
  await prisma.faqs.delete({ where: { id } });
  await logAdminActivity(admin, 'delete_faq', 'faq', id, faqLabel);
  return { ok: true };
}

export async function moveFaq(faqs, id, direction) {
  const index = faqs.findIndex((f) => f.id === id);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= faqs.length) return { ok: true };
  const reordered = [...faqs];
  [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
  await prisma.$transaction(
    reordered
      .map((faq, position) => ({ faq, position }))
      .filter(({ faq, position }) => faq.sortOrder !== position)
      .map(({ faq, position }) => prisma.faqs.update({ where: { id: faq.id }, data: { sort_order: position } })),
  );
  return { ok: true };
}

export async function fetchActivityLogActors() {
  const data = await prisma.profiles.findMany({
    where: { role: 'admin' },
    select: { id: true, full_name: true },
    orderBy: { full_name: 'asc' },
  });
  return data.map((row) => ({ id: row.id, name: row.full_name || '(Tanpa nama)' }));
}

export async function fetchActivityLog({ search = '', actorId = 'all', targetType = 'all', dateFrom = null, dateTo = null } = {}) {
  const where = {};
  if (actorId !== 'all') where.actor_id = actorId;
  if (targetType !== 'all') where.target_type = targetType;
  if (dateFrom || dateTo) {
    where.created_at = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }
  const data = await prisma.admin_activity_log.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: 500,
  });
  let mapped = data.map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name || '(Admin tidak dikenal)',
    action: row.action,
    actionLabel: row.action_label,
    targetType: row.target_type,
    targetTypeLabel: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    detail: row.detail,
    createdAt: row.created_at,
  }));
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    mapped = mapped.filter(
      (log) =>
        log.actorName.toLowerCase().includes(term) ||
        (log.actionLabel || '').toLowerCase().includes(term) ||
        (log.targetLabel || '').toLowerCase().includes(term),
    );
  }
  return mapped;
}
