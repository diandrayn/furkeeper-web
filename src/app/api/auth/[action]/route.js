import { handleApi, jsonOk, readJson, HttpError } from '@/lib/http';
import {
  changePassword,
  completePasswordReset,
  completeEmailVerification,
  deleteOwnAccount,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resendConfirmation,
  updatePassword,
} from '@/lib/authOps';
import { requireUser } from '@/lib/session';

export const POST = handleApi(async (request, context) => {
  const { action } = await context.params;
  const body = await readJson(request);

  if (action === 'register') return jsonOk(await registerUser(body));
  if (action === 'login') return jsonOk(await loginUser(body));
  if (action === 'logout') return jsonOk(await logoutUser());
  if (action === 'google') {
    throw new HttpError(501, 'Masuk dengan Google belum tersedia setelah migrasi ke MySQL.');
  }
  if (action === 'resend-confirmation') return jsonOk(await resendConfirmation(body.email));
  if (action === 'verify-email') return jsonOk(await completeEmailVerification(body.token));
  if (action === 'forgot-password') return jsonOk(await requestPasswordReset(body.email));
  if (action === 'change-password') {
    const user = await requireUser();
    return jsonOk(await changePassword(user, body));
  }
  if (action === 'reset-password') {
    if (body.token) return jsonOk(await completePasswordReset(body.token, body.newPassword || body.password));
    const user = await requireUser();
    return jsonOk(await updatePassword(user, body.newPassword || body.password));
  }
  if (action === 'delete-account') {
    const user = await requireUser();
    return jsonOk(await deleteOwnAccount(user));
  }
  throw new HttpError(404, 'Aksi tidak ditemukan.');
});
