import { handleApi, jsonOk, readJson } from '@/lib/http';
import { createHelpMessage, fetchMyHelpMessages } from '@/lib/helpOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async () => {
  const user = await requireUser();
  return jsonOk(await fetchMyHelpMessages(user));
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  return jsonOk(await createHelpMessage(user, body));
});
