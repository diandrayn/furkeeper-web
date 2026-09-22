import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Store as StoreIcon,
  Package,
  Scissors,
  Star,
  Receipt,
  Flag,
  Tags,
  History,
  MessageCircle,
  ShieldCheck,
  SlidersHorizontal,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  ChevronDown,
  HelpCircle,
  Wallet,
} from 'lucide-react';
import Logo from '../Logo';
import PawLoader from '../decorative/PawLoader';
import { useAuth } from '../../hooks/useAuth';
import { useAdminScope } from '../../hooks/useAdminScope';
import { canAccessAdminPath } from '../../utils/adminScope';
import { ADMIN_SCOPE_LABELS } from '../../utils/admin';
import { getInitials } from '../../utils/status';

const NAV = [
  { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/admin/mitra', label: 'Pendaftaran Mitra', icon: UserCheck },
  { to: '/admin/pengguna', label: 'Pengguna', icon: Users },
  { to: '/admin/toko', label: 'Toko', icon: StoreIcon },
  { to: '/admin/produk', label: 'Produk', icon: Package },
  { to: '/admin/jasa', label: 'Jasa', icon: Scissors },
  { to: '/admin/kategori', label: 'Kategori', icon: Tags },
  { to: '/admin/transaksi', label: 'Transaksi', icon: Receipt },
  { to: '/admin/laporan', label: 'Laporan', icon: Flag },
  { to: '/admin/ulasan', label: 'Ulasan', icon: Star },
  { to: '/admin/pesan', label: 'Pesan Bantuan', icon: MessageCircle },
  { to: '/admin/faq', label: 'Kelola FAQ', icon: HelpCircle },
  { to: '/admin/keuangan', label: 'Keuangan', icon: Wallet },
  { to: '/admin/role-admin', label: 'Role Admin', icon: ShieldCheck },
  { to: '/admin/log-aktivitas', label: 'Log Aktivitas', icon: History },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: SlidersHorizontal },
];

const PAGE_TITLES = {
  '/admin': 'Ringkasan Platform',
  '/admin/mitra': 'Pendaftaran Mitra',
  '/admin/pengguna': 'Kelola Pengguna',
  '/admin/toko': 'Toko & Mitra',
  '/admin/produk': 'Moderasi Produk',
  '/admin/jasa': 'Moderasi Jasa',
  '/admin/kategori': 'Kelola Kategori',
  '/admin/transaksi': 'Transaksi & Booking',
  '/admin/laporan': 'Kelola Laporan',
  '/admin/ulasan': 'Moderasi Ulasan',
  '/admin/pesan': 'Kelola Pesan (Bantuan)',
  '/admin/faq': 'Kelola FAQ',
  '/admin/keuangan': 'Kelola Keuangan',
  '/admin/role-admin': 'Manajemen Role Admin',
  '/admin/log-aktivitas': 'Log Aktivitas Admin',
  '/admin/pengaturan': 'Pengaturan Platform',
};

function navLinkClass({ isActive }) {
  return `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ${
    isActive ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'
  }`;
}

function SidebarContent({ items, scopeLabel, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <Logo variant="light" />
        <span className="mt-1 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
          {scopeLabel || 'Admin'}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3.5" aria-label="Menu admin">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass} onClick={onNavigate}>
            <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

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

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scope, isLoading: scopeLoading } = useAdminScope();

  // Menu and route access follow admin_scope (see utils/adminScope.js).
  // While the scope is still loading nothing is shown, rather than flashing
  // menus the admin then loses.
  const navItems = scopeLoading ? [] : NAV.filter((item) => canAccessAdminPath(scope, item.to));
  const scopeLabel = scope && scope !== 'full' ? ADMIN_SCOPE_LABELS[scope] : null;
  const pathAllowed = scopeLoading || canAccessAdminPath(scope, location.pathname);

  const title = PAGE_TITLES[location.pathname] || (location.pathname.startsWith('/admin/toko/') ? 'Detail Toko' : 'Admin');

  return (
    <div className="min-h-screen bg-brand-cream lg:flex">
      <aside className="hidden w-64 shrink-0 bg-brand-burgundy lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent items={navItems} scopeLabel={scopeLabel} />
        </div>
      </aside>

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
            <SidebarContent items={navItems} scopeLabel={scopeLabel} onNavigate={() => setMobileOpen(false)} />
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
                className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-lg"
                role="menu"
              >
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
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
          {scopeLoading ? (
            <PawLoader label="Memuat hak akses..." />
          ) : pathAllowed ? (
            <Outlet />
          ) : (
            <Navigate to="/admin" replace />
          )}
        </main>
      </div>
    </div>
  );
}
