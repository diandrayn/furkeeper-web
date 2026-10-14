import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import NotificationItem from '../components/NotificationItem';
import { useNotifications } from '../hooks/useNotifications';
import { dayGroupLabel } from '../utils/status';
import { useLanguage } from '../i18n/LanguageContext';

export default function NotificationCenterPage() {
  const { t } = useLanguage();
  const { notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const filterPills = [
    { id: 'all', label: t('notifications.filterAll') },
    { id: 'order_status', label: t('notifications.filterOrder') },
    { id: 'booking_status', label: t('notifications.filterBooking') },
    { id: 'chat', label: t('notifications.filterChat') },
    { id: 'promo', label: t('notifications.filterPromo') },
  ];

  const filtered = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter((item) => item.type === filter)),
    [notifications, filter],
  );

  const groups = useMemo(() => {
    const order = ['Hari Ini', 'Kemarin', 'Lebih Awal'];
    const labelMap = {
      'Hari Ini': t('notifications.today'),
      Kemarin: t('notifications.yesterday'),
      'Lebih Awal': t('notifications.earlier'),
    };
    const buckets = { 'Hari Ini': [], Kemarin: [], 'Lebih Awal': [] };
    filtered.forEach((item) => {
      buckets[dayGroupLabel(item.timestamp)].push(item);
    });
    return order.filter((key) => buckets[key].length > 0).map((key) => ({ label: labelMap[key], items: buckets[key] }));
  }, [filtered, t]);

  const handleClick = (notification) => {
    markAsRead(notification.id);
    navigate(notification.linkTo);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">{t('notifications.title')}</h1>

        <div className="mt-5 flex flex-wrap gap-2">
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilter(pill.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                filter === pill.id
                  ? 'bg-brand-burgundy text-white'
                  : 'bg-white text-text-secondary shadow-sm hover:text-brand-burgundy'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-6">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
              <Bell className="h-10 w-10 text-gray-300" aria-hidden="true" />
              <p className="text-sm text-text-secondary">{t('notifications.empty')}</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <h2 className="mb-2 text-sm font-semibold text-text-secondary">{group.label}</h2>
                <div className="divide-y divide-gray-50 overflow-hidden rounded-2xl bg-white shadow-sm">
                  {group.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleClick(notification)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}