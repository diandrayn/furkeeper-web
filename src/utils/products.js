import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/apiClient';

export async function ensureMyStore() {
  const { storeId } = await apiGet('/api/stores', { mine: 1, kind: 'seller' });
  return storeId;
}

export async function fetchMyProducts(storeId) {
  const { rows } = await apiGet('/api/products', { mine: 1, storeId });
  return rows;
}

async function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  const { url } = await apiPost('/api/upload', form);
  return url;
}

export function uploadProductImage(file) {
  return uploadImage(file);
}

export async function insertProduct(storeId, payload) {
  return apiPost('/api/products', { ...payload, storeId });
}

export function updateProductRow(id, payload) {
  return apiPatch(`/api/products/${id}`, payload);
}

export async function deleteProductRow(id) {
  await apiDelete(`/api/products/${id}`);
}

export async function fetchPublicProducts() {
  return apiGet('/api/products');
}
