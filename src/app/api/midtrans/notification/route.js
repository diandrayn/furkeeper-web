import { handleApi, jsonOk, readJson, HttpError } from '@/lib/http';
import { verifyMidtransSignature } from '@/lib/midtrans';
import { applyMidtransNotification } from '@/lib/paymentOps';

// Public endpoint called by Midtrans. Never trust the payload until the
// signature has been verified with the server key.
export const POST = handleApi(async (request) => {
  const body = await readJson(request);

  if (!verifyMidtransSignature(body)) {
    throw new HttpError(401, 'Signature notifikasi tidak valid.');
  }

  const result = await applyMidtransNotification(body);
  return jsonOk({ ok: true, ...result });
});
