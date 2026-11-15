import { apiGet, apiPatch, apiPost, ApiError } from '../lib/apiClient';

export { ApiError };

export const authApi = {
  registerInit: (payload) => apiPost('/api/auth/register', payload),
  resendConfirmation: (email) => apiPost('/api/auth/resend-confirmation', { email }),
  login: (credentials) => apiPost('/api/auth/login', credentials),
  loginWithGoogle: () => apiPost('/api/auth/google', {}),
  logout: () => apiPost('/api/auth/logout', {}),
  getSession: () => apiGet('/api/me'),
  updateMe: (patch) => apiPatch('/api/me', patch),
  changePassword: ({ oldPassword, newPassword }) =>
    apiPost('/api/auth/change-password', { oldPassword, newPassword }),
  requestPasswordReset: (email) => apiPost('/api/auth/forgot-password', { email }),
  verifyEmail: (token) => apiPost('/api/auth/verify-email', { token }),
  updatePassword: (token, newPassword) =>
    apiPost('/api/auth/reset-password', { token, newPassword }),
  deleteAccount: () => apiPost('/api/auth/delete-account', {}),
};
