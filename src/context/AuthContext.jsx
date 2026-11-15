import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, ApiError } from '../utils/api';

const AuthContext = createContext(null);

function normalizeUser(data) {
  if (!data) return null;

  const email = data.email || data.emailOrPhone || '';
  const nameFromEmail = email.includes('@') ? email.split('@')[0] : email;

  return {
    id: data.id,
    name: data.name || data.fullName || nameFromEmail || 'Pengguna',
    email,
    phone: data.phone || '',
    emailVerified: Boolean(data.emailVerified),
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
    adminScope: data.adminScope || 'full',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const session = await authApi.getSession();
      setToken(session.token || null);
      setUser(normalizeUser(session.user));
    } catch (error) {
      console.error('Gagal memuat sesi FurKeeper:', error);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refreshSession);
    window.addEventListener('focus', refreshSession);
    return () => window.removeEventListener('focus', refreshSession);
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback(async (patch) => {
    const { user: nextUser } = await authApi.updateMe(patch);
    setUser(normalizeUser(nextUser));
  }, []);

  const updatePartnerStatus = useCallback(
    async (type, status) => {
      const field = type === 'provider' ? 'providerStatus' : 'sellerStatus';
      const patch = { [field]: status };
      if (status === 'pending') patch.partnerSubmittedAt = new Date().toISOString();
      await updateUser(patch);
    },
    [updateUser],
  );

  const registerInit = useCallback(async (payload) => {
    try {
      return await authApi.registerInit(payload);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Gagal memulai pendaftaran, coba lagi.');
    }
  }, []);

  const resendConfirmation = useCallback(async (email) => {
    try {
      return await authApi.resendConfirmation(email);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Gagal mengirim ulang link konfirmasi.');
    }
  }, []);

  const loginWithPassword = useCallback(async (credentials) => {
    const session = await authApi.login(credentials);
    setToken(session.token || null);
    setUser(normalizeUser(session.user));
    setIsLoading(false);
    return normalizeUser(session.user);
  }, []);

  const loginWithGoogle = useCallback(() => authApi.loginWithGoogle(), []);

  const changePassword = useCallback(async ({ oldPassword, newPassword }) => {
    await authApi.changePassword({ oldPassword, newPassword });
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    try {
      await authApi.requestPasswordReset(email);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Gagal mengirim link reset kata sandi.');
    }
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      await authApi.updatePassword(token, newPassword);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Gagal mengubah kata sandi.');
    }
  }, []);

  const verifyEmail = useCallback(async (token) => {
    try {
      await authApi.verifyEmail(token);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Gagal memverifikasi email.');
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
      verifyEmail,
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
      verifyEmail,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export { AuthContext };
