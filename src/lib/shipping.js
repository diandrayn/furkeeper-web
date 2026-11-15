export const SHIPPING_FEES = {
  Klojen: 8000,
  Lowokwaru: 10000,
  Blimbing: 12000,
  Sukun: 13000,
  Kedungkandang: 15000,
  Rungkut: 18000,
};

export const DEFAULT_SHIPPING_FEE = 12000;

export function getShippingFee(district) {
  return SHIPPING_FEES[district] ?? DEFAULT_SHIPPING_FEE;
}
