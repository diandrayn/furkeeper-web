import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ShoppingCart } from 'lucide-react';
import Logo from './Logo';
import Button from './Button';
import ProfileDropdown from './ProfileDropdown';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import { navLinks } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useChat } from '../hooks/useChat';
import { useLanguage } from '../i18n/LanguageContext';

// navLinks entries carry the Indonesian label used for routing/active-link
// matching (`activeLink` prop), but the *displayed* text is translated via
// this href → translation-key map so switching language doesn't break the
// active-tab comparison elsewhere in the app.
const navKeyByHref = {
  '/': 'beranda',
  '/produk': 'produk',
  '/jasa': 'jasa',
  '/tentang-kami': 'tentangKami',
  '/bantuan': 'bantuan',
};

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function IconButton({ to, label, children }) {
  return (
    <Link
      to={to}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors duration-200 hover:bg-brand-peach hover:text-brand-burgundy"
      aria-label={label}
    >
      {children}
    </Link>
  );
}

function CountBadge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export default function Navbar({ activeLink = 'Beranda' }) {
  const { user, isLoggedIn } = useAuth();
  const { itemCount } = useCart();
  const { totalUnreadCount } = useChat();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  // Seller/service-provider accounts are a separate role from buyers in
  // this app — they browse the catalog but never buy from it, so the cart
  // icon has nothing to do for them. Their chat lives in the dashboard
  // ("Pesan" tab), not the buyer-facing /chat page.
  const isBuyerAccount = !user || user.role === 'buyer';
  const chatHref =
    user?.role === 'seller'
      ? '/dashboard/toko/pesan'
      : user?.role === 'service'
        ? '/dashboard/jasa/pesan'
        : '/chat';

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-container items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <Logo />

        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const isActive = link.label === activeLink;
            return (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className={`relative text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-brand-burgundy'
                      : 'text-text-secondary hover:text-brand-burgundy'
                  }`}
                >
                  {t(`nav.${navKeyByHref[link.href] || 'beranda'}`)}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-brand-burgundy" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher className="mr-1" />

          {isLoggedIn ? (
            <>
              {isBuyerAccount && (
                <IconButton to="/keranjang" label={t('nav.keranjang')}>
                  <ShoppingCart className="h-5 w-5" />
                  <CountBadge count={itemCount} />
                </IconButton>
              )}
              <IconButton to={chatHref} label={t('nav.chat')}>
                <MessageCircle className="h-5 w-5" />
                <CountBadge count={totalUnreadCount} />
              </IconButton>
              <NotificationBell />

              <div className="relative ml-1" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-burgundy text-xs font-bold text-white ring-2 ring-transparent transition hover:ring-brand-peach"
                  aria-label={t('nav.profil')}
                  aria-expanded={menuOpen}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(user.name)
                  )}
                </button>
                {menuOpen && <ProfileDropdown onClose={() => setMenuOpen(false)} />}
              </div>
            </>
          ) : (
            <div className="ml-2 flex items-center gap-4">
              <div className="hidden h-6 w-px bg-gray-200 lg:block" aria-hidden="true" />
              <Link
                to="/login"
                className="hidden text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-brand-burgundy sm:block"
              >
                {t('nav.masuk')}
              </Link>
              <Link to="/register">
                <Button variant="primary" className="px-5 py-2 text-sm">
                  {t('nav.daftar')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}