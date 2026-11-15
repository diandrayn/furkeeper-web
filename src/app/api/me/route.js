import { handleApi, jsonOk, readJson } from '@/lib/http';
import { getSessionUser, mapProfileUser, requireUser } from '@/lib/session';
import { updateProfile } from '@/lib/authOps';

export const GET = handleApi(async () => {
  const profile = await getSessionUser();
  return jsonOk({ token: profile?.id || null, user: mapProfileUser(profile) });
});

export const PATCH = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  return jsonOk(await updateProfile(user, body));
});
