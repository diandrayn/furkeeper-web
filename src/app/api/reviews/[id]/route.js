import { handleApi, jsonOk, readJson } from '@/lib/http';
import { deleteReview, replyToReview } from '@/lib/reviewOps';
import { requireUser } from '@/lib/session';

export const PATCH = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  return jsonOk(await replyToReview(user, id, body.reply));
});

export const DELETE = handleApi(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return jsonOk(await deleteReview(user, id));
});
