import { handleApi, jsonOk, readJson } from '@/lib/http';
import {
  fetchMyReports,
  hasUnreadReportNotifications,
  markReportNotificationsRead,
  submitReport,
} from '@/lib/reportOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  if (searchParams.get('unread') === '1') {
    return jsonOk({ unread: await hasUnreadReportNotifications(user) });
  }
  return jsonOk(await fetchMyReports(user));
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  if (body.action === 'mark-read') return jsonOk(await markReportNotificationsRead(user));
  const id = await submitReport(user, body);
  return jsonOk({ id });
});
