// ============================================================================
// utils/bookings.js — lapisan data booking jasa (tabel `bookings`).
// T1: single source of truth. Pembuatan via RPC `submit_booking`.
// Perubahan status via RPC `set_booking_status` (validasi aktor + riwayat).
// ============================================================================
import { supabase } from '../lib/supabaseClient';

/** Buat booking baru. Mengebalikan id booking dari database. */
export async function submitBooking({
  serviceId,
  packageId,
  petId,
  date,
  time,
  price,
  notes,
}) {
  const dateValue = date instanceof Date ? date.toISOString().slice(0, 10) : String(date || '').slice(0, 10);
  const { data, error } = await supabase.rpc('submit_booking', {
    p_service_id: serviceId || null,
    p_service_package_id: packageId || null,
    p_pet_id: petId || null,
    p_scheduled_date: dateValue,
    p_scheduled_time: String(time || ''),
    p_price: Number(price) || 0,
    p_notes: notes || null,
  });
  if (error) throw error;
  return data;
}

/** Ubah status booking (buyer atau provider) via RPC tervalidasi. */
export async function setBookingStatus(bookingId, status, actor) {
  const { error } = await supabase.rpc('set_booking_status', {
    p_booking_id: bookingId,
    p_status: status,
    p_actor: actor,
  });
  if (error) throw error;
}

export function mapBookingRow(row) {
  const service = row.services || {};
  const store = service.stores || {};
  return {
    id: row.id,
    type: 'service',
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    totalPrice: row.price,
    price: row.price,
    name: service.name || 'Booking jasa',
    thumbnail: null,
    date: row.scheduled_date,
    time: row.scheduled_time,
    packageName: row.service_packages?.name || service.name || null,
    packagePrice: row.price,
    petId: row.pet_id,
    petName: row.pet_name || (row.pets ? row.pets.name : '') || '',
    providerName: store.name || 'Penyedia Jasa',
    providerRating: null,
    storeId: service.store_id || null,
    serviceId: row.service_id,
    reviewed: false,
    reviewedCheck: true,
  };
}

/** Semua booking milik pembeli (untuk riwayat pembeli). */
export async function fetchMyBookings(buyerId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, services(name, store_id, stores(name)), service_packages(name), pets(name)')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapBookingRow);
}

/** Satu booking milik pembeli. */
export async function fetchBookingById(buyerId, bookingId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, services(name, store_id, stores(name)), service_packages(name), pets(name, species)')
    .eq('id', bookingId)
    .eq('buyer_id', buyerId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBookingRow(data) : null;
}

/** Riwayat perubahan status sebuah booking (timeline). */
export async function fetchBookingHistory(bookingId) {
  const { data, error } = await supabase
    .from('booking_status_history')
    .select('*')
    .eq('booking_id', bookingId)
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
// Sisi penyedia jasa (dashboard jasa)
// ---------------------------------------------------------------------------

/** Booking untuk jasa dari toko ini (RLS: store reads its bookings). */
export async function fetchProviderBookings(storeId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, buyer:profiles(full_name, phone), service:services!inner(name, store_id)')
    .eq('service.store_id', storeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    serviceName: row.service?.name || '-',
    date: row.scheduled_date,
    time: row.scheduled_time,
    price: row.price,
    note: row.notes || null,
    buyerName: row.buyer_name || row.buyer?.full_name || 'Pembeli',
    buyerPhone: row.buyer_phone || row.buyer?.phone || '-',
    petName: row.pet_name || '',
    petType: row.pet_species || '',
    addressType: 'Alamat',
    address: null,
  }));
}