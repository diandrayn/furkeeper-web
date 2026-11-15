import { handleApi, jsonOk } from '@/lib/http';
import { fetchPlatformContent, fetchPublishedFaqs } from '@/lib/contentOps';

export const GET = handleApi(async (request) => {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('faqs')) return jsonOk(await fetchPublishedFaqs());
  return jsonOk(await fetchPlatformContent(searchParams.get('key')));
});
