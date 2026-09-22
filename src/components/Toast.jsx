import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Package, CalendarDays, MessageCircle, Megaphone, Briefcase, Star, Bell } from 'lucide-react';

const iconByType = {
  order_status: Package,
  booking_status: CalendarDays,
  chat: MessageCircle,
  promo: Megaphone,
  partner_status: Briefcase,
  review_reminder: Star,
};

export default function Toast({ notification, onDismiss }) {
  const navigate = useNavigate();
  const Icon = iconByType[notification.type] || Bell;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div className="pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
      <button
        type="button"
        onClick={() => {
          navigate(notification.linkTo);
          onDismiss(notification.id);
        }}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-peach text-brand-burgundy">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text-primary">{notification.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{notification.message}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        className="shrink-0 rounded-full p-1 text-text-secondary hover:bg-gray-100"
        aria-label="Tutup notifikasi"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}