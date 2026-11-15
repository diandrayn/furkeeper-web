import { handleApi, jsonOk, readJson } from '@/lib/http';
import { createProduct, listMyProducts, listPublicProducts } from '@/lib/catalogOps';
import { ensureStore } from '@/lib/storeOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (request) => {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get('mine');
  const storeId = searchParams.get('storeId');
  if (mine) {
    const user = await requireUser();
    const id = storeId || (await ensureStore(user, 'seller'));
    return jsonOk({ storeId: id, rows: await listMyProducts(user, id) });
  }
  return jsonOk(await listPublicProducts());
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  const storeId = body.storeId || (await ensureStore(user, 'seller'));
  return jsonOk(await createProduct(user, storeId, body));
});
