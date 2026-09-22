-- =========================================================================
-- FurKeeper — Backfill status mitra akun lama yang tidak konsisten
-- =========================================================================
-- Jalankan di Supabase SQL Editor (Project → SQL Editor → New query).
-- Aman dijalankan berulang kali (idempotent): hanya mengubah akun yang
-- role-nya seller/service, statusnya masih 'none', DAN terbukti punya toko
-- dengan jenis yang cocok dengan role-nya.
--
-- Kenapa perlu: akun mitra yang didaftarkan SEBELUM admin_panel.sql
-- diterapkan (trigger handle_new_user lama hanya menyalin full_name + role)
-- punya role seller/service tetapi seller_status / provider_status masih
-- 'none' — padahal akunnya sudah punya toko dan dulu pernah disetujui.
-- Akibatnya LoginPage membaca status dari profiles ('none'), menyangkanya
-- "belum ada pengajuan", dan akun tidak bisa login sebagai mitra sama
-- sekali (tidak sampai ke dashboard maupun /status-pengajuan).
--
-- Yang dilakukan di sini:
--   1. seller_status   → 'approved' untuk role='seller' ber-toko kind='seller'
--   2. provider_status → 'approved' untuk role='service' ber-toko kind='service'
--   3. partner_submitted_at diisi dari tanggal toko dibuat bila masih kosong.
--
-- Akun mitra tanpa toko TIDAK disentuh — biar ditinjau manual lewat
-- halaman admin /admin/mitra dengan filter "Belum tercatat".
-- =========================================================================

-- 1) Backfill (hanya akun yang jelas-jelas pernah jadi mitra: sudah punya toko).
update public.profiles p
set seller_status = case
      when exists (
        select 1 from public.stores s
        where s.owner_id = p.id and s.kind = 'seller'
      )
      then 'approved'
      else p.seller_status
    end,
    provider_status = case
      when exists (
        select 1 from public.stores s
        where s.owner_id = p.id and s.kind = 'service'
      )
      then 'approved'
      else p.provider_status
    end,
    partner_submitted_at = coalesce(
      p.partner_submitted_at,
      (select min(s.created_at) from public.stores s where s.owner_id = p.id)
    ),
    updated_at = now()
where p.role in ('seller', 'service')
  and (
    (p.role = 'seller'
      and p.seller_status = 'none'
      and exists (select 1 from public.stores s where s.owner_id = p.id and s.kind = 'seller'))
    or
    (p.role = 'service'
      and p.provider_status = 'none'
      and exists (select 1 from public.stores s where s.owner_id = p.id and s.kind = 'service'))
  );

-- 2) Laporan: akun yang dipulihkan oleh query di atas.
select p.id, p.email, p.role,
       p.seller_status   as seller_status_sekarang,
       p.provider_status as provider_status_sekarang,
       p.partner_submitted_at
from public.profiles p
join public.stores s on s.owner_id = p.id
where (p.role = 'seller' and s.kind = 'seller' and p.seller_status = 'approved')
   or (p.role = 'service' and s.kind = 'service' and p.provider_status = 'approved')
order by p.email;

-- 3) Cek terakhir: akun mitra yang MASIH 'none' (perlu tinjauan manual dari
--    /admin/mitra → filter "Belum tercatat", biasanya karena belum punya toko
--    — mis. pendaftaran yang pernah batal tengah jalan).
select p.email, p.role, p.seller_status, p.provider_status, p.partner_submitted_at
from public.profiles p
where p.role in ('seller', 'service')
  and p.seller_status = 'none'
  and p.provider_status = 'none'
order by p.email;