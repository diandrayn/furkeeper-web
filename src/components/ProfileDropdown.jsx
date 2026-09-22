import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Package, ShieldCheck, UserRound, LifeBuoy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { useUnreadReportReplies } from '../hooks/useUnreadReportReplies';

export default function ProfileDropdown({ onClose }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const hasUnreadReportReply = useUnreadReportReplies(user?.id);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/');
  };

  // Seller/service-provider accounts are a separate role from buyers here
  // (set at registration, see registerInit) — they have no orders to view,
  // and "Profil" for them means their store/service dashboard, not the
  // buyer-style profile page.
  const isBuyerAccount = user.role === 'buyer';
  const isAdminAccount = user.role === 'admin';
  const dashboardHref = user.role === 'service' ? '/dashboard/jasa' : '/dashboard/toko';

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-lg"
      role="menu"
    >
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="truncate font-heading text-sm font-bold text-text-primary">{user.name}</p>
        <p className="truncate text-xs text-text-secondary">{user.email}</p>
      </div>

      {isBuyerAccount && (
        <Link
          to="/profil/riwayat"
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary transition-colors duration-200 hover:bg-brand-peach/60"
          role="menuitem"
        >
          <Package className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          {t('profileMenu.orders')}
        </Link>
      )}

      {isAdminAccount && (
        <Link
          to="/admin"
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary transition-colors duration-200 hover:bg-brand-peach/60"
          role="menuitem"
        >
          <ShieldCheck className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          Panel Admin
        </Link>
      )}

      {!isAdminAccount && (
      <Link
        to={isBuyerAccount ? '/profil' : dashboardHref}
        onClick={onClose}
        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary transition-colors duration-200 hover:bg-brand-peach/60"
        role="menuitem"
      >
        <UserRound className="h-4 w-4 text-text-secondary" aria-hidden="true" />
        {isBuyerAccount
          ? t('profileMenu.profile')
          : user.role === 'service'
            ? 'Dashboard Jasa'
            : 'Dashboard Toko'}
      </Link>
      )}

      {!isAdminAccount && (
        <Link
          to="/bantuan-saya"
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary transition-colors duration-200 hover:bg-brand-peach/60"
          role="menuitem"
        >
          <LifeBuoy className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          {t('bantuanSaya.menuLabel')}
          {hasUnreadReportReply && (
            <span
              className="ml-auto h-2 w-2 shrink-0 rounded-full bg-status-danger"
              aria-label={t('bantuanSaya.newReplyIndicator')}
            />
          )}
        </Link>
      )}

      <div className="my-1 border-t border-gray-100" />

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-status-danger transition-colors duration-200 hover:bg-status-danger/5"
        role="menuitem"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {t('common.logout')}
      </button>
    </div>
  );
}
