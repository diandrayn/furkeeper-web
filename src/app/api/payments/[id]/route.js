import { handleApi, jsonOk } from '@/lib/http';
import { requireUser } from '@/lib/session';
import { fetchPaymentForUser } from '@/lib/paymentOps';

export const GET = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return jsonOk(await fetchPaymentForUser(user, id));
});
