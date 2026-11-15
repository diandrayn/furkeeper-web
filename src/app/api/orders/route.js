import { handleApi, jsonOk, readJson } from '@/lib/http';
import { fetchMyOrders, fetchOrdersByIds, fetchStoreOrders, submitOrder } from '@/lib/commerce';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId');
  const ids = searchParams.get('ids');
  if (storeId) return jsonOk(await fetchStoreOrders(user, storeId));
  if (ids) return jsonOk(await fetchOrdersByIds(user.id, ids.split(',').filter(Boolean)));
  return jsonOk(await fetchMyOrders(user.id));
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  const id = await submitOrder(user, body);
  return jsonOk({ id });
});
