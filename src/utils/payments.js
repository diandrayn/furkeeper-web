import { apiGet, apiPost } from '../lib/apiClient';

export function createPayment(orderIds) {
  return apiPost('/api/payments', { orderIds });
}

export function fetchPayment(paymentId) {
  return apiGet(`/api/payments/${encodeURIComponent(paymentId)}`);
}

export function syncPayment(paymentId) {
  return apiPost(`/api/payments/${encodeURIComponent(paymentId)}/sync`);
}

export function fetchPaymentByMidtransOrderId(midtransOrderId) {
  return apiGet('/api/payments/lookup', { midtransOrderId });
}

const STATUS_KEYS = {
  pending: 'payment.statusPending',
  paid: 'payment.statusPaid',
  failed: 'payment.statusFailed',
  expired: 'payment.statusExpired',
  challenge: 'payment.statusChallenge',
  refunded: 'payment.statusRefunded',
};

export function paymentStatusKey(status) {
  return STATUS_KEYS[status] || 'payment.statusPending';
}

const TYPE_KEYS = {
  credit_card: 'payment.typeCreditCard',
  bank_transfer: 'payment.typeBankTransfer',
  echannel: 'payment.typeEchannel',
  cstore: 'payment.typeCstore',
  qris: 'payment.typeQris',
  gopay: 'payment.typeGopay',
  shopeepay: 'payment.typeShopeepay',
  akulaku: 'payment.typeAkulaku',
};

/** i18n key for a Midtrans `payment_type`, or null when unknown. */
export function paymentTypeKey(type) {
  if (!type) return null;
  return TYPE_KEYS[type] || null;
}
