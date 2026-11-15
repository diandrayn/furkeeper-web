// Why this exists: Supabase/PostgREST errors (and fetch's TypeError) are Error
// instances whose useful fields (message, name, stack) are NON-enumerable, so
// Next's dev overlay / console forwarding serializes them as just `{}`.
// Logging `describeError(err)` instead gives a plain object that always prints
// the real cause (e.g. "TypeError: Failed to fetch", "PGRST202", "42501" for RLS).

/** @returns {{ name: string, message: string, code: string, details: string, hint: string, status: number|null }} */
export function describeError(err) {
  if (err == null) {
    return { name: 'Error', message: 'Unknown error', code: '', details: '', hint: '', status: null };
  }
  if (typeof err === 'string') {
    return { name: 'Error', message: err, code: '', details: '', hint: '', status: null };
  }
  return {
    name: err.name || 'Error',
    message: err.message || err.error_description || err.error || '',
    code: err.code || '',
    details: err.details || '',
    hint: err.hint || '',
    status: typeof err.status === 'number' ? err.status : null,
  };
}

/** Single human-readable line, e.g. for UI fallbacks. */
export function errorMessage(err, fallback = 'Terjadi kesalahan.') {
  const { message, code } = describeError(err);
  if (!message) return fallback;
  return code ? `${message} (${code})` : message;
}
