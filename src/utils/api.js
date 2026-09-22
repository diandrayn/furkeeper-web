// Auth layer backed by Supabase Auth (replaces the old furkeeper_backend
// Express server). Only e-mail + password auth is wired up — phone/OTP was
// dropped since the project only configured the Email provider in Supabase.
//
// Sign-up confirmation uses Supabase's e-mail LINK flow (not a typed OTP
// code): signUp() sends the link itself, and clicking it lands back on
// `emailRedirectTo` with a session already established (supabase-js parses
// the tokens from the URL automatically — see detectSessionInUrl in
// supabaseClient.js). There is no separate "verify" API call needed.
import { supabase } from '../lib/supabaseClient';
import { isValidEmail } from './validation';

export class ApiError extends Error {
  constructor(message, { status, fields } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields || {};
  }
}

// Tujuan redirect setelah link konfirmasi email diklik. Default = origin
// aplikasi yang sedang dipakai (mis. http://localhost:5173), tapi bisa
// dipaksa ke URL produksi lewat env VITE_SITE_URL — penting saat signup
// terjadi lewat URL preview/staging yang tidak ingin jadi tujuan tautan
// konfirmasi (dan harus terdaftar di Authentication → URL Configuration).
function resolveEmailRedirectTo() {
  return import.meta.env.VITE_SITE_URL || window.location.origin;
}

function mapSupabaseUser(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    fullName: meta.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    emailVerified: Boolean(user.email_confirmed_at),
    role: meta.role || 'buyer',
    sellerStatus: meta.sellerStatus || 'none',
    providerStatus: meta.providerStatus || 'none',
    partnerSubmittedAt: meta.partnerSubmittedAt || null,
    business: meta.business || null,
    avatarUrl: meta.avatarUrl || null,
  };
}

function friendlySignUpError(error) {
  const msg = error?.message || '';
  if (/already registered|already exists|user already/i.test(msg)) {
    return new ApiError('Akun dengan email ini sudah terdaftar', {
      status: 409,
      fields: { emailOrPhone: 'Akun sudah terdaftar. Coba masuk sebagai gantinya.' },
    });
  }
  if (/password/i.test(msg)) {
    return new ApiError('Kata sandi minimal 6 karakter', {
      status: 400,
      fields: { password: msg },
    });
  }
  return new ApiError(msg || 'Gagal memulai pendaftaran, coba lagi.');
}

// signInWithPassword collapses several real causes into one opaque error, so
// guess the right message from Supabase's wording instead of always showing
// "email atau kata sandi salah" — that message actively misleads a fresh
// registrant whose email simply hasn't been confirmed yet.
function friendlyLoginError(error) {
  const msg = error?.message || error?.code || '';
  if (/email.*not.*confirmed|not.*confirmed|email_not_confirmed|unverified/i.test(msg)) {
    return new ApiError('Email belum dikonfirmasi. Buka email kamu dan klik link verifikasinya.', {
      status: 428,
      fields: { emailOrPhone: 'Email belum dikonfirmasi' },
    });
  }
  if (/invalid login credentials|invalid credentials|user not found|password.*(wrong|incorrect)/i.test(msg)) {
    return new ApiError('Email atau kata sandi salah', { status: 401 });
  }
  if (/too many requests|rate limit/i.test(msg)) {
    return new ApiError('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.', { status: 429 });
  }
  if (/suspended|disabled|banned/i.test(msg)) {
    return new ApiError('Akun ini dinonaktifkan. Hubungi tim FurKeeper.', { status: 403 });
  }
  return new ApiError(msg || 'Gagal masuk, coba lagi.', { status: error?.status || 500 });
}

export const authApi = {
  /** Creates the (unconfirmed) Supabase user, which sends the confirmation
   * link e-mail. Clicking that link is what actually signs the user in —
   * there's nothing to submit back to the app from here. */
  async registerInit({ fullName, emailOrPhone, password, role = 'buyer', business }) {
    const email = String(emailOrPhone || '').trim();
    if (!isValidEmail(email)) {
      throw new ApiError('Pendaftaran saat ini hanya mendukung email (belum ada verifikasi SMS)', {
        status: 400,
        fields: { emailOrPhone: 'Gunakan alamat email, bukan nomor HP' },
      });
    }

    const now = new Date().toISOString();
    const metadata = {
      full_name: fullName,
      role,
      business: role !== 'buyer' ? business || null : null,
      sellerStatus: role === 'seller' ? 'pending' : 'none',
      providerStatus: role === 'service' ? 'pending' : 'none',
      partnerSubmittedAt: role !== 'buyer' ? now : null,
    };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: resolveEmailRedirectTo(),
      },
    });
    if (error) throw friendlySignUpError(error);

    return { email };
  },

  async resendConfirmation(email) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: resolveEmailRedirectTo() },
    });
    if (error) throw new ApiError(error.message || 'Gagal mengirim ulang link konfirmasi.');
  },

  async login({ emailOrPhone, password }) {
    const email = String(emailOrPhone || '').trim();
    if (!isValidEmail(email)) {
      throw new ApiError('Masuk saat ini hanya mendukung email (belum ada login lewat No. HP)', {
        status: 400,
        fields: { emailOrPhone: 'Gunakan alamat email, bukan nomor HP' },
      });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw friendlyLoginError(error);
    return { token: data.session?.access_token, user: mapSupabaseUser(data.user) };
  },

  async loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new ApiError(error.message || 'Gagal masuk dengan Google');
    // Browser gets redirected away here — nothing else runs after this.
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return { token: data.session?.access_token || null, user: mapSupabaseUser(data.session?.user) };
  },

  async updateMe(patch) {
    const { data, error } = await supabase.auth.updateUser({ data: patch });
    if (error) throw new ApiError(error.message || 'Gagal memperbarui profil.');
    return { user: mapSupabaseUser(data.user) };
  },

  /** Verifies `oldPassword` by re-authenticating (Supabase's updateUser()
   * doesn't ask for the current password itself), then sets the new one. */
  async changePassword({ email, oldPassword, newPassword }) {
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword,
    });
    if (verifyErr) {
      throw new ApiError('Password lama salah', { status: 401, fields: { oldPassword: 'Password lama salah' } });
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new ApiError(error.message || 'Gagal mengubah password.');
  },

  /** Sends the password-reset e-mail. Clicking the link lands back on the
   * app with a recovery session already established (detectSessionInUrl),
   * then ResetPasswordPage calls updatePassword() below. */
  async requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      throw new ApiError(error.message || 'Gagal mengirim link reset kata sandi.');
    }
  },

  /** Sets a new password for the currently signed-in session — used by the
   * reset flow (a recovery session exists after clicking the e-mail link). */
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new ApiError(error.message || 'Gagal mengubah kata sandi.');
  },

  /** Deletes the current user's own account (and, via `on delete cascade`,
   * everything owned by it) through the `delete_own_account` RPC defined in
   * supabase/chat_and_account_upgrade.sql. */
  async deleteAccount() {
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw new ApiError(error.message || 'Gagal menghapus akun.');
    await supabase.auth.signOut();
  },
};

export { mapSupabaseUser };
