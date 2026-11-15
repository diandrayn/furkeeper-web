import { apiGet, apiPatch, apiPost } from '../lib/apiClient';

export async function submitOrder(payload) {
  const { id } = await apiPost('/api/orders', payload);
  return id;
}

export function setOrderStatus(orderId, status, actor) {
  return apiPatch(`/api/orders/${encodeURIComponent(orderId)}`, { status, actor });
}

export function fetchMyOrders() {
  return apiGet('/api/orders');
}

export function fetchOrderById(_buyerId, orderId) {
  return apiGet(`/api/orders/${encodeURIComponent(orderId)}`);
}

export function fetchOrdersByIds(_buyerId, ids) {
  if (!ids?.length) return Promise.resolve([]);
  return apiGet('/api/orders', { ids: ids.join(',') });
}

export function fetchOrderHistory(orderId) {
  return apiGet(`/api/orders/${encodeURIComponent(orderId)}`, { history: 1 });
}

export function fetchStoreOrders(storeId) {
  return apiGet('/api/orders', { storeId });
}
