import { handleApi, jsonOk, readJson } from '@/lib/http';
import { deleteService, updateService } from '@/lib/catalogOps';
import { requireUser } from '@/lib/session';

export const PATCH = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  return jsonOk(await updateService(user, id, body));
});

export const DELETE = handleApi(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return jsonOk(await deleteService(user, id));
});
