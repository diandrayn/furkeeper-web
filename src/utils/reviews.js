// ============================================================================
// utils/reviews.js — tulis & balas ulasan ke tabel `reviews` (database asli).
// T1: ulasan pembeli tersimpan dan langsung tampil di produk/jasa publik,
// dashboard penjual, dan panel admin — sinkron ke semua role.
// ============================================================================
import { supabase } from '../lib/supabaseClient';

export async function createReview({
  authorId,
  productId = null,
  serviceId = null,
  orderId = null,
  bookingId = null,
  rating,
  comment,
}) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      author_id: authorId,
      product_id: productId || null,
      service_id: serviceId || null,
      order_id: orderId || null,
      booking_id: bookingId || null,
      rating,
      comment: comment || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Cek apakah pembeli sudah memberi ulasan untuk pesanan/booking tertentu. */
export async function hasReviewed({ orderId, bookingId }) {
  let query = supabase.from('reviews').select('id', { count: 'exact', head: true });
  if (orderId) query = query.eq('order_id', orderId);
  if (bookingId) query = query.eq('booking_id', bookingId);
  const { count, error } = await query;
  if (error) throw error;
  return (count || 0) > 0;
}

/** Pembeli balas... toko membalas ulasan (isi kolom reply). */
export async function replyToReview(reviewId, reply) {
  const { error } = await supabase.from('reviews').update({ reply }).eq('id', reviewId);
  if (error) throw error;
}

export async function deleteReview(reviewId) {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw error;
}