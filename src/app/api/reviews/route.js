import { handleApi, jsonOk, readJson } from '@/lib/http';
import { createReview, hasReviewed } from '@/lib/reviewOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const done = await hasReviewed(user, {
    orderId: searchParams.get('orderId'),
    bookingId: searchParams.get('bookingId'),
  });
  return jsonOk({ reviewed: done });
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  return jsonOk(await createReview(user, body));
});
