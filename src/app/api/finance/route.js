import { handleApi, jsonOk, readJson } from '@/lib/http';
import { fetchMyWithdrawalBalance, fetchMyWithdrawals, requestWithdrawal } from '@/lib/financeOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  if (searchParams.get('view') === 'withdrawals') {
    return jsonOk(await fetchMyWithdrawals(user, searchParams.get('storeId')));
  }
  return jsonOk(await fetchMyWithdrawalBalance(user));
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  return jsonOk(await requestWithdrawal(user, await readJson(request)));
});
