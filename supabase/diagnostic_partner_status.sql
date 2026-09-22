-- =========================================================================
-- FurKeeper — Diagnostik status mitra akun lama
-- =========================================================================
-- Terkait perbaikan alur login/redirect mitra (lihat AuthContext.jsx,
-- LoginPage.jsx, ApplicationStatusPage.jsx). Setelah admin_panel.sql
-- dijalankan, akun mitra BARU sudah benar (handle_new_user() menyalin
-- sellerStatus/providerStatus dari metadata signup ke profiles). File ini
-- HANYA untuk memeriksa akun LAMA yang mungkin masih tidak konsisten,
-- misalnya role = 'seller' tapi seller_status masih 'none' padahal akun
-- itu sudah lama berjualan (sudah punya baris di stores).
--
-- Run kapan saja, di Supabase SQL Editor. Read-only — SELECT saja, aman
-- dijalankan berulang kali dan tidak mengubah data apa pun.
--
-- Bagian backfill di paling bawah HANYA contoh/opsi dan sengaja
-- dikomentari (diawali --). Jangan jalankan begitu saja — baca hasil
-- SELECT diagnostik dulu, pastikan datanya benar-benar akun mitra lama
-- yang seharusnya berstatus 'approved', baru un-comment dan jalankan
-- manual per kasus (atau semuanya sekaligus kalau sudah yakin).
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. Ringkasan semua akun dengan role mitra (seller/service): status di
--    profiles, apakah punya toko, dan jumlah produk/layanannya.
--    Baris dengan seller_status/provider_status = 'none' padahal role-nya
--    seller/service dan sudah punya toko (has_store = true) adalah kandidat
--    akun lama yang tidak konsisten (POIN 1, "kasus tidak konsisten").
-- ---------------------------------------------------------------------
select
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.seller_status,
  p.provider_status,
  p.partner_submitted_at,
  s.id is not null as has_store,
  s.kind as store_kind,
  s.created_at as store_created_at,
  coalesce(prod.product_count, 0) as product_count,
  coalesce(serv.service_count, 0) as service_count
from public.profiles p
left join lateral (
  select id, kind, created_at
  from public.stores
  where owner_id = p.id
  order by created_at asc
  limit 1
) s on true
left join lateral (
  select count(*) as product_count
  from public.products pr
  join public.stores st on st.id = pr.store_id
  where st.owner_id = p.id
) prod on true
left join lateral (
  select count(*) as service_count
  from public.services sv
  join public.stores st on st.id = sv.store_id
  where st.owner_id = p.id
) serv on true
where p.role in ('seller', 'service')
order by
  -- Kandidat tidak konsisten paling atas: role mitra, status 'none',
  -- tapi sudah punya toko (jadi jelas bukan pendaftaran yang belum selesai).
  case when p.role = 'seller' and p.seller_status = 'none' and s.id is not null then 0
       when p.role = 'service' and p.provider_status = 'none' and s.id is not null then 0
       else 1
  end,
  p.created_at desc nulls last;

-- ---------------------------------------------------------------------
-- 2. Ringkasan cepat: berapa banyak akun per kombinasi role + status.
--    Berguna untuk melihat skala masalah sebelum memutuskan backfill.
-- ---------------------------------------------------------------------
select role, seller_status, provider_status, count(*) as jumlah_akun
from public.profiles
where role in ('seller', 'service')
group by role, seller_status, provider_status
order by role, seller_status, provider_status;

-- =========================================================================
-- 3. OPSI backfill (DIKOMENTARI — jangan jalankan otomatis).
--    Hanya untuk akun yang dari hasil query di atas benar-benar terlihat
--    sebagai mitra lama yang sudah aktif berjualan/menyediakan jasa
--    (has_store = true) tapi status di profiles masih 'none'. Ini
--    menyetel status ke 'approved' seolah-olah sudah pernah disetujui
--    admin — pastikan itu memang yang Anda maksud sebelum menjalankan.
--
--    Uncomment dan jalankan baris yang relevan saja (seller/service),
--    atau sesuaikan `where` untuk akun tertentu saja (mis. tambahkan
--    `and p.id = '...'`) kalau ingin backfill satu per satu.
-- =========================================================================

-- update public.profiles p
-- set seller_status = 'approved'
-- from public.stores s
-- where s.owner_id = p.id
--   and s.kind = 'seller'
--   and p.role = 'seller'
--   and p.seller_status = 'none';

-- update public.profiles p
-- set provider_status = 'approved'
-- from public.stores s
-- where s.owner_id = p.id
--   and s.kind = 'service'
--   and p.role = 'service'
--   and p.provider_status = 'none';
