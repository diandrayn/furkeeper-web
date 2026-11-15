import { handleApi, jsonOk, readJson } from '@/lib/http';
import { deletePet, updatePet } from '@/lib/accountOps';
import { requireUser } from '@/lib/session';

export const PATCH = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return jsonOk(await updatePet(user, id, await readJson(request)));
});

export const DELETE = handleApi(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return jsonOk(await deletePet(user, id));
});
