import { apiGet, apiPost } from '../lib/apiClient';

export function fetchMyWithdrawalBalance() {
  return apiGet('/api/finance');
}

export function fetchMyWithdrawals(storeId) {
  return apiGet('/api/finance', { view: 'withdrawals', storeId });
}

export function requestWithdrawal(payload) {
  return apiPost('/api/finance', payload);
}
