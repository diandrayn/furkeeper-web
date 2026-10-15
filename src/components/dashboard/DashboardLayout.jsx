import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from '@/lib/router';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CalendarCheck,
  MessageSquare,
  Star,
  Store,
  Wallet,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import Logo from '../Logo';
import LanguageSwitcher from '../LanguageSwitcher';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../context/DashboardContext';
import { getInitials } from '../../utils/status';
import { useLanguage } from '../../i18n/LanguageContext';

const TOKO_NAV = [
  { to: '/dashboard/toko', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/dashboard/toko/produk', label: 'Produk', icon: Package },
  { to: '/dashboard/toko/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { to: '/dashboard/toko/pesan', label: 'Pesan', icon: MessageSquare },
  { to: '/dashboard/toko/ulasan', label: 'Ulasan', icon: Star },
  { to: '/dashboard/toko/penarikan', label: 'Pencairan Dana', icon: Wallet },
  { to: '/dashboard/toko/profil', label: 'Profil Toko', icon: Store },
];

const JASA_NAV = [
  { to: '/dashboard/jasa', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/dashboard/jasa/layanan', label: 'Layanan & Paket', icon: Package },
  { to: '/dashboard/jasa/booking', label: 'Booking', icon: CalendarCheck },
  { to: '/dashboard/jasa/pesan', label: 'Pesan', icon: MessageSquare },
  { to: '/dashboard/jasa/ulasan', label: 'Ulasan', icon: Star },
  { to: '/dashboard/jasa/penarikan', label: 'Pencairan Dana', icon: Wallet },
  { to: '/dashboard/jasa/profil', label: 'Profil Bisnis', icon: Store },
];

function navLinkClass({ isActive }) {
  return `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ${
    isActive
      ? 'bg-white/12 text-white'
      : 'text-white/65 hover:bg-white/8 hover:text-white'
  }`;
}

function SidebarContent({ mode, hasBoth, onNavigate, storeHref }) {
  const items = mode === 'jasa' ? JASA_NAV : TOKO_NAV;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <Logo variant="light" />
      </div>

      {hasBoth && (
        <div className="mx-5 mb-4 flex gap-1 rounded-xl bg-white/8 p-1">
          <Link
            to="/dashboard/toko"
            onClick={onNavigate}
            className={`flex-1 rounded-lg px-3 py-1.5 text-center text-xs font-semibold transition-colors duration-150 ${
              mode === 'toko' ? 'bg-white text-brand-burgundy' : 'text-white/70 hover:text-white'
            }`}
          >
            Toko
          </Link>
          <Link
            to="/dashboard/jasa"
            onClick={onNavigate}
            className={`flex-1 rounded-lg px-3 py-1.5 text-center text-xs font-semibold transition-colors duration-150 ${
              mode === 'jasa' ? 'bg-white text-brand-burgundy' : 'text-white/70 hover:text-white'
            }`}
          >
            Jasa
          </Link>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3.5" aria-label="Menu dashboard">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass} onClick={onNavigate}>
            <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {storeHref && (
        <div className="px-3.5 pb-4">
          <Link
            to={storeHref}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl bg-white/8 px-3.5 py-2.5 text-sm font-medium text-white/85 transition-colors duration-150 hover:bg-white/15 hover:text-white"
          >
            <Store className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            Lihat Toko Saya
          </Link>
        </div>
      )}

      <div className="border-t border-white/10 px-3.5 py-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/65 transition-colors duration-150 hover:bg-white/8 hover:text-white"
        >
          <ArrowLeft className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          Kembali ke Situs
        </Link>
      </div>
    </div>
  );
}

const PAGE_TITLES = {
  '/dashboard/toko': 'Ringkasan Toko',
  '/dashboard/toko/produk': 'Kelola Produk',
  '/dashboard/toko/pesanan': 'Kelola Pesanan',
  '/dashboard/toko/pesan': 'Pesan',
  '/dashboard/toko/ulasan': 'Ulasan Toko',
  '/dashboard/toko/profil': 'Profil Toko',
  '/dashboard/toko/penarikan': 'Pencairan Dana',
  '/dashboard/jasa': 'Ringkasan Jasa',
  '/dashboard/jasa/layanan': 'Layanan & Paket',
  '/dashboard/jasa/booking': 'Kelola Booking',
  '/dashboard/jasa/pesan': 'Pesan',
  '/dashboard/jasa/ulasan': 'Ulasan Jasa',
  '/dashboard/jasa/profil': 'Profil Bisnis',
  '/dashboard/jasa/penarikan': 'Pencairan Dana',
};

export default function DashboardLayout({ mode, children }) {
  const { user, logout } = useAuth();
  const { storeProfile, providerProfile, storeId, serviceStoreId } = useDashboard();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const hasBoth = user?.sellerStatus === 'active' && user?.providerStatus === 'active';
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || (mode === 'jasa' ? 'Dashboard Jasa' : 'Dashboard Toko');
  const myStoreId = mode === 'jasa' ? serviceStoreId : storeId;
  const myProfile = mode === 'jasa' ? providerProfile : storeProfile;
  const storeHref = myProfile?.slug ? `/toko/${myProfile.slug}` : myStoreId ? `/toko/${myStoreId}` : null;

  return (
    <div className="min-h-screen bg-brand-cream lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-brand-burgundy lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent mode={mode} hasBoth={hasBoth} storeHref={storeHref} />
        </div>
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-brand-burgundy shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent mode={mode} hasBoth={hasBoth} storeHref={storeHref} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3.5 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-brand-peach hover:text-brand-burgundy lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-heading text-lg font-bold text-text-primary md:text-xl">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors duration-150 hover:bg-brand-peach/60"
              aria-expanded={menuOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-burgundy text-xs font-bold text-white">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  getInitials(user?.name)
                )}
              </span>
              <span className="hidden text-sm font-medium text-text-primary sm:block">{user?.name}</span>
              <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-lg"
                role="menu"
              >
                <Link
                  to="/profil"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-text-primary transition-colors duration-150 hover:bg-brand-peach/60"
                >
                  {t('profileLayout.title')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-status-danger transition-colors duration-150 hover:bg-status-danger/5"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t('common.logout')}
                </button>
              </div>
            )}
          </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
