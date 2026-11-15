import { handleApi, jsonOk, readJson } from '@/lib/http';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/accountOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async () => {
  const user = await requireUser();
  return jsonOk(await listNotifications(user));
});

export const PATCH = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  if (body.all) return jsonOk(await markAllNotificationsRead(user));
  return jsonOk(await markNotificationRead(user, body.id));
});
