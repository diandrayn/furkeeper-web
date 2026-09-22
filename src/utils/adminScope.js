// Which admin pages each admin_scope (profiles.admin_scope — see
// ADMIN_SCOPE_LABELS / ADMIN_SCOPE_DESCRIPTIONS in utils/admin.js) may open.
// One table, so changing who sees what is a one-line edit.
//
// IMPORTANT: this narrows the *panel* (sidebar + routes). It is not a
// database permission — RLS still treats every role='admin' account the same
// (see supabase/admin_roles_migration.sql). It keeps an Admin Support from
// wandering into Keuangan by clicking around; it does not stop someone
// calling the API directly with their own session.
import { supabase } from '../lib/supabaseClient';

const ALL = '*';

export const ADMIN_SCOPE_PATHS = {
  full: ALL,
  // "Fokus menyetujui/menolak pendaftaran mitra, produk, dan jasa."
  approval: ['/admin', '/admin/mitra', '/admin/toko', '/admin/produk', '/admin/jasa'],
  // "Fokus menangani laporan pengguna dan pesan pusat bantuan." Transaksi is
  // read-only reference for matching a dispute to its order/booking.
  support: ['/admin', '/admin/laporan', '/admin/transaksi', '/admin/pesan', '/admin/faq'],
};

/** Unknown / missing scope behaves as 'full' — same fallback as mapAdminRow. */
export function canAccessAdminPath(scope, pathname) {
  const allowed = ADMIN_SCOPE_PATHS[scope] ?? ALL;
  if (allowed === ALL) return true;
  const path = pathname.replace(/\/+$/, '') || '/';
  return allowed.some((base) => (base === '/admin' ? path === '/admin' : path === base || path.startsWith(`${base}/`)));
}

/** The signed-in admin's own scope, straight from profiles. Resolves to
 * 'full' if the column/migration is missing or the read fails, so a hiccup
 * never locks an admin out of their own panel. */
export async function fetchMyAdminScope() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 'full';
    const { data, error } = await supabase.from('profiles').select('admin_scope').eq('id', user.id).single();
    if (error) throw error;
    return data?.admin_scope || 'full';
  } catch (err) {
    console.error('fetchMyAdminScope failed:', err);
    return 'full';
  }
}
