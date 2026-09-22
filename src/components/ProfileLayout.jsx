import { NavLink, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { useUnreadReportReplies } from '../hooks/useUnreadReportReplies';

const navItems = [
  { to: '/profil', key: 'account', end: true },
  { to: '/profil/hewan', key: 'pets', end: false },
  { to: '/profil/riwayat', key: 'history', end: false },
  { to: '/profil/alamat', key: 'addresses', end: false },
  // /bantuan-saya lives outside ProfileLayout's <Outlet /> (it's shared
  // with seller/service accounts too, which don't use this layout), but
  // buyers still get to it from this sidebar for a single, consistent
  // "account area" menu — NavLink still highlights it correctly since it
  // just matches on the current path.
  { to: '/bantuan-saya', key: 'help', end: false },
];

function tabClass({ isActive }) {
  return `whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition-colors duration-200 ${
    isActive
      ? 'bg-brand-orange-end/10 text-brand-burgundy font-medium'
      : 'text-text-secondary hover:bg-brand-peach/50 hover:text-brand-burgundy'
  }`;
}

export default function ProfileLayout() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const hasUnreadReportReply = useUnreadReportReplies(user?.id);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">{t('profileLayout.title')}</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <nav
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
            aria-label="Menu profil"
          >
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={tabClass}>
                <span className="inline-flex items-center gap-1.5">
                  {t(`profileLayout.nav.${item.key}`)}
                  {item.key === 'help' && hasUnreadReportReply && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-status-danger"
                      aria-label={t('bantuanSaya.newReplyIndicator')}
                    />
                  )}
                </span>
              </NavLink>
            ))}
          </nav>
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
