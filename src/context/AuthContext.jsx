import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authApi, ApiError, mapSupabaseUser } from '../utils/api';

const AuthContext = createContext(null);

function normalizeUser(data) {
  if (!data) return null;

  const email = data.email || data.emailOrPhone || '';
  const nameFromEmail = email.includes('@') ? email.split('@')[0] : email;

  return {
    id: data.id || `usr_${Date.now()}`,
    name: data.name || data.fullName || nameFromEmail || 'Pengguna',
    email,
    phone: data.phone || '',
    emailVerified: data.emailVerified ?? email.includes('@'),
    avatarUrl: data.avatarUrl ?? null,
    badges: data.badges || [
      {
        id: 'active-buyer',
        label: 'Pembeli Aktif',
        description: 'Kamu rutin belanja produk perawatan hewan di FurKeeper.',
      },
      {
        id: 'loyal',
        label: 'Pelanggan Setia',
        description: 'Kamu sudah menyelesaikan beberapa pesanan dan booking.',
      },
    ],
    role: data.role || 'buyer',
    sellerStatus: data.sellerStatus === 'approved' ? 'active' : data.sellerStatus || 'none',
    providerStatus: data.providerStatus === 'approved' ? 'active' : data.providerStatus || 'none',
    partnerSubmittedAt: data.partnerSubmittedAt || null,
    business: data.business || null,
    isSuspended: data.isSuspended || false,
    suspendedReason: data.suspendedReason || null,
  };
}

async function fetchProfileOverrides(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, seller_status, provider_status, business, partner_submitted_at, is_suspended, suspended_reason, avatar_url, full_name')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      // Jangan telan error diam-diam: status mitra dibaca dari sini, dan
      // kalau SELECT-nya gagal (mis. kolom is_suspended/suspended_reason
      // belum ada karena admin_panel.sql belum dijalankan), aplikasi akan
      // diam-diam jatuh ke user_metadata yang TIDAK tepercaya. Beri tahu
      // lewat console sehingga mudah didiagnosis.
      console.warn(
        '[AuthContext] fetchProfileOverrides gagal membaca profiles — cek apakah migrasi ' +
          'schema.sql & admin_panel.sql sudah dijalankan (kolom is_suspended/suspended_reason/email). ' +
          'Status mitra akan jatuh ke user_metadata (bisa tidak konsisten).',
        error,
      );
      return null;
    }
    if (!data) {
      console.warn(
        `[AuthContext] profiles tidak punya baris untuk user ${userId} — biasanya berarti ` +
          'trigger handle_new_user (schema.sql / admin_panel.sql) belum sempat membuatnya saat signup.',
      );
      return null;
    }
    return {
      role: data.role,
      sellerStatus: data.seller_status,
      providerStatus: data.provider_status,
      business: data.business,
      partnerSubmittedAt: data.partner_submitted_at,
      isSuspended: data.is_suspended,
      suspendedReason: data.suspended_reason,
      avatarUrl: data.avatar_url,
      fullName: data.full_name,
    };
  } catch (err) {
    console.warn('[AuthContext] fetchProfileOverrides error tak terduga:', err);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function resolveSession(session) {
      const base = mapSupabaseUser(session?.user);
      if (!base) {
        if (active) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      const overrides = await fetchProfileOverrides(base.id);
      if (!active) return;

      if (overrides?.isSuspended) {
        await supabase.auth.signOut();
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      setToken(session?.access_token || null);
      setUser(normalizeUser({ ...base, ...overrides }));
      setIsLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => resolveSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      // PATCH: tanpa ini, isLoading cuma true sekali di load pertama.
      // Login baru race dengan navigate() di LoginPage, jadi guard
      // (DashboardRoute/ProtectedRoute) sempat baca isLoggedIn=false
      // dan mental balik ke /login walau login-nya sebenarnya berhasil.
      //
      // Tapi jangan set isLoading(true) untuk SEMUA event: TOKEN_REFRESHED
      // menyala berkala (~tiap jam) dan tiap tab refocus, sehingga seluruh
      // UI berkedip spinner tanpa ada perubahan user sama sekali. Loader
      // hanya perlu menyala untuk event yang benar-benar mengubah siapa
      // yang login. resolveSession tetap dipanggil untuk semua event agar
      // status profiles (mis. baru disetujui admin) selalu segar.
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setIsLoading(true);
      }
      resolveSession(session);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback(async (patch) => {
    try {
      const { user: nextRaw } = await authApi.updateMe(patch);
      setUser(normalizeUser(nextRaw));
    } catch (err) {
      setUser((prev) => (prev ? normalizeUser({ ...prev, ...patch }) : prev));
      throw err;
    }
  }, []);

  const updatePartnerStatus = useCallback(
    async (type, status) => {
      const field = type === 'provider' ? 'providerStatus' : 'sellerStatus';
      const patch = { [field]: status };
      if (status === 'pending') {
        patch.partnerSubmittedAt = new Date().toISOString();
      }
      await updateUser(patch);
    },
    [updateUser],
  );

  const registerInit = useCallback(async (payload) => {
    try {
      return await authApi.registerInit(payload);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('Gagal memulai pendaftaran, coba lagi.');
    }
  }, []);

  const resendConfirmation = useCallback(async (email) => {
    try {
      await authApi.resendConfirmation(email);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('Gagal mengirim ulang link konfirmasi.');
    }
  }, []);

  const loginWithPassword = useCallback(async ({ emailOrPhone, password }) => {
    const { user: base } = await authApi.login({ emailOrPhone, password });
    const overrides = await fetchProfileOverrides(base?.id);
    return normalizeUser({ ...base, ...overrides });
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await authApi.loginWithGoogle();
  }, []);

  const changePassword = useCallback(
    async ({ oldPassword, newPassword }) => {
      await authApi.changePassword({ email: user?.email, oldPassword, newPassword });
    },
    [user?.email],
  );

  const requestPasswordReset = useCallback(async (email) => {
    try {
      await authApi.requestPasswordReset(email);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('Gagal mengirim link reset kata sandi.');
    }
  }, []);

  const resetPassword = useCallback(async (newPassword) => {
    try {
      await authApi.updatePassword(newPassword);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('Gagal mengubah kata sandi.');
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await authApi.deleteAccount();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isLoggedIn: Boolean(user),
      isAdmin: user?.role === 'admin',
      logout,
      updateUser,
      updatePartnerStatus,
      registerInit,
      resendConfirmation,
      loginWithPassword,
      loginWithGoogle,
      changePassword,
      requestPasswordReset,
      resetPassword,
      deleteAccount,
    }),
    [
      user,
      token,
      isLoading,
      logout,
      updateUser,
      updatePartnerStatus,
      registerInit,
      resendConfirmation,
      loginWithPassword,
      loginWithGoogle,
      changePassword,
      requestPasswordReset,
      resetPassword,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { AuthContext };