import { handleApi, jsonOk, readJson } from '@/lib/http';
import { fetchMyBookings, fetchProviderBookings, submitBooking } from '@/lib/commerce';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId');
  if (storeId) return jsonOk(await fetchProviderBookings(user, storeId));
  return jsonOk(await fetchMyBookings(user.id));
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  const id = await submitBooking(user, body);
  return jsonOk({ id });
});
