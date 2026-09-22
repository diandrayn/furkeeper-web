import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  WEEKDAY_NAMES,
  MONTH_NAMES,
  getDateStatus,
  isSameDay,
  startOfDay,
} from '../data/mockBooking';

function getMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: startWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  return cells;
}

export default function CalendarPicker({ value, onChange, monthDate, onMonthChange }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const cells = getMonthCells(year, month);

  return (
    <div className="rounded-2xl border border-gray-100 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          className="rounded-full p-1 text-text-secondary hover:bg-gray-100"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-heading text-sm font-bold text-text-primary">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          className="rounded-full p-1 text-text-secondary hover:bg-gray-100"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-secondary">
        {WEEKDAY_NAMES.map((day) => (
          <span key={day} className="py-1 font-medium">
            {day}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />;
          const status = getDateStatus(date);
          const selected = value && isSameDay(date, value);
          const disabled = status !== 'available';
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onChange(startOfDay(date))}
              className={`h-9 rounded-full text-sm transition-colors duration-200 ${
                selected
                  ? 'bg-brand-burgundy text-white'
                  : status === 'past'
                    ? 'cursor-not-allowed text-gray-300'
                    : status === 'full'
                      ? 'cursor-not-allowed text-gray-300 line-through'
                      : 'text-text-primary hover:bg-brand-peach'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
