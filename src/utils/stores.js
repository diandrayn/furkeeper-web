// Public store profile (/toko/:storeId|slug) + nearest-store search +
// dashboard profile persistence, backed by the `stores` table and the
// "store-images" Storage bucket.
//
// The public page only shows approved/active listings (RLS + explicit
// `approval_status` filters) and deliberately never renders contact fields —
// those exist so the owner's dashboard form can persist, and only the owner
// sees them. All buyer↔seller contact happens through the internal chat.
//
// Store lookup + search data comes from supabase/store_public_shop_migration.sql
// (slug column + trigger, district CHECK, search_stores() RPC, and
// get_store_public_stats() RPC for completable public aggreggregates).
import { supabase } from '../lib/supabaseClient';
import { slugify } from './chat';
import { mapPublicRow as mapPublicProductRow } from './products';
import { mapPublicRow as mapPublicServiceRow } from './services';
import { formatDateId } from './status';

/** Thrown by fetchPublicStore when the store's owner is suspended (or the
 * owner row is gone) — the UI shows "Toko tidak tersedia", not a 404. */
export class StoreUnavailableError extends Error {
  constructor() {
    super('Toko tidak tersedia');
    this.name = 'StoreUnavailableError';
  }
}

export function mapStoreRow(row) {
  return {
    id: row.id,
    kind: row.kind, // 'seller' | 'service'
    name: row.name,
    slug: row.slug || slugify(row.name || 'toko'),
    tagline: row.tagline || '',
    description: row.description || '',
    storePolicy: row.store_policy || '',
    category: row.category || '',
    location: row.location || '',
    address: row.address || '',
    district: row.district || '',
    city: row.city || '',
    homeService: Boolean(row.home_service),
    isOpen: row.is_open !== false,
    operatingHours: Array.isArray(row.operating_hours) ? row.operating_hours : [],
    logoUrl: row.logo_url || null,
    bannerUrl: row.banner_url || null,
    trusted: Boolean(row.trusted),
    fastResponse: Boolean(row.fast_response),
    rating: Number(row.rating || 0),
    ownerId: row.owner_id,
    productCount: row.products?.[0]?.count || 0,
    serviceCount: row.services?.[0]?.count || 0,
    createdAt: row.created_at,
  };
}

/** Profile shape used by DashboardProfilePage (mirrors seedStoreProfile). */
export function mapProfileRow(row) {
  return {
    name: row.name || '',
    slug: row.slug || slugify(row.name || 'toko'),
    category: row.category || '',
    tagline: row.tagline || '',
    description: row.description || '',
    logoUrl: row.logo_url || null,
    bannerUrl: row.banner_url || null,
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    district: row.district || '',
    city: row.city || '',
    storePolicy: row.store_policy || '',
    homeService: Boolean(row.home_service),
    isOpen: row.is_open !== false,
    operatingHours: Array.isArray(row.operating_hours) ? row.operating_hours : [],
    joinedAt: new Date(row.created_at).getTime(),
  };
}

/** Public store header info. Accepts a UUID or a slug; resolves either.
 * Throws StoreUnavailableError when the owner is suspended/removed so the
 * page can show "Toko tidak tersedia" instead of a plain 404. */
export async function fetchPublicStore(identifier) {
  const id = identifier || '';
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const filter = isUuid
    ? `id.eq.${id}`
    : `slug.eq.${id},id.eq.${id}`;

  const { data, error } = await supabase
    .from('stores')
    .select('*, products(count), services(count), owner:profiles!owner_id(is_suspended)')
    .or(filter)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Toko tidak ditemukan');
  if (!data.owner || data.owner.is_suspended) throw new StoreUnavailableError();
  return mapStoreRow(data);
}

/** Only approved + active products may show on the public store page.
 * @returns {{ rows: Array, total: number }} — paginated + filtered at the DB. */
export async function fetchStoreProducts(
  storeId,
  { search = '', category = '', sort = 'newest', offset = 0, limit = 12 } = {},
) {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact', head: false })
    .eq('store_id', storeId)
    .eq('is_active', true)
    .eq('approval_status', 'approved');
  if (search) query = query.ilike('name', `%${search}%`);
  if (category) query = query.eq('category', category);
  if (sort === 'price-asc') query = query.order('price', { ascending: true });
  else if (sort === 'price-desc') query = query.order('price', { ascending: false });
  else if (sort === 'popular') query = query.order('sold_count', { ascending: false });
  else query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data || []).map(mapPublicProductRow), total: count || 0 };
}

/** Only approved + active services may show on the public store page. */
export async function fetchStoreServices(
  storeId,
  { search = '', serviceType = '', sort = 'newest', offset = 0, limit = 12 } = {},
) {
  let query = supabase
    .from('services')
    .select('*', { count: 'exact', head: false })
    .eq('store_id', storeId)
    .eq('is_active', true)
    .eq('approval_status', 'approved');
  if (search) query = query.ilike('name', `%${search}%`);
  if (serviceType) query = query.eq('service_type', serviceType);
  if (sort === 'price-asc') query = query.order('price_from', { ascending: true });
  else if (sort === 'price-desc') query = query.order('price_from', { ascending: false });
  else if (sort === 'rating') query = query.order('rating', { ascending: false });
  else query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data || []).map(mapPublicServiceRow), total: count || 0 };
}

/** Distinct listing categories (products) for the store page's filter. */
export async function fetchStoreCategories(storeId) {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .eq('approval_status', 'approved');
  if (error) throw error;
  return [...new Set((data || []).map((r) => r.category).filter(Boolean))];
}

/** Distinct service types for the store page's filter. */
export async function fetchStoreServiceTypes(storeId) {
  const { data, error } = await supabase
    .from('services')
    .select('service_type')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .eq('approval_status', 'approved');
  if (error) throw error;
  return [...new Set((data || []).map((r) => r.service_type).filter(Boolean))];
}

/** Reviews across this store's products & services, newest first. */
export async function fetchStoreReviews(storeId) {
  const [productRes, serviceRes] = await Promise.all([
    supabase.from('products').select('id').eq('store_id', storeId),
    supabase.from('services').select('id').eq('store_id', storeId),
  ]);
  if (productRes.error) throw productRes.error;
  if (serviceRes.error) throw serviceRes.error;

  const productIds = (productRes.data || []).map((r) => r.id);
  const serviceIds = (serviceRes.data || []).map((r) => r.id);
  const conditions = [];
  if (productIds.length) conditions.push(`product_id.in.(${productIds.join(',')})`);
  if (serviceIds.length) conditions.push(`service_id.in.(${serviceIds.join(',')})`);
  if (!conditions.length) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(full_name, avatar_url), products(name), services(name)')
    .or(conditions.join(','))
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    reviewerName: row.profiles?.full_name || 'Pengguna',
    reviewerAvatar: row.profiles?.avatar_url || null,
    rating: row.rating,
    date: formatDateId(row.created_at),
    comment: row.comment || '',
    reply: row.reply || null,
    targetName: row.products?.name || row.services?.name || null,
  }));
}

/** Search stores entirely in the database (search_stores() RPC). Only
 * stores whose owner is NOT suspended appear, and only active/approved
 * listings count toward product_count/service_count.
 * @param {object} p — search, district, sort ('newest'|'rating'|'name'),
 *   onlyOpen, onlyVerified, hasProducts, hasServices, limit, offset.
 * @returns {{ rows: Array, total: number }} */
export async function fetchStoreList({
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
  const { data, error } = await supabase.rpc('search_stores', {
    p_search: search || null,
    p_district: district || null,
    p_sort: sort,
    p_only_open: onlyOpen,
    p_only_verified: onlyVerified,
    p_has_products: hasProducts,
    p_has_services: hasServices,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  const rows = (data?.rows || []).map(mapStoreRow);
  return { rows, total: Number(data?.total || 0) };
}

/** Public aggregate stats for a store (completed orders/bookings + review
 * count) — computed server-side so anonymous visitors see only numbers. */
export async function fetchStorePublicStats(storeId) {
  const { data, error } = await supabase.rpc('get_store_public_stats', {
    p_store_id: storeId,
  });
  if (error) throw error;
  return {
    completedOrders: Number(data?.completed_orders || 0),
    completedBookings: Number(data?.completed_bookings || 0),
    reviews: Number(data?.reviews || 0),
  };
}

/** Uploads to store-images/<user_id>/<random>.<ext> — the "<user_id>/"
 * prefix is what store_profile_migration.sql checks to only allow the
 * store owner to write there. */
export async function uploadStoreImage(file, userId) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('store-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('store-images').getPublicUrl(path);
  return data.publicUrl;
}

/** Writes the dashboard profile form onto the stores row. `profile` is the
 * form shape from DashboardProfilePage (camelCase). Image files should be
 * uploaded by the caller before this runs (logoFile/bannerFile are handled
 * in DashboardContext so the URL lands here as logoUrl/bannerUrl). */
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
  const { data, error } = await supabase
    .from('stores')
    .update(patch)
    .eq('id', storeId)
    .select('*')
    .single();
  if (error) throw error;
  return mapStoreRow(data);
}

/** Loads the owner's own store row for the dashboard profile form. */
export async function fetchMyStoreProfile(user, kind) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .eq('kind', kind)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfileRow(data) : null;
}