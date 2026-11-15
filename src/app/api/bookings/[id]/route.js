import { handleApi, jsonOk, readJson } from '@/lib/http';
import { fetchBookingById, fetchBookingHistory, setBookingStatus } from '@/lib/commerce';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  if (searchParams.get('history')) return jsonOk(await fetchBookingHistory(user, id));
  return jsonOk(await fetchBookingById(user, id));
});

export const PATCH = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  await setBookingStatus(user, id, body.status, body.actor);
  return jsonOk({ ok: true });
});
