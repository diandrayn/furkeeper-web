import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';
import { uniqueStoreSlug } from '@/lib/slug';
import {
  mapPublicProduct,
  mapPublicService,
  mapStoreProfile,
  mapStoreReview,
  mapStoreRow,
} from '@/lib/mappers';

export class StoreUnavailableError extends Error {
  constructor() {
    super('Toko tidak tersedia');
    this.name = 'StoreUnavailableError';
    this.status = 410;
  }
}

export async function ensureStore(user, kind) {
  const existing = await prisma.stores.findFirst({
    where: { owner_id: user.id, kind },
    select: { id: true },
  });
  if (existing) return existing.id;

  const business = user.business && typeof user.business === 'object' ? user.business : {};
  const name =
    business.businessName || user.full_name || (kind === 'service' ? 'Usaha Saya' : 'Toko Saya');
  const slug = await uniqueStoreSlug(prisma, name);
  const created = await prisma.stores.create({
    data: {
      owner_id: user.id,
      kind,
      name,
      location: business.businessAddress || null,
      slug,
      operating_hours: [],
    },
  });
  return created.id;
}

export async function getPublicStore(identifier) {
  const id = identifier || '';
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const row = await prisma.stores.findFirst({
    where: isUuid ? { id } : { slug: id },
    include: {
      profile: { select: { is_suspended: true } },
      _count: { select: { products: true, services: true } },
    },
  });
  if (!row) throw new HttpError(404, 'Toko tidak ditemukan');
  if (!row.profile || row.profile.is_suspended) throw new StoreUnavailableError();
  return mapStoreRow({ ...row, product_count: row._count.products, service_count: row._count.services });
}

function listingOrder(sort, priceField, popularField) {
  if (sort === 'price-asc') return { [priceField]: 'asc' };
  if (sort === 'price-desc') return { [priceField]: 'desc' };
  if (sort === 'popular' || sort === 'rating') return { [popularField]: 'desc' };
  return { created_at: 'desc' };
}

export async function listStoreProducts(storeId, { search = '', category = '', sort = 'newest', offset = 0, limit = 12 } = {}) {
  const where = {
    store_id: storeId,
    is_active: true,
    approval_status: 'approved',
    ...(search ? { name: { contains: search } } : {}),
    ...(category ? { category } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.products.findMany({
      where,
      include: { store: true },
      orderBy: listingOrder(sort, 'price', 'sold_count'),
      skip: Number(offset) || 0,
      take: Number(limit) || 12,
    }),
    prisma.products.count({ where }),
  ]);
  return { rows: rows.map(mapPublicProduct), total };
}

export async function listStoreServices(storeId, { search = '', serviceType = '', sort = 'newest', offset = 0, limit = 12 } = {}) {
  const where = {
    store_id: storeId,
    is_active: true,
    approval_status: 'approved',
    ...(search ? { name: { contains: search } } : {}),
    ...(serviceType ? { service_type: serviceType } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.services.findMany({
      where,
      include: { store: true },
      orderBy: listingOrder(sort, 'price_from', 'rating'),
      skip: Number(offset) || 0,
      take: Number(limit) || 12,
    }),
    prisma.services.count({ where }),
  ]);
  return { rows: rows.map(mapPublicService), total };
}

export async function listStoreCategories(storeId) {
  const rows = await prisma.products.findMany({
    where: { store_id: storeId, is_active: true, approval_status: 'approved' },
    select: { category: true },
    distinct: ['category'],
  });
  return rows.map((r) => r.category).filter(Boolean);
}

export async function listStoreServiceTypes(storeId) {
  const rows = await prisma.services.findMany({
    where: { store_id: storeId, is_active: true, approval_status: 'approved' },
    select: { service_type: true },
    distinct: ['service_type'],
  });
  return rows.map((r) => r.service_type).filter(Boolean);
}

export async function listStoreReviews(storeId) {
  const [products, services] = await Promise.all([
    prisma.products.findMany({ where: { store_id: storeId }, select: { id: true } }),
    prisma.services.findMany({ where: { store_id: storeId }, select: { id: true } }),
  ]);
  const productIds = products.map((p) => p.id);
  const serviceIds = services.map((s) => s.id);
  if (!productIds.length && !serviceIds.length) return [];
  const rows = await prisma.reviews.findMany({
    where: {
      OR: [
        productIds.length ? { product_id: { in: productIds } } : undefined,
        serviceIds.length ? { service_id: { in: serviceIds } } : undefined,
      ].filter(Boolean),
    },
    include: { author: true, product: true, service: true },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapStoreReview);
}

export async function searchStores({
  search = '',
  district = '',
  sort = 'newest',
  onlyOpen = false,
  onlyVerified = false,
  hasProducts = false,
  hasServices = false,
  limit = 12,
  offset = 0,
} = {}) {
  const where = {
    profile: { is_suspended: false },
    ...(search ? { name: { contains: search } } : {}),
    ...(district ? { district } : {}),
    ...(onlyOpen ? { is_open: true } : {}),
    ...(onlyVerified ? { trusted: true } : {}),
    ...(hasProducts
      ? { products: { some: { is_active: true, approval_status: 'approved' } } }
      : {}),
    ...(hasServices
      ? { services: { some: { is_active: true, approval_status: 'approved' } } }
      : {}),
  };

  let orderBy = { created_at: 'desc' };
  if (sort === 'rating') orderBy = { rating: 'desc' };
  if (sort === 'name' || sort === 'nearest') orderBy = { name: 'asc' };

  const [rows, total] = await Promise.all([
    prisma.stores.findMany({
      where,
      include: {
        _count: {
          select: {
            products: { where: { is_active: true, approval_status: 'approved' } },
            services: { where: { is_active: true, approval_status: 'approved' } },
          },
        },
      },
      orderBy,
      skip: Number(offset) || 0,
      take: Number(limit) || 12,
    }),
    prisma.stores.count({ where }),
  ]);

  return {
    rows: rows.map((row) =>
      mapStoreRow({
        ...row,
        product_count: row._count.products,
        service_count: row._count.services,
      }),
    ),
    total,
  };
}

export async function storePublicStats(storeId) {
  const [completedOrders, completedBookings, reviews] = await Promise.all([
    prisma.orders.count({
      where: { status: 'completed', items: { some: { store_id: storeId } } },
    }),
    prisma.bookings.count({
      where: { status: 'completed', service: { store_id: storeId } },
    }),
    prisma.reviews.count({
      where: {
        OR: [{ product: { store_id: storeId } }, { service: { store_id: storeId } }],
      },
    }),
  ]);
  return { completedOrders, completedBookings, reviews };
}

export async function saveStoreProfile(storeId, profile) {
  const patch = {
    name: profile.name,
    category: profile.category || null,
    tagline: profile.tagline || null,
    description: profile.description || null,
    store_policy: profile.storePolicy || null,
    district: profile.district || null,
    city: profile.city || null,
    phone: profile.phone || null,
    email: profile.email || null,
    address: profile.address || null,
    home_service: Boolean(profile.homeService),
    is_open: profile.isOpen !== false,
    operating_hours: profile.operatingHours || [],
    ...(profile.logoUrl !== undefined ? { logo_url: profile.logoUrl } : {}),
    ...(profile.bannerUrl !== undefined ? { banner_url: profile.bannerUrl } : {}),
  };
  if (profile.name) {
    patch.slug = await uniqueStoreSlug(prisma, profile.name, storeId);
  }
  const row = await prisma.stores.update({ where: { id: storeId }, data: patch });
  return mapStoreRow(row);
}

export async function fetchMyStoreProfile(userId, kind) {
  const row = await prisma.stores.findFirst({
    where: { owner_id: userId, kind },
  });
  return row ? mapStoreProfile(row) : null;
}
