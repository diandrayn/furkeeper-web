import { handleApi, jsonOk, readJson } from '@/lib/http';
import { createService, listMyServices, listPublicServices } from '@/lib/catalogOps';
import { ensureStore } from '@/lib/storeOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (request) => {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get('mine');
  const storeId = searchParams.get('storeId');
  if (mine) {
    const user = await requireUser();
    const id = storeId || (await ensureStore(user, 'service'));
    return jsonOk({ storeId: id, rows: await listMyServices(user, id) });
  }
  return jsonOk(await listPublicServices());
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  const storeId = body.storeId || (await ensureStore(user, 'service'));
  return jsonOk(await createService(user, storeId, body));
});
