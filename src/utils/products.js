// Product CRUD + image upload for the seller ("Kelola Produk") dashboard,
// backed by the `stores` / `products` tables + `product-images` Storage
// bucket already defined in supabase/schema.sql and storage_policies.sql.
//
// NOTE — scope: this only wires up the SELLER dashboard (add/edit/delete
// your own products). The public-facing buyer pages (ProductListingPage,
// ProductDetailPage) still read from src/data/mockProducts.js — hooking
// those up to this same `products` table is a separate follow-up.
import { supabase } from '../lib/supabaseClient';

function mapRow(row) {
  return {
    id: row.id,
    sku: `PWK-${row.id.slice(0, 8).toUpperCase()}`,
    name: row.name,
    category: row.category,
    petType: row.pet_type,
    description: row.description || '',
    price: row.price,
    originalPrice: row.original_price,
    stock: row.stock,
    status: row.stock === 0 ? 'habis' : row.is_active ? 'aktif' : 'nonaktif',
    imageUrl: row.image_url,
    rating: row.rating || 0,
    sold: row.sold_count || 0,
    approvalStatus: row.approval_status || 'approved',
    rejectionReason: row.rejection_reason || null,
    createdAt: row.created_at,
  };
}

/** Finds this seller's store, creating one on first use (e.g. right after
 * their application gets approved and they open "Kelola Produk" for the
 * first time — there's no separate "create your store" step in the UI). */
export async function ensureMyStore(user) {
  const { data: existing, error: findErr } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .eq('kind', 'seller')
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing.id;

  const { data: created, error: createErr } = await supabase
    .from('stores')
    .insert({
      owner_id: user.id,
      kind: 'seller',
      name: user.business?.businessName || user.fullName || 'Toko Saya',
      location: user.business?.businessAddress || null,
    })
    .select('id')
    .single();
  if (createErr) throw createErr;
  return created.id;
}

export async function fetchMyProducts(storeId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapRow);
}

/** Uploads to product-images/<user_id>/<random>.<ext> — the "<user_id>/"
 * prefix is what storage_policies.sql checks to only allow the file's
 * owner to write there. */
export async function uploadProductImage(file, userId) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function insertProduct(storeId, payload) {
  const { data, error } = await supabase
    .from('products')
    .insert({
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
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateProductRow(id, payload) {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: payload.name,
      category: payload.category,
      pet_type: payload.petType,
      description: payload.description || null,
      price: payload.price,
      original_price: payload.originalPrice || null,
      stock: payload.stock,
      is_active: payload.status !== 'nonaktif',
      ...(payload.imageUrl !== undefined ? { image_url: payload.imageUrl } : {}),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteProductRow(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Public catalog (buyer-facing /produk, /produk/:id) — maps onto the same
// field names src/data/mockProducts.js uses, so it can drop straight into
// ProductCard / ProductListingPage / ProductDetailPage alongside the demo
// catalog (see hooks/usePublicProducts.js).
// ---------------------------------------------------------------------
export function mapPublicRow(row) {
  const store = row.stores || {};
  const originalPrice = row.original_price;
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    storeName: store.name || 'Toko',
    storeLocation: store.location || store.district || '',
    storeRating: store.rating || 0,
    storeTrusted: Boolean(store.trusted),
    price: row.price,
    originalPrice,
    discountPercent:
      row.discount_percent ??
      (originalPrice ? Math.round(((originalPrice - row.price) / originalPrice) * 100) : null),
    rating: row.rating || 0,
    soldCount: row.sold_count || 0,
    reviewCount: 0,
    badge: row.badge,
    category: row.category,
    petType: row.pet_type,
    location: store.location || store.district || '',
    variants: row.variants || [],
    stock: row.stock,
    imageUrl: row.image_url,
    createdAt: new Date(row.created_at).getTime(),
    description: row.description || '',
  };
}

/** Only active products from approved sellers are ever visible here —
 * relies on the "products are publicly readable" RLS policy, no auth
 * required, so this is safe to call from a logged-out buyer too. */
export async function fetchPublicProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, stores(name, location, district, trusted, rating)')
    .eq('is_active', true)
    // RLS sengaja membiarkan pemilik & admin melihat listing yang belum disetujui;
    // katalog publik harus tetap hanya menampilkan yang sudah 'approved'.
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapPublicRow);
}
