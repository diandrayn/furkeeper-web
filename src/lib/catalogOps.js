import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';
import { applyListingApproval, PRODUCT_CONTENT_KEYS, SERVICE_CONTENT_KEYS } from '@/lib/listingApproval';
import { mapDashboardProduct, mapDashboardService, mapPublicProduct, mapPublicService } from '@/lib/mappers';
import { requireStoreOwner } from '@/lib/session';
import { ensureStore } from '@/lib/storeOps';

export async function listPublicProducts() {
  const rows = await prisma.products.findMany({
    where: { is_active: true, approval_status: 'approved' },
    include: { store: true },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapPublicProduct);
}

export async function listPublicServices() {
  const rows = await prisma.services.findMany({
    where: { is_active: true, approval_status: 'approved' },
    include: { store: true },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapPublicService);
}

export async function listMyProducts(user, storeId) {
  await requireStoreOwner(storeId);
  const rows = await prisma.products.findMany({
    where: { store_id: storeId },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapDashboardProduct);
}

export async function listMyServices(user, storeId) {
  await requireStoreOwner(storeId);
  const rows = await prisma.services.findMany({
    where: { store_id: storeId },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapDashboardService);
}

export async function createProduct(user, storeId, payload) {
  await requireStoreOwner(storeId);
  const patch = applyListingApproval(user, null, {
    store_id: storeId,
    name: payload.name,
    category: payload.category,
    pet_type: payload.petType,
    description: payload.description || null,
    price: payload.price,
    original_price: payload.originalPrice || null,
    stock: payload.stock,
    is_active: payload.status !== 'nonaktif',
    image_url: payload.imageUrl || null,
  }, PRODUCT_CONTENT_KEYS);
  const row = await prisma.products.create({ data: patch });
  return mapDashboardProduct(row);
}

export async function updateProduct(user, id, payload) {
  const existing = await prisma.products.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Produk tidak ditemukan.');
  await requireStoreOwner(existing.store_id);
  const next = applyListingApproval(
    user,
    existing,
    {
      name: payload.name,
      category: payload.category,
      pet_type: payload.petType,
      description: payload.description || null,
      price: payload.price,
      original_price: payload.originalPrice || null,
      stock: payload.stock,
      is_active: payload.status !== 'nonaktif',
      ...(payload.imageUrl !== undefined ? { image_url: payload.imageUrl } : {}),
    },
    PRODUCT_CONTENT_KEYS,
  );
  const row = await prisma.products.update({ where: { id }, data: next });
  return mapDashboardProduct(row);
}

export async function deleteProduct(user, id) {
  const existing = await prisma.products.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Produk tidak ditemukan.');
  if (user.role !== 'admin') await requireStoreOwner(existing.store_id);
  await prisma.products.delete({ where: { id } });
  return { ok: true };
}

export async function createService(user, storeId, payload) {
  await requireStoreOwner(storeId);
  const patch = applyListingApproval(user, null, {
    store_id: storeId,
    name: payload.name,
    service_type: payload.serviceType,
    description: payload.description || null,
    price_from: payload.price,
    duration: payload.duration || null,
    is_active: payload.status !== 'nonaktif',
    image_url: payload.imageUrl || null,
  }, SERVICE_CONTENT_KEYS);
  const row = await prisma.services.create({ data: patch });
  return mapDashboardService(row);
}

export async function updateService(user, id, payload) {
  const existing = await prisma.services.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Jasa tidak ditemukan.');
  await requireStoreOwner(existing.store_id);
  const next = applyListingApproval(
    user,
    existing,
    {
      name: payload.name,
      service_type: payload.serviceType,
      description: payload.description || null,
      price_from: payload.price,
      duration: payload.duration || null,
      is_active: payload.status !== 'nonaktif',
      ...(payload.imageUrl !== undefined ? { image_url: payload.imageUrl } : {}),
    },
    SERVICE_CONTENT_KEYS,
  );
  const row = await prisma.services.update({ where: { id }, data: next });
  return mapDashboardService(row);
}

export async function deleteService(user, id) {
  const existing = await prisma.services.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Jasa tidak ditemukan.');
  if (user.role !== 'admin') await requireStoreOwner(existing.store_id);
  await prisma.services.delete({ where: { id } });
  return { ok: true };
}

export { ensureStore };
