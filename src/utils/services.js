import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/apiClient';

export async function ensureMyServiceStore() {
  const { storeId } = await apiGet('/api/stores', { mine: 1, kind: 'service' });
  return storeId;
}

export async function fetchMyServices(storeId) {
  const { rows } = await apiGet('/api/services', { mine: 1, storeId });
  return rows;
}

async function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  const { url } = await apiPost('/api/upload', form);
  return url;
}

export function uploadServiceImage(file) {
  return uploadImage(file);
}

export async function insertService(storeId, payload) {
  return apiPost('/api/services', { ...payload, storeId });
}

export function updateServiceRow(id, payload) {
  return apiPatch(`/api/services/${id}`, payload);
}

export async function deleteServiceRow(id) {
  await apiDelete(`/api/services/${id}`);
}

export async function fetchPublicServices() {
  return apiGet('/api/services');
}
