import { Package, CalendarDays, MessageCircle, Megaphone, Briefcase, Star, Bell } from 'lucide-react';
import { formatRelativeTimeId } from '../utils/status';

const iconByType = {
  order_status: Package,
  booking_status: CalendarDays,
  chat: MessageCircle,
  promo: Megaphone,
  partner_status: Briefcase,
  review_reminder: Star,
};

const colorByType = {
  order_status: 'bg-brand-peach text-brand-burgundy',
  booking_status: 'bg-brand-peach text-brand-burgundy',
  chat: 'bg-status-success/20 text-status-success',
  promo: 'bg-status-warning/30 text-text-primary',
  partner_status: 'bg-brand-burgundy/10 text-brand-burgundy',
  review_reminder: 'bg-status-warning/30 text-text-primary',
};

export default function NotificationItem({ notification, onClick }) {
  const Icon = iconByType[notification.type] || Bell;
  const iconColor = colorByType[notification.type] || 'bg-gray-100 text-text-secondary';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-brand-peach/40 ${
        !notification.isRead ? 'border-l-2 border-brand-orange-end bg-brand-orange-end/5' : ''
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconColor}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${!notification.isRead ? 'font-bold text-text-primary' : 'font-medium text-text-primary'}`}>
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{notification.message}</p>
        <p className="mt-1 text-[11px] text-text-secondary">
          {formatRelativeTimeId(notification.timestamp)}
        </p>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-orange-end" aria-hidden="true" />
      )}
    </button>
  );
}