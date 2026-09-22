// Service CRUD + image upload for the provider ("Kelola Jasa") dashboard,
// backed by the `stores` / `services` tables + `service-images` Storage
// bucket. Mirrors utils/products.js — see that file's header for the
// overall shape of this pattern.
import { supabase } from '../lib/supabaseClient';

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    serviceType: row.service_type,
    description: row.description || '',
    price: row.price_from,
    duration: row.duration || '',
    status: row.is_active ? 'aktif' : 'nonaktif',
    imageUrl: row.image_url,
    rating: row.rating || 0,
    booked: row.booked_count || 0,
    approvalStatus: row.approval_status || 'approved',
    rejectionReason: row.rejection_reason || null,
    createdAt: row.created_at,
  };
}

/** Finds this provider's store, creating one on first use — mirrors
 * ensureMyStore in utils/products.js but for kind = 'service'. */
export async function ensureMyServiceStore(user) {
  const { data: existing, error: findErr } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .eq('kind', 'service')
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing.id;

  const { data: created, error: createErr } = await supabase
    .from('stores')
    .insert({
      owner_id: user.id,
      kind: 'service',
      name: user.business?.businessName || user.fullName || 'Usaha Saya',
      location: user.business?.businessAddress || null,
    })
    .select('id')
    .single();
  if (createErr) throw createErr;
  return created.id;
}

export async function fetchMyServices(storeId) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapRow);
}

/** Uploads to service-images/<user_id>/<random>.<ext> — the "<user_id>/"
 * prefix is what storage_policies_services.sql checks. */
export async function uploadServiceImage(file, userId) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('service-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('service-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function insertService(storeId, payload) {
  const { data, error } = await supabase
    .from('services')
    .insert({
      store_id: storeId,
      name: payload.name,
      service_type: payload.serviceType,
      description: payload.description || null,
      price_from: payload.price,
      duration: payload.duration || null,
      is_active: payload.status !== 'nonaktif',
      image_url: payload.imageUrl || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateServiceRow(id, payload) {
  const { data, error } = await supabase
    .from('services')
    .update({
      name: payload.name,
      service_type: payload.serviceType,
      description: payload.description || null,
      price_from: payload.price,
      duration: payload.duration || null,
      is_active: payload.status !== 'nonaktif',
      ...(payload.imageUrl !== undefined ? { image_url: payload.imageUrl } : {}),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteServiceRow(id) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Public catalog (buyer-facing /jasa, /jasa/:id) — maps onto the same
// field names src/data/mockServices.js uses (see hooks/usePublicServices.js).
// ---------------------------------------------------------------------
export function mapPublicRow(row) {
  const store = row.stores || {};
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    providerName: store.name || 'Penyedia Jasa',
    serviceType: row.service_type,
    priceFrom: row.price_from,
    duration: row.duration || '',
    rating: row.rating || 0,
    reviewCount: row.review_count || 0,
    distanceOrLocation: store.location || store.district || '',
    location: store.location || store.district || '',
    badge: null,
    trusted: Boolean(store.trusted),
    fastResponse: Boolean(store.fast_response),
    imageUrl: row.image_url,
    imageCount: 0,
    // Real services added via the dashboard don't have separate "paket"
    // line items (that's a bigger feature on its own) — BookingPage and
    // ServiceDetailPage both need at least one package to let someone
    // actually book, so synthesize one from the service's own price/duration.
    packages: [
      {
        id: `default-${row.id}`,
        name: row.name,
        description: row.description || '',
        durationEstimate: row.duration || '-',
        price: row.price_from,
      },
    ],
    createdAt: new Date(row.created_at).getTime(),
    description: row.description || '',
  };
}

/** Only active services from approved providers are visible here — relies
 * on the "services are publicly readable" RLS policy, no auth required. */
export async function fetchPublicServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*, stores(name, location, district, trusted, fast_response, rating)')
    .eq('is_active', true)
    // Lihat catatan di utils/products.js: hanya yang sudah disetujui yang tayang publik.
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapPublicRow);
}
