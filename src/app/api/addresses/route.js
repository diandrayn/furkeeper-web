import { handleApi, jsonOk, readJson } from '@/lib/http';
import { createAddress, listAddresses } from '@/lib/accountOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async () => {
  const user = await requireUser();
  return jsonOk(await listAddresses(user));
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  return jsonOk(await createAddress(user, await readJson(request)));
});
