import { HttpError } from '@/lib/http';

function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new HttpError(503, 'Pengiriman email belum dikonfigurasi.');
  }
  return { apiKey, from };
}

export function appUrl() {
  const value = process.env.APP_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(503, 'APP_URL belum dikonfigurasi dengan benar.');
  }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new HttpError(503, 'APP_URL production harus menggunakan HTTPS.');
  }
  return url.origin;
}

export function assertEmailDeliveryConfigured() {
  emailConfig();
  appUrl();
}

export async function sendEmail({ to, subject, html, text }) {
  const { apiKey, from } = emailConfig();
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, text }),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || `Resend menolak pengiriman email (${response.status}).`);
  }
  return result;
}
