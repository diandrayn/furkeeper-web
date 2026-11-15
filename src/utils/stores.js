import { apiGet, apiPatch, apiPost } from '../lib/apiClient';

export class StoreUnavailableError extends Error {
  constructor() {
    super('Toko tidak tersedia');
    this.name = 'StoreUnavailableError';
  }
}

export function fetchPublicStore(identifier) {
  return apiGet(`/api/stores/${encodeURIComponent(identifier || '')}`).catch((error) => {
    if (error.status === 410) throw new StoreUnavailableError();
    throw error;
  });
}

export function fetchStoreProducts(storeId, options = {}) {
  return apiGet(`/api/stores/${encodeURIComponent(storeId)}`, { view: 'products', ...options });
}

export function fetchStoreServices(storeId, options = {}) {
  return apiGet(`/api/stores/${encodeURIComponent(storeId)}`, { view: 'services', ...options });
}

export function fetchStoreCategories(storeId) {
  return apiGet(`/api/stores/${encodeURIComponent(storeId)}`, { view: 'categories' });
}

export function fetchStoreServiceTypes(storeId) {
  return apiGet(`/api/stores/${encodeURIComponent(storeId)}`, { view: 'service-types' });
}

export function fetchStoreReviews(storeId) {
  return apiGet(`/api/stores/${encodeURIComponent(storeId)}`, { view: 'reviews' });
}

export function fetchStoreList(options = {}) {
  return apiGet('/api/stores', options);
}

export function fetchStorePublicStats(storeId) {
  return apiGet(`/api/stores/${encodeURIComponent(storeId)}`, { view: 'stats' });
}

export async function uploadStoreImage(file) {
  const form = new FormData();
  form.append('file', file);
  const { url } = await apiPost('/api/upload', form);
  return url;
}

export function saveStoreProfile(storeId, profile) {
  return apiPatch('/api/stores', { storeId, profile });
}

export async function fetchMyStoreProfile(user, kind) {
  const { profile } = await apiGet('/api/stores', { mine: 1, kind });
  return profile;
}
