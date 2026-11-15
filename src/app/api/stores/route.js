import { handleApi, jsonOk, readJson } from '@/lib/http';
import { ensureStore, fetchMyStoreProfile, saveStoreProfile, searchStores } from '@/lib/storeOps';
import { requireStoreOwner, requireUser } from '@/lib/session';

export const GET = handleApi(async (request) => {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get('mine');
  const kind = searchParams.get('kind') || 'seller';
  if (mine) {
    const user = await requireUser();
    const storeId = await ensureStore(user, kind);
    const profile = await fetchMyStoreProfile(user.id, kind);
    return jsonOk({ storeId, profile });
  }
  return jsonOk(
    await searchStores({
      search: searchParams.get('search') || '',
      district: searchParams.get('district') || '',
      sort: searchParams.get('sort') || 'newest',
      onlyOpen: searchParams.get('onlyOpen') === 'true',
      onlyVerified: searchParams.get('onlyVerified') === 'true',
      hasProducts: searchParams.get('hasProducts') === 'true',
      hasServices: searchParams.get('hasServices') === 'true',
      limit: Number(searchParams.get('limit') || 12),
      offset: Number(searchParams.get('offset') || 0),
    }),
  );
});

export const PATCH = handleApi(async (request) => {
  await requireUser();
  const body = await readJson(request);
  await requireStoreOwner(body.storeId);
  return jsonOk(await saveStoreProfile(body.storeId, body.profile || body));
});
