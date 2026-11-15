import { handleApi, jsonOk, readJson, HttpError } from '@/lib/http';
import * as adminOps from '@/lib/adminOps';
import { requireAdmin } from '@/lib/session';

export const GET = handleApi(async (request, context) => {
  const admin = await requireAdmin();
  const { action } = await context.params;
  const params = new URL(request.url).searchParams;

  const handlers = {
    fetchTransactionSummary: () => adminOps.fetchTransactionSummary(),
    fetchAdminStats: () => adminOps.fetchAdminStats(),
    fetchPartnerApplications: () => adminOps.fetchPartnerApplications({ status: params.get('status') || 'pending' }),
    fetchAllUsers: () => adminOps.fetchAllUsers({ search: params.get('search') || '', role: params.get('role') || 'all' }),
    fetchAllStores: () => adminOps.fetchAllStores(),
    fetchStoreById: () => adminOps.fetchStoreById(params.get('storeId')),
    fetchProductsByStore: () => adminOps.fetchProductsByStore(params.get('storeId')),
    fetchServicesByStore: () => adminOps.fetchServicesByStore(params.get('storeId')),
    fetchAllProducts: () => adminOps.fetchAllProducts({ approvalStatus: params.get('approvalStatus') || 'all' }),
    fetchAllServices: () => adminOps.fetchAllServices({ approvalStatus: params.get('approvalStatus') || 'all' }),
    fetchAllReviews: () => adminOps.fetchAllReviews(),
    fetchAllOrders: () => adminOps.fetchAllOrders({ search: params.get('search') || '', status: params.get('status') || 'all' }),
    reconcilePayments: () => adminOps.reconcilePayments(admin),
    fetchAllBookings: () => adminOps.fetchAllBookings({ search: params.get('search') || '', status: params.get('status') || 'all' }),
    fetchAllReports: () => adminOps.fetchAllReports({
      search: params.get('search') || '',
      status: params.get('status') || 'all',
      priority: params.get('priority') || 'all',
    }),
    fetchReportMessages: () => adminOps.fetchReportMessages(params.get('reportId')),
    fetchHelpMessages: () => adminOps.fetchHelpMessages({
      search: params.get('search') || '',
      status: params.get('status') || 'all',
    }),
    fetchCategoryTree: () => adminOps.fetchCategoryTree(params.get('kind')),
    fetchAllAdmins: () => adminOps.fetchAllAdmins({ search: params.get('search') || '' }),
    searchPromotableUsers: () => adminOps.searchPromotableUsers(params.get('search') || ''),
    fetchPlatformSettings: () => adminOps.fetchPlatformSettings(),
    fetchCommissionRecap: () => adminOps.fetchCommissionRecap({
      from: params.get('from'),
      to: params.get('to'),
    }),
    fetchAllWithdrawals: () => adminOps.fetchAllWithdrawals({ status: params.get('status') || 'all' }),
    fetchAllPlatformContent: () => adminOps.fetchAllPlatformContent(),
    fetchAllFaqs: () => adminOps.fetchAllFaqs(),
    fetchActivityLogActors: () => adminOps.fetchActivityLogActors(),
    fetchActivityLog: () => adminOps.fetchActivityLog({
      search: params.get('search') || '',
      actorId: params.get('actorId') || 'all',
      targetType: params.get('targetType') || 'all',
      dateFrom: params.get('dateFrom'),
      dateTo: params.get('dateTo'),
    }),
  };
  const handler = handlers[action];
  if (!handler) throw new HttpError(404, 'Aksi admin tidak ditemukan.');
  return jsonOk(await handler());
});

export const POST = handleApi(async (request, context) => {
  const admin = await requireAdmin();
  const { action } = await context.params;
  const body = await readJson(request);

  const handlers = {
    reviewPartnerApplication: () =>
      adminOps.reviewPartnerApplication(admin, body.userId, body.type, body.decision, body.reason, body.userLabel),
    setUserSuspended: () =>
      adminOps.setUserSuspended(admin, body.userId, body.isSuspended, body.reason, body.userLabel),
    setProductActive: () => adminOps.setProductActive(admin, body.id, body.isActive, body.productLabel),
    deleteProductAdmin: () => adminOps.deleteProductAdmin(admin, body.id, body.productLabel),
    reviewListing: () =>
      adminOps.reviewListing(admin, body.kind, body.id, body.decision, body.reason, body.listingLabel),
    setServiceActive: () => adminOps.setServiceActive(admin, body.id, body.isActive, body.serviceLabel),
    deleteServiceAdmin: () => adminOps.deleteServiceAdmin(admin, body.id, body.serviceLabel),
    deleteReviewAdmin: () => adminOps.deleteReviewAdmin(admin, body.id, body.reviewLabel),
    setReportStatus: () =>
      adminOps.setReportStatus(admin, body.reportId, body.status, body.reportLabel, body.reporterId),
    setReportPriority: () =>
      adminOps.setReportPriority(admin, body.reportId, body.priority, body.reportLabel),
    sendReportReply: () =>
      adminOps.sendReportReply(admin, body.reportId, body.body, body.reportLabel, body.reporterId),
    replyHelpMessage: () =>
      adminOps.replyHelpMessage(admin, body.messageId, body.reply, body.senderLabel, body.senderUserId),
    createCategory: () => adminOps.createCategory(admin, body.kind, body),
    renameCategory: () => adminOps.renameCategory(admin, body.kind, body.id, body.name),
    deleteCategory: () => adminOps.deleteCategory(admin, body.kind, body.id, body.categoryLabel),
    moveCategory: () => adminOps.moveCategory(body.kind, body.siblings || [], body.id, body.direction),
    promoteToAdmin: () => adminOps.promoteToAdmin(admin, body.userId, body.scope, body.userLabel),
    setAdminScope: () => adminOps.setAdminScope(admin, body.adminId, body.scope, body.adminLabel),
    demoteAdmin: () => adminOps.demoteAdmin(admin, body.adminId, body.adminLabel),
    updateCommissionRates: () =>
      adminOps.updateCommissionRates(admin, body.commissionProdukPercent, body.commissionJasaPercent),
    setWithdrawalStatus: () =>
      adminOps.setWithdrawalStatus(admin, body.id, body.status, body.note, body.withdrawalLabel),
    savePlatformContent: () =>
      adminOps.savePlatformContent(admin, body.key, body.content || {}, body.isNew),
    deletePlatformContent: () => adminOps.deletePlatformContent(admin, body.key, body.contentLabel),
    saveFaq: () => adminOps.saveFaq(admin, body.faq || {}),
    deleteFaq: () => adminOps.deleteFaq(admin, body.id, body.faqLabel),
    moveFaq: () => adminOps.moveFaq(body.faqs || [], body.id, body.direction),
    refundPayment: () => adminOps.refundPayment(admin, body.paymentId, body.reason),
    resolvePaymentChallenge: () =>
      adminOps.resolvePaymentChallenge(admin, body.paymentId, body.decision, body.reason),
  };
  const handler = handlers[action];
  if (!handler) throw new HttpError(404, 'Aksi admin tidak ditemukan.');
  return jsonOk(await handler());
});
