import { apiGet } from '../lib/apiClient';

export function fetchPlatformContent(key) {
  return apiGet('/api/content', { key });
}

export function fetchPublishedFaqs() {
  return apiGet('/api/content', { faqs: 1 });
}
