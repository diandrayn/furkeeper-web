export class ApiError extends Error {
  constructor(message, { status, fields, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields || {};
    this.code = code;
  }
}

function toSearch(params) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
  if (!entries.length) return '';
  return `?${new URLSearchParams(entries.map(([key, value]) => [key, String(value)]))}`;
}

export async function apiFetch(path, { method = 'GET', body, params } = {}) {
  const url = `${path}${toSearch(params)}`;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: isForm || body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || 'Permintaan gagal', {
      status: res.status,
      fields: data.fields,
      code: data.code,
    });
  }
  return data;
}

export function apiGet(path, params) {
  return apiFetch(path, { params });
}

export function apiPost(path, body) {
  return apiFetch(path, { method: 'POST', body });
}

export function apiPatch(path, body) {
  return apiFetch(path, { method: 'PATCH', body });
}

export function apiDelete(path, body) {
  return apiFetch(path, { method: 'DELETE', body });
}
