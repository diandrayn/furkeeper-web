import { Link, useNavigate } from '@/lib/router';
import { Bell } from 'lucide-react';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../hooks/useNotifications';
import { useLanguage } from '../i18n/LanguageContext';

export default function NotificationDropdown({ onClose }) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const recent = notifications.slice(0, 5);

  const handleItemClick = (notification) => {
    markAsRead(notification.id);
    onClose?.();
    navigate(notification.linkTo);
  };

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg sm:w-96"
      role="menu"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="font-heading text-sm font-bold text-text-primary">{t('notifications.aria')}</h2>
        <button
          type="button"
          onClick={markAllAsRead}
          className="text-xs font-medium text-brand-burgundy hover:underline"
        >
          {t('common.markAllRead')}
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <Bell className="h-8 w-8 text-gray-300" aria-hidden="true" />
          <p className="text-sm text-text-secondary">{t('notifications.empty')}</p>
        </div>
      ) : (
        <div className="max-h-96 divide-y divide-gray-50 overflow-y-auto">
          {recent.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => handleItemClick(notification)}
            />
          ))}
        </div>
      )}

      <Link
        to="/notifikasi"
        onClick={onClose}
        className="block border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-brand-burgundy hover:bg-brand-peach/40"
      >
        {t('common.viewAllNotifications')} →
      </Link>
    </div>
  );
}