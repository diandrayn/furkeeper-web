import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';

export function mapAddress(row) {
  return {
    id: row.id,
    label: row.label,
    name: row.recipient_name,
    phone: row.phone,
    address: row.full_address,
    city: row.city || 'Malang',
    district: row.district || '',
    postalCode: row.postal_code || '',
    isDefault: Boolean(row.is_default),
  };
}

export function mapPet(row) {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    breed: row.breed || '',
    age: row.age || '',
    weight: row.weight || '',
    notes: row.notes || '',
    photoUrl: row.photo_url || null,
  };
}

export function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.body || '',
    timestamp: row.created_at,
    isRead: Boolean(row.is_read),
    linkTo: row.link || null,
  };
}

async function ensureSingleDefault(userId, preferredId = null) {
  const rows = await prisma.addresses.findMany({ where: { user_id: userId }, orderBy: { created_at: 'asc' } });
  if (!rows.length) return;
  const target = preferredId && rows.some((r) => r.id === preferredId) ? preferredId : rows.find((r) => r.is_default)?.id || rows[0].id;
  await prisma.$transaction(
    rows.map((row) =>
      prisma.addresses.update({ where: { id: row.id }, data: { is_default: row.id === target } }),
    ),
  );
}

export async function listAddresses(user) {
  const rows = await prisma.addresses.findMany({ where: { user_id: user.id }, orderBy: { created_at: 'desc' } });
  return rows.map(mapAddress);
}

export async function createAddress(user, payload) {
  const count = await prisma.addresses.count({ where: { user_id: user.id } });
  const isDefault = count === 0 ? true : Boolean(payload.isDefault);
  const row = await prisma.addresses.create({
    data: {
      user_id: user.id,
      label: payload.label,
      recipient_name: payload.name,
      phone: payload.phone,
      full_address: payload.address,
      city: payload.city || 'Malang',
      district: payload.district || null,
      postal_code: payload.postalCode || null,
      is_default: isDefault,
    },
  });
  if (isDefault) await ensureSingleDefault(user.id, row.id);
  return mapAddress(await prisma.addresses.findUnique({ where: { id: row.id } }));
}

export async function updateAddress(user, id, payload) {
  const existing = await prisma.addresses.findUnique({ where: { id } });
  if (!existing || existing.user_id !== user.id) throw new HttpError(404, 'Alamat tidak ditemukan.');
  const data = {};
  if (payload.label !== undefined) data.label = payload.label;
  if (payload.name !== undefined) data.recipient_name = payload.name;
  if (payload.phone !== undefined) data.phone = payload.phone;
  if (payload.address !== undefined) data.full_address = payload.address;
  if (payload.city !== undefined) data.city = payload.city;
  if (payload.district !== undefined) data.district = payload.district;
  if (payload.postalCode !== undefined) data.postal_code = payload.postalCode;
  if (payload.isDefault !== undefined) data.is_default = Boolean(payload.isDefault);
  await prisma.addresses.update({ where: { id }, data });
  if (data.is_default) await ensureSingleDefault(user.id, id);
  return mapAddress(await prisma.addresses.findUnique({ where: { id } }));
}

export async function deleteAddress(user, id) {
  const existing = await prisma.addresses.findUnique({ where: { id } });
  if (!existing || existing.user_id !== user.id) throw new HttpError(404, 'Alamat tidak ditemukan.');
  await prisma.addresses.delete({ where: { id } });
  await ensureSingleDefault(user.id);
  return { ok: true };
}

export async function setDefaultAddress(user, id) {
  return updateAddress(user, id, { isDefault: true });
}

export async function listPets(user) {
  const rows = await prisma.pets.findMany({ where: { owner_id: user.id }, orderBy: { created_at: 'desc' } });
  return rows.map(mapPet);
}

export async function createPet(user, payload) {
  const row = await prisma.pets.create({
    data: {
      owner_id: user.id,
      name: payload.name,
      species: payload.species,
      breed: payload.breed || null,
      age: payload.age || null,
      weight: payload.weight || null,
      notes: payload.notes || null,
      photo_url: payload.photoUrl || null,
    },
  });
  return mapPet(row);
}

export async function updatePet(user, id, payload) {
  const existing = await prisma.pets.findUnique({ where: { id } });
  if (!existing || existing.owner_id !== user.id) throw new HttpError(404, 'Hewan tidak ditemukan.');
  const row = await prisma.pets.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.species !== undefined ? { species: payload.species } : {}),
      ...(payload.breed !== undefined ? { breed: payload.breed } : {}),
      ...(payload.age !== undefined ? { age: payload.age } : {}),
      ...(payload.weight !== undefined ? { weight: payload.weight } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(payload.photoUrl !== undefined ? { photo_url: payload.photoUrl } : {}),
    },
  });
  return mapPet(row);
}

export async function deletePet(user, id) {
  const existing = await prisma.pets.findUnique({ where: { id } });
  if (!existing || existing.owner_id !== user.id) throw new HttpError(404, 'Hewan tidak ditemukan.');
  await prisma.pets.delete({ where: { id } });
  return { ok: true };
}

export async function listNotifications(user) {
  const rows = await prisma.notifications.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapNotification);
}

export async function markNotificationRead(user, id) {
  await prisma.notifications.updateMany({ where: { id, user_id: user.id }, data: { is_read: true } });
  return { ok: true };
}

export async function markAllNotificationsRead(user) {
  await prisma.notifications.updateMany({ where: { user_id: user.id, is_read: false }, data: { is_read: true } });
  return { ok: true };
}
