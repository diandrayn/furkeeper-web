export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value) {
  return /^(\+62|62|0)[0-9]{9,12}$/.test(value.replace(/\s/g, ''));
}

export function isValidEmailOrPhone(value) {
  return isValidEmail(value) || isValidPhone(value);
}

export function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function formatPrice(price) {
  if (price == null || Number.isNaN(Number(price))) return '';
  return `Rp ${new Intl.NumberFormat('id-ID').format(price)}`;
}

export function formatSoldCount(count) {
  if (count == null) return '0';
  if (typeof count === 'string') return count;
  if (count >= 1000) {
    const value = count / 1000;
    const rounded = value % 1 === 0 ? String(value) : value.toFixed(1);
    return `${rounded}k`;
  }
  return String(count);
}
