import { handleApi, jsonOk } from '@/lib/http';
import {
  getPublicStore,
  listStoreCategories,
  listStoreProducts,
  listStoreReviews,
  listStoreServiceTypes,
  listStoreServices,
  storePublicStats,
} from '@/lib/storeOps';

export const GET = handleApi(async (request, context) => {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');
  if (view === 'products') {
    return jsonOk(
      await listStoreProducts(id, {
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        sort: searchParams.get('sort') || 'newest',
        offset: Number(searchParams.get('offset') || 0),
        limit: Number(searchParams.get('limit') || 12),
      }),
    );
  }
  if (view === 'services') {
    return jsonOk(
      await listStoreServices(id, {
        search: searchParams.get('search') || '',
        serviceType: searchParams.get('serviceType') || '',
        sort: searchParams.get('sort') || 'newest',
        offset: Number(searchParams.get('offset') || 0),
        limit: Number(searchParams.get('limit') || 12),
      }),
    );
  }
  if (view === 'reviews') return jsonOk(await listStoreReviews(id));
  if (view === 'stats') return jsonOk(await storePublicStats(id));
  if (view === 'categories') return jsonOk(await listStoreCategories(id));
  if (view === 'service-types') return jsonOk(await listStoreServiceTypes(id));
  return jsonOk(await getPublicStore(id));
});
