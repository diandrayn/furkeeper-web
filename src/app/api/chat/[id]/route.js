import { handleApi, jsonOk, readJson } from '@/lib/http';
import { conversationMeta, fetchMessages, markConversationRead, sendMessageRow } from '@/lib/chatOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  if (searchParams.get('meta')) return jsonOk(await conversationMeta(user, id));
  return jsonOk(await fetchMessages(user, id));
});

export const POST = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  return jsonOk(await sendMessageRow(user, id, body.text));
});

export const PATCH = handleApi(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  await markConversationRead(user, id);
  return jsonOk({ ok: true });
});
