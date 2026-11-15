import { handleApi, jsonOk, readJson } from '@/lib/http';
import { fetchMyReportMessages, sendMyReportReply } from '@/lib/reportOps';
import { requireUser } from '@/lib/session';

export const GET = handleApi(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return jsonOk(await fetchMyReportMessages(user, id));
});

export const POST = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  return jsonOk(await sendMyReportReply(user, id, body.body));
});
