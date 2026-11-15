import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';

export class ReportError extends HttpError {
  constructor(code, message) {
    super(400, message, { code });
    this.code = code;
    this.name = 'ReportError';
  }
}

function mapMyReportRow(row, productName, serviceName) {
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
    productName: productName || null,
    serviceId: row.service_id,
    serviceName: serviceName || null,
  };
}

export async function submitReport(user, payload) {
  const store = await prisma.stores.findUnique({ where: { id: payload.reportedStoreId } });
  if (!store) throw new HttpError(404, 'Toko tidak ditemukan.');
  if (store.owner_id === user.id) {
    throw new ReportError('self', 'Kamu tidak bisa melaporkan toko/jasa milik sendiri.');
  }

  const duplicateWhere = {
    reporter_id: user.id,
    reported_store_id: payload.reportedStoreId,
    status: { in: ['baru', 'diproses'] },
  };
  if (payload.orderId) duplicateWhere.order_id = payload.orderId;
  else if (payload.bookingId) duplicateWhere.booking_id = payload.bookingId;
  else if (payload.productId) duplicateWhere.product_id = payload.productId;
  else if (payload.serviceId) duplicateWhere.service_id = payload.serviceId;

  const duplicate = await prisma.reports.findFirst({ where: duplicateWhere, select: { id: true } });
  if (duplicate) {
    throw new ReportError(
      'duplicate',
      'Kamu sudah mengajukan laporan untuk ini dan laporannya masih diproses admin.',
    );
  }

  const row = await prisma.reports.create({
    data: {
      reporter_id: user.id,
      reported_store_id: payload.reportedStoreId,
      category: payload.category,
      description: payload.description,
      order_id: payload.orderId || null,
      booking_id: payload.bookingId || null,
      product_id: payload.productId || null,
      service_id: payload.serviceId || null,
    },
  });
  return row.id;
}

export async function fetchMyReports(user) {
  const rows = await prisma.reports.findMany({
    where: { reporter_id: user.id },
    include: { reported_store: { select: { name: true } } },
    orderBy: { created_at: 'desc' },
  });
  const productIds = rows.map((r) => r.product_id).filter(Boolean);
  const serviceIds = rows.map((r) => r.service_id).filter(Boolean);
  const [products, services] = await Promise.all([
    productIds.length
      ? prisma.products.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
      : [],
    serviceIds.length
      ? prisma.services.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } })
      : [],
  ]);
  const productName = Object.fromEntries(products.map((p) => [p.id, p.name]));
  const serviceName = Object.fromEntries(services.map((s) => [s.id, s.name]));
  return rows.map((row) => mapMyReportRow(row, productName[row.product_id], serviceName[row.service_id]));
}

export async function fetchMyReportMessages(user, reportId) {
  const report = await prisma.reports.findUnique({ where: { id: reportId } });
  if (!report) throw new HttpError(404, 'Laporan tidak ditemukan.');
  if (report.reporter_id !== user.id && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  const rows = await prisma.report_messages.findMany({
    where: { report_id: reportId },
    orderBy: { created_at: 'asc' },
  });
  return rows.map((row) => ({
    id: row.id,
    isAdmin: row.is_admin,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function sendMyReportReply(user, reportId, body) {
  const report = await prisma.reports.findUnique({ where: { id: reportId } });
  if (!report) throw new HttpError(404, 'Laporan tidak ditemukan.');
  if (report.reporter_id !== user.id) throw new HttpError(403, 'Akses ditolak.');
  if (report.status === 'selesai') throw new HttpError(400, 'Laporan sudah selesai.');
  await prisma.report_messages.create({
    data: { report_id: reportId, sender_id: user.id, is_admin: false, body },
  });
  return { ok: true };
}

const REPORT_NOTIFICATION_TYPES = ['report_reply', 'report_status'];

export async function hasUnreadReportNotifications(user) {
  const row = await prisma.notifications.findFirst({
    where: { user_id: user.id, is_read: false, type: { in: REPORT_NOTIFICATION_TYPES } },
    select: { id: true },
  });
  return Boolean(row);
}

export async function markReportNotificationsRead(user) {
  await prisma.notifications.updateMany({
    where: { user_id: user.id, is_read: false, type: { in: REPORT_NOTIFICATION_TYPES } },
    data: { is_read: true },
  });
  return { ok: true };
}
