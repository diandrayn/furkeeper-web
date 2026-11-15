import { handleApi, jsonOk, readJson } from '@/lib/http';
import { requireUser } from '@/lib/session';
import { createPaymentForOrders } from '@/lib/paymentOps';

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  const orderIds = Array.isArray(body.orderIds)
    ? body.orderIds
    : String(body.orderIds || '')
        .split(',')
        .filter(Boolean);

  const payment = await createPaymentForOrders(user, orderIds);
  return jsonOk(payment);
});
