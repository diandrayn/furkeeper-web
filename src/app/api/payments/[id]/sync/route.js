import { handleApi, jsonOk } from '@/lib/http';
import { requireUser } from '@/lib/session';
import { syncPaymentStatus } from '@/lib/paymentOps';

export const POST = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return jsonOk(await syncPaymentStatus(user, id));
});
