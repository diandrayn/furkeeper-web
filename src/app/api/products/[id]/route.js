import { handleApi, jsonOk, readJson } from '@/lib/http';
import { deleteProduct, updateProduct } from '@/lib/catalogOps';
import { requireUser } from '@/lib/session';

export const PATCH = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  return jsonOk(await updateProduct(user, id, body));
});

export const DELETE = handleApi(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return jsonOk(await deleteProduct(user, id));
});
