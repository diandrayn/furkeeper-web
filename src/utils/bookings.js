import { apiGet, apiPatch, apiPost } from '../lib/apiClient';

export async function submitBooking(payload) {
  const { id } = await apiPost('/api/bookings', payload);
  return id;
}

export function setBookingStatus(bookingId, status, actor) {
  return apiPatch(`/api/bookings/${encodeURIComponent(bookingId)}`, { status, actor });
}

export function fetchMyBookings() {
  return apiGet('/api/bookings');
}

export function fetchBookingById(_buyerId, bookingId) {
  return apiGet(`/api/bookings/${encodeURIComponent(bookingId)}`);
}

export function fetchBookingHistory(bookingId) {
  return apiGet(`/api/bookings/${encodeURIComponent(bookingId)}`, { history: 1 });
}

export function fetchProviderBookings(storeId) {
  return apiGet('/api/bookings', { storeId });
}
