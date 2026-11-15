import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/apiClient';

export function createReview(payload) {
  return apiPost('/api/reviews', payload);
}

export async function hasReviewed({ orderId, bookingId }) {
  const { reviewed } = await apiGet('/api/reviews', { orderId, bookingId });
  return reviewed;
}

export function replyToReview(reviewId, reply) {
  return apiPatch(`/api/reviews/${encodeURIComponent(reviewId)}`, { reply });
}

export function deleteReview(reviewId) {
  return apiDelete(`/api/reviews/${encodeURIComponent(reviewId)}`);
}
