import { NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function jsonOk(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(error) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message, ...error.extra },
      { status: error.status },
    );
  }
  if (error?.name === 'StoreUnavailableError') {
    return NextResponse.json({ error: error.message || 'Toko tidak tersedia' }, { status: 410 });
  }
  console.error(error);
  return NextResponse.json(
    { error: error?.message || 'Terjadi kesalahan pada server' },
    { status: 500 },
  );
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'Permintaan JSON tidak valid.');
  }
}

export function handleApi(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      return jsonError(error);
    }
  };
}

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
