export const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

export function getDateStatus(date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  if (target < today) return 'past';
  if (target.getDate() % 9 === 0 || (target.getDay() === 1 && target.getDate() % 2 === 0)) {
    return 'full';
  }
  return 'available';
}

export function getSlotsForDate(date) {
  const seed = date.getDate();
  return TIME_SLOTS.map((time, index) => ({
    time,
    available: (seed + index) % 4 !== 0,
  }));
}

export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const WEEKDAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
