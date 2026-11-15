import { handleApi, jsonOk, HttpError } from '@/lib/http';
import { requireUser } from '@/lib/session';
import { fetchPaymentByMidtransOrderId } from '@/lib/paymentOps';

// Used by the Snap finish redirect, which may only carry the Midtrans
// order_id. The route stays authenticated so payments are never public.
export const GET = handleApi(async (request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const midtransOrderId = searchParams.get('midtransOrderId');
  if (!midtransOrderId) throw new HttpError(400, 'midtransOrderId wajib diisi.');
  return jsonOk(await fetchPaymentByMidtransOrderId(user, midtransOrderId));
});
