import { handleApi, jsonOk, readJson } from '@/lib/http';
import { createPet, listPets } from '@/lib/accountOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async () => {
  const user = await requireUser();
  return jsonOk(await listPets(user));
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  return jsonOk(await createPet(user, await readJson(request)));
});
