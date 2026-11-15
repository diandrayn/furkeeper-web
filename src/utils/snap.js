/* global process */
const SANDBOX_SRC = 'https://app.sandbox.midtrans.com/snap/snap.js';
const PRODUCTION_SRC = 'https://app.midtrans.com/snap/snap.js';

let loadingPromise = null;

export function loadSnapScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Midtrans Snap hanya tersedia di browser.'));
  }
  if (window.snap) return Promise.resolve(window.snap);
  if (loadingPromise) return loadingPromise;

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  if (!clientKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum dikonfigurasi.'));
  }

  const src =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' ? PRODUCTION_SRC : SANDBOX_SRC;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => {
      if (window.snap) {
        resolve(window.snap);
      } else {
        loadingPromise = null;
        reject(new Error('Midtrans Snap gagal dimuat.'));
      }
    };
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error('Midtrans Snap gagal dimuat.'));
    };
    document.body.appendChild(script);
  });

  return loadingPromise;
}

export async function openSnap(token, callbacks) {
  const snap = await loadSnapScript();
  snap.pay(token, callbacks);
}
