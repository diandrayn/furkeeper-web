import { handleApi, jsonOk, readJson } from '@/lib/http';
import {
  chatEvents,
  fetchBuyerConversations,
  fetchStoreConversations,
  fetchThreadsSummary,
  findOrCreateConversation,
} from '@/lib/chatOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');
  if (view === 'events') return jsonOk(await chatEvents(user, searchParams.get('since')));
  if (view === 'store') return jsonOk(await fetchStoreConversations(user, searchParams.get('storeId')));
  return jsonOk(await fetchBuyerConversations(user, user.id));
});

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  if (body.action === 'summary') return jsonOk(await fetchThreadsSummary(user, body.conversationIds || []));
  if (body.action === 'create') return jsonOk({ id: await findOrCreateConversation(user, body.storeId, body.context) });
  return jsonOk({ id: await findOrCreateConversation(user, body.storeId, body.context) });
});
