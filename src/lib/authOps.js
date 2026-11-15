import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';
import { clearSessionCookie, mapProfileUser, setSessionCookie } from '@/lib/session';
import { appUrl, assertEmailDeliveryConfigured, sendEmail } from '@/lib/email';
import { isValidEmail } from '@/utils/validation';

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_TOKEN_LIMIT_PER_HOUR = 3;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function createToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function emailLink(path, token) {
  return `${appUrl()}${path}?token=${encodeURIComponent(token)}`;
}

async function issuePasswordResetToken(userId) {
  const token = createToken();
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.password_reset_tokens.updateMany({
      where: { user_id: userId, used_at: null },
      data: { used_at: now },
    });
    await tx.password_reset_tokens.create({
      data: {
        user_id: userId,
        token_hash: hashToken(token),
        expires_at: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
      },
    });
  });
  return token;
}

async function issueEmailVerificationToken(userId) {
  const token = createToken();
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.email_verification_tokens.updateMany({
      where: { user_id: userId, used_at: null },
      data: { used_at: now },
    });
    await tx.email_verification_tokens.create({
      data: {
        user_id: userId,
        token_hash: hashToken(token),
        expires_at: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
      },
    });
  });
  return token;
}

async function sendVerificationEmail(email, token) {
  const link = emailLink('/verifikasi-email', token);
  const safeLink = escapeHtml(link);
  await sendEmail({
    to: email,
    subject: 'Konfirmasi email FurKeeper',
    text: `Konfirmasi email kamu dengan membuka link ini: ${link}\nLink berlaku selama 24 jam.`,
    html: `<p>Konfirmasi email kamu untuk menyelesaikan pendaftaran FurKeeper.</p><p><a href="${safeLink}">Konfirmasi email</a></p><p>Link berlaku selama 24 jam. Jika kamu tidak membuat akun, abaikan email ini.</p>`,
  });
}

async function sendPasswordResetEmail(email, token) {
  const link = emailLink('/reset-password', token);
  const safeLink = escapeHtml(link);
  await sendEmail({
    to: email,
    subject: 'Atur ulang kata sandi FurKeeper',
    text: `Atur ulang kata sandi kamu dengan membuka link ini: ${link}\nLink berlaku selama 30 menit. Jika kamu tidak meminta reset, abaikan email ini.`,
    html: `<p>Kami menerima permintaan untuk mengatur ulang kata sandi akun FurKeeper kamu.</p><p><a href="${safeLink}">Atur ulang kata sandi</a></p><p>Link berlaku selama 30 menit. Jika kamu tidak meminta reset, abaikan email ini.</p>`,
  });
}

export async function registerUser({ fullName, emailOrPhone, password, role = 'buyer', business }) {
  const email = String(emailOrPhone || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    throw new HttpError(400, 'Pendaftaran saat ini hanya mendukung email (belum ada verifikasi SMS)', {
      fields: { emailOrPhone: 'Gunakan alamat email, bukan nomor HP' },
    });
  }
  if (!password || String(password).length < 6) {
    throw new HttpError(400, 'Kata sandi minimal 6 karakter', {
      fields: { password: 'Kata sandi minimal 6 karakter' },
    });
  }
  assertEmailDeliveryConfigured();

  const existing = await prisma.profiles.findUnique({ where: { email } });
  if (existing) {
    if (!existing.email_verified_at) {
      try {
        const result = await resendConfirmation(email);
        return { email, verificationRequired: true, emailSent: result.emailSent };
      } catch (error) {
        console.error('Registration verification resend failed:', error);
        return { email, verificationRequired: true, emailSent: false };
      }
    }
    throw new HttpError(409, 'Akun dengan email ini sudah terdaftar', {
      fields: { emailOrPhone: 'Akun sudah terdaftar. Coba masuk sebagai gantinya.' },
    });
  }

  const now = new Date();
  const isPartner = role === 'seller' || role === 'service';
  const profile = await prisma.profiles.create({
    data: {
      id: crypto.randomUUID(),
      email,
      full_name: fullName || null,
      password_hash: await bcrypt.hash(String(password), 10),
      email_verified_at: null,
      role: isPartner ? role : 'buyer',
      business: isPartner ? business || null : null,
      seller_status: role === 'seller' ? 'pending' : 'none',
      provider_status: role === 'service' ? 'pending' : 'none',
      partner_submitted_at: isPartner ? now : null,
    },
  });

  const token = await issueEmailVerificationToken(profile.id);
  try {
    await sendVerificationEmail(profile.email, token);
    return { email, verificationRequired: true, emailSent: true };
  } catch (error) {
    console.error('Registration verification email failed:', error);
    return { email, verificationRequired: true, emailSent: false };
  }
}

export async function loginUser({ emailOrPhone, password }) {
  const email = String(emailOrPhone || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    throw new HttpError(400, 'Masuk saat ini hanya mendukung email (belum ada login lewat No. HP)', {
      fields: { emailOrPhone: 'Gunakan alamat email, bukan nomor HP' },
    });
  }

  const profile = await prisma.profiles.findUnique({ where: { email } });
  if (!profile?.password_hash) {
    throw new HttpError(401, 'Email atau kata sandi salah');
  }
  const ok = await bcrypt.compare(String(password || ''), profile.password_hash);
  if (!ok) throw new HttpError(401, 'Email atau kata sandi salah');
  if (profile.is_suspended) {
    throw new HttpError(403, 'Akun ini dinonaktifkan. Hubungi tim FurKeeper.');
  }
  if (!profile.email_verified_at) {
    throw new HttpError(428, 'Email belum dikonfirmasi. Buka email kamu dan klik link verifikasinya.', {
      fields: { emailOrPhone: 'Email belum dikonfirmasi' },
    });
  }

  await setSessionCookie(profile.id, profile.session_version || 0);
  return { token: profile.id, user: mapProfileUser(profile) };
}

export async function logoutUser() {
  await clearSessionCookie();
  return { ok: true };
}

export async function updateProfile(user, patch) {
  const data = {};
  if (patch.fullName !== undefined || patch.name !== undefined) {
    data.full_name = patch.fullName ?? patch.name;
  }
  if (patch.phone !== undefined) data.phone = patch.phone;
  if (patch.avatarUrl !== undefined) data.avatar_url = patch.avatarUrl;
  if (patch.business !== undefined) data.business = patch.business;

  if (user.role === 'admin') {
    if (patch.role !== undefined) data.role = patch.role;
    if (patch.sellerStatus !== undefined) data.seller_status = patch.sellerStatus;
    if (patch.providerStatus !== undefined) data.provider_status = patch.providerStatus;
  } else {
    if (patch.sellerStatus === 'pending') {
      data.seller_status = 'pending';
      data.partner_submitted_at = patch.partnerSubmittedAt ? new Date(patch.partnerSubmittedAt) : new Date();
    }
    if (patch.providerStatus === 'pending') {
      data.provider_status = 'pending';
      data.partner_submitted_at = patch.partnerSubmittedAt ? new Date(patch.partnerSubmittedAt) : new Date();
    }
  }

  const updated = await prisma.profiles.update({ where: { id: user.id }, data });
  return { user: mapProfileUser(updated) };
}

export async function changePassword(user, { oldPassword, newPassword }) {
  const profile = await prisma.profiles.findUnique({ where: { id: user.id } });
  if (!profile?.password_hash) throw new HttpError(400, 'Akun ini tidak memakai kata sandi.');
  const ok = await bcrypt.compare(String(oldPassword || ''), profile.password_hash);
  if (!ok) {
    throw new HttpError(401, 'Password lama salah', { fields: { oldPassword: 'Password lama salah' } });
  }
  if (!newPassword || String(newPassword).length < 6) {
    throw new HttpError(400, 'Kata sandi baru minimal 6 karakter');
  }
  const updated = await prisma.profiles.update({
    where: { id: user.id },
    data: {
      password_hash: await bcrypt.hash(String(newPassword), 10),
      session_version: { increment: 1 },
    },
  });
  await setSessionCookie(updated.id, updated.session_version);
  return { ok: true };
}

export async function requestPasswordReset(emailRaw) {
  const email = String(emailRaw || '').trim().toLowerCase();
  if (!isValidEmail(email)) throw new HttpError(400, 'Alamat email tidak valid.');
  assertEmailDeliveryConfigured();
  const genericResponse = {
    ok: true,
    message: 'Jika email terdaftar, link reset akan dikirim.',
  };
  const profile = await prisma.profiles.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!profile) return genericResponse;

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentRequests = await prisma.password_reset_tokens.count({
    where: { user_id: profile.id, created_at: { gte: since } },
  });
  if (recentRequests >= EMAIL_TOKEN_LIMIT_PER_HOUR) return genericResponse;

  const token = await issuePasswordResetToken(profile.id);
  try {
    await sendPasswordResetEmail(profile.email, token);
  } catch (error) {
    console.error('Password reset email failed:', error);
    await prisma.password_reset_tokens.updateMany({
      where: { user_id: profile.id, token_hash: hashToken(token), used_at: null },
      data: { used_at: new Date() },
    });
  }
  return genericResponse;
}

export async function updatePassword(user, newPassword) {
  if (!newPassword || String(newPassword).length < 6) {
    throw new HttpError(400, 'Kata sandi baru minimal 6 karakter');
  }
  const updated = await prisma.profiles.update({
    where: { id: user.id },
    data: {
      password_hash: await bcrypt.hash(String(newPassword), 10),
      session_version: { increment: 1 },
    },
  });
  await setSessionCookie(updated.id, updated.session_version);
  return { ok: true };
}

export async function completePasswordReset(token, newPassword) {
  if (!token) throw new HttpError(400, 'Token reset tidak valid.');
  if (!newPassword || String(newPassword).length < 6) {
    throw new HttpError(400, 'Kata sandi baru minimal 6 karakter');
  }
  const row = await prisma.password_reset_tokens.findUnique({ where: { token_hash: hashToken(token) } });
  if (!row || row.used_at || row.expires_at < new Date()) {
    throw new HttpError(400, 'Link reset kata sandi tidak valid atau sudah kedaluwarsa.');
  }
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.password_reset_tokens.updateMany({
      where: { id: row.id, used_at: null, expires_at: { gt: new Date() } },
      data: { used_at: new Date() },
    });
    if (claimed.count !== 1) {
      throw new HttpError(400, 'Link reset kata sandi tidak valid atau sudah kedaluwarsa.');
    }
    return tx.profiles.update({
      where: { id: row.user_id },
      data: {
        password_hash: await bcrypt.hash(String(newPassword), 10),
        session_version: { increment: 1 },
      },
    });
  });
  return { ok: true };
}

export async function completeEmailVerification(token) {
  if (!token) throw new HttpError(400, 'Token verifikasi tidak valid.');
  const row = await prisma.email_verification_tokens.findUnique({
    where: { token_hash: hashToken(token) },
    include: { profile: { select: { email_verified_at: true } } },
  });
  if (!row) {
    throw new HttpError(400, 'Link verifikasi tidak valid atau sudah kedaluwarsa.');
  }
  if (row.profile.email_verified_at) return { ok: true };
  if (row.used_at || row.expires_at <= new Date()) {
    throw new HttpError(400, 'Link verifikasi tidak valid atau sudah kedaluwarsa.');
  }

  const claimed = await prisma.$transaction(async (tx) => {
    const claimed = await tx.email_verification_tokens.updateMany({
      where: { id: row.id, used_at: null, expires_at: { gt: new Date() } },
      data: { used_at: new Date() },
    });
    if (claimed.count !== 1) return false;
    await tx.profiles.update({
      where: { id: row.user_id },
      data: { email_verified_at: new Date() },
    });
    return true;
  });
  if (!claimed) {
    const profile = await prisma.profiles.findUnique({
      where: { id: row.user_id },
      select: { email_verified_at: true },
    });
    if (!profile?.email_verified_at) {
      throw new HttpError(400, 'Link verifikasi tidak valid atau sudah kedaluwarsa.');
    }
  }
  return { ok: true };
}

export async function resendConfirmation(emailRaw) {
  const email = String(emailRaw || '').trim().toLowerCase();
  if (!isValidEmail(email)) throw new HttpError(400, 'Alamat email tidak valid.');
  assertEmailDeliveryConfigured();

  const genericResponse = { ok: true };
  const profile = await prisma.profiles.findUnique({
    where: { email },
    select: { id: true, email: true, email_verified_at: true },
  });
  if (!profile || profile.email_verified_at) return { ...genericResponse, emailSent: false };

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentRequests = await prisma.email_verification_tokens.count({
    where: { user_id: profile.id, created_at: { gte: since } },
  });
  if (recentRequests >= EMAIL_TOKEN_LIMIT_PER_HOUR) return { ...genericResponse, emailSent: false };

  const token = await issueEmailVerificationToken(profile.id);
  try {
    await sendVerificationEmail(profile.email, token);
  } catch (error) {
    console.error('Email verification resend failed:', error);
    await prisma.email_verification_tokens.updateMany({
      where: { user_id: profile.id, token_hash: hashToken(token), used_at: null },
      data: { used_at: new Date() },
    });
    throw new HttpError(502, 'Gagal mengirim email verifikasi. Coba lagi nanti.');
  }
  return { ...genericResponse, emailSent: true };
}

export async function deleteOwnAccount(user) {
  await prisma.profiles.delete({ where: { id: user.id } });
  await clearSessionCookie();
  return { ok: true };
}
