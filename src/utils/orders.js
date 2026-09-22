// ============================================================================
// utils/orders.js — lapisan data pesanan produk (tabel `orders` di Supabase).
// T1: single source of truth. Pembuatan lewat RPC `submit_order` (atomik:
// insert order + items, kurangi stok, snapshot alamat, notifikasi penjual).
// Semua perubahan status lewat RPC `set_order_status` (validasi + riwayat).
// ============================================================================
import { supabase } from '../lib/supabaseClient';

/** Buat pesanan baru. Mengebalikan id order dari database. */
export async function submitOrder({ addressId, paymentMethod, subtotal, shippingCost, total, items }) {
  const { data, error } = await supabase.rpc('submit_order', {
    p_address_id: addressId || null,
    p_payment_method: paymentMethod || null,
    p_subtotal: Number(subtotal) || 0,
    p_shipping_cost: Number(shippingCost) || 0,
    p_total: Number(total) || 0,
    p_items: items,
  });
  if (error) throw error;
  return data;
}

/** Ubah status pesanan (buyer atau seller) via RPC tervalidasi. */
export async function setOrderStatus(orderId, status, actor) {
  const { error } = await supabase.rpc('set_order_status', {
    p_order_id: orderId,
    p_status: status,
    p_actor: actor,
  });
  if (error) throw error;
}

export function mapOrderRow(row) {
  const items = row.order_items || [];
  const first = items[0] || {};
  return {
    id: row.id,
    type: 'product',
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    totalPrice: row.total,
    subtotal: row.subtotal,
    shippingCost: row.shipping_cost,
    paymentMethod: row.payment_method || '',
    name: first.name || 'Pesanan produk',
    thumbnail: null,
    variant: first.variant || '',
    qty: items.reduce((sum, i) => sum + i.quantity, 0),
    price: first.price || 0,
    storeName: first.stores?.name || null,
    storeId: first.store_id || null,
    address: row.shipping_address || null,
    tracking: row.tracking_number || null,
    items,
  };
}

/** Semua pesanan milik pembeli (untuk riwayat pembeli). */
export async function fetchMyOrders(buyerId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, stores(name))')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapOrderRow);
}

/** Satu pesanan milik pembeli + item + snapshot alamat. */
export async function fetchOrderById(buyerId, orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, stores(name))')
    .eq('id', orderId)
    .eq('buyer_id', buyerId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrderRow(data) : null;
}

/** Ambil beberapa pesanan sekaligus (untuk ringkasan pembayaran). */
export async function fetchOrdersByIds(buyerId, ids) {
  if (!ids || !ids.length) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, stores(name))')
    .eq('buyer_id', buyerId)
    .in('id', ids)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapOrderRow);
}

/** Riwayat perubahan status sebuah pesanan (timeline). */
export async function fetchOrderHistory(orderId) {
  const { data, error } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedBy: row.changed_by,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

// ---------------------------------------------------------------------------
// Sisi penjual (dashboard toko)
// ---------------------------------------------------------------------------

/** Pesanan yang berisi produk dari toko ini (RLS: store owner reads orders). */
export async function fetchStoreOrders(storeId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items!inner(*), buyer:profiles(full_name, phone)')
    .eq('order_items.store_id', storeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => {
    const items = row.order_items || [];
    const first = items[0] || {};
    return {
      id: row.id,
      status: row.status,
      createdAt: new Date(row.created_at).getTime(),
      productName: first.name || '-',
      qty: items.reduce((sum, i) => sum + i.quantity, 0),
      variant: first.variant || '',
      price: first.price || 0,
      totalPrice: row.total,
      paymentMethod: row.payment_method || '-',
      buyerName: row.buyer?.full_name || 'Pembeli',
      buyerPhone: row.buyer?.phone || '-',
      address: row.shipping_address || null,
      note: null,
      items,
    };
  });
}