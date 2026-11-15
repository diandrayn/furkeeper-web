import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';

const COOKIE_NAME = 'fk_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export { COOKIE_NAME };

function sessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL;
  if (!secret) throw new Error('SESSION_SECRET or DATABASE_URL must be configured.');
  return secret;
}

function signUserId(userId, sessionVersion) {
  return crypto
    .createHmac('sha256', sessionSecret())
    .update(`${userId}.${sessionVersion}`)
    .digest('base64url');
}

function verifySession(value) {
  const parts = String(value || '').split('.');
  let userId;
  let sessionVersion;
  let expectedSignature;
  let receivedSignature;

  if (parts.length === 2) {
    [userId, receivedSignature] = parts;
    sessionVersion = 0;
    expectedSignature = crypto
      .createHmac('sha256', sessionSecret())
      .update(userId || '')
      .digest('base64url');
  } else if (parts.length === 3) {
    const versionValue = Number(parts[1]);
    [userId, receivedSignature] = [parts[0], parts[2]];
    if (!Number.isSafeInteger(versionValue) || versionValue < 0) return null;
    sessionVersion = versionValue;
    expectedSignature = signUserId(userId, sessionVersion);
  } else {
    return null;
  }

  if (!userId || !receivedSignature) return null;
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(receivedSignature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  return { userId, sessionVersion };
}

export function mapProfileUser(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    fullName: profile.full_name || '',
    name: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    emailVerified: Boolean(profile.email_verified_at),
    role: profile.role || 'buyer',
    sellerStatus: profile.seller_status,
    providerStatus: profile.provider_status,
    partnerSubmittedAt: profile.partner_submitted_at,
    business: profile.business,
    avatarUrl: profile.avatar_url,
    isSuspended: Boolean(profile.is_suspended),
    suspendedReason: profile.suspended_reason,
    adminScope: profile.admin_scope || 'full',
  };
}

export async function setSessionCookie(userId, sessionVersion = 0) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, `${userId}.${sessionVersion}.${signUserId(userId, sessionVersion)}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function getSessionUser() {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const session = verifySession(raw);
  if (!session) return null;
  const profile = await prisma.profiles.findUnique({ where: { id: session.userId } });
  if (
    !profile ||
    profile.is_suspended ||
    (profile.session_version || 0) !== session.sessionVersion
  ) return null;
  return profile;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, 'Kamu harus login.');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') throw new HttpError(403, 'Akses admin diperlukan.');
  return user;
}

export async function requireStoreOwner(storeId) {
  const user = await requireUser();
  const store = await prisma.stores.findUnique({ where: { id: storeId } });
  if (!store) throw new HttpError(404, 'Toko tidak ditemukan.');
  if (store.owner_id !== user.id && user.role !== 'admin') {
    throw new HttpError(403, 'Kamu bukan pemilik toko ini.');
  }
  return { user, store };
}

export async function ownsStoreKind(userId, kind) {
  return prisma.stores.findFirst({
    where: { owner_id: userId, kind },
  });
}
