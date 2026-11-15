import crypto from 'crypto';
import midtransClient from 'midtrans-client';

function isProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}

function serverKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error('MIDTRANS_SERVER_KEY belum dikonfigurasi.');
  return key;
}

function clientKey() {
  return process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
}

let snapInstance;
let coreInstance;

function snap() {
  if (!snapInstance) {
    snapInstance = new midtransClient.Snap({
      isProduction: isProduction(),
      serverKey: serverKey(),
      clientKey: clientKey(),
    });
  }
  return snapInstance;
}

function core() {
  if (!coreInstance) {
    coreInstance = new midtransClient.CoreApi({
      isProduction: isProduction(),
      serverKey: serverKey(),
      clientKey: clientKey(),
    });
  }
  return coreInstance;
}

export function getMidtransClientKey() {
  return clientKey();
}

export function getSnapScriptUrl() {
  return isProduction()
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
}

export async function createSnapTransaction({
  orderId,
  grossAmount,
  itemDetails,
  customerDetails,
  finishUrl,
  expiryHours = 24,
}) {
  return snap().createTransaction({
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: itemDetails,
    customer_details: customerDetails,
    callbacks: {
      finish: finishUrl,
    },
    expiry: {
      unit: 'hours',
      duration: expiryHours,
    },
  });
}

export async function getMidtransStatus(orderId) {
  return core().transaction.status(orderId);
}

/** Close a Snap transaction at Midtrans so the old token can no longer be paid. */
export async function expireMidtransTransaction(orderId) {
  return core().transaction.expire(orderId);
}

export function verifyMidtransSignature({
  order_id,
  status_code,
  gross_amount,
  signature_key,
}) {
  if (!order_id || !status_code || !gross_amount || !signature_key) return false;

  const expected = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey()}`)
    .digest('hex');
  const received = String(signature_key);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
