-- =========================================================================
-- FurKeeper — Profil Toko Publik (§5) & persistence profil dashboard
-- =========================================================================
-- Run this AFTER supabase/schema.sql (atau admin_panel.sql + lainnya) dan
-- SETELAH membuat Storage bucket "store-images" (Storage → New bucket,
-- Public bucket = ON).
--
-- Yang ditambahkan:
--   * Kolom profil di `stores` (description, tagline, category, city,
--     home_service, is_open, operating_hours, logo_url, banner_url, dan
--     kontak) supaya formulir "Profil Toko / Profil Bisnis" di dashboard
--     tersimpan ke database — bukan cuma localStorage — dan halaman
--     /toko/:storeId bisa menampilkan deskripsi, logo, dan banner publik.
--   * Kolom kontak (phone/email/address) ikut disimpan supaya
--     seluruh isi formulir terekam. Kontak pelanggan dilakukan lewat
--     fitur "Chat Toko" (conversations/messages) — kolom WhatsApp tidak
--     dipakai lagi (lihat store_public_shop_migration.sql).
--   * Policy read publik untuk `stores` (dipastikan ulang + idempotent).
--   * Policy Storage untuk bucket "store-images" (logo & banner), dengan
--     pola path "<user_id>/..." yang sama seperti product-images.
--
-- Safe to re-run (add column if not exists / drop policy if exists).
-- =========================================================================

-- 1. Kolom profil tambahan --------------------------------------------------
alter table public.stores
  add column if not exists description text,
  add column if not exists tagline text,
  add column if not exists category text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists home_service boolean not null default false,
  add column if not exists is_open boolean not null default true,
  add column if not exists operating_hours jsonb not null default '[]'::jsonb,
  add column if not exists logo_url text,
  add column if not exists banner_url text;

-- 2. Public-read RLS --------------------------------------------------------
-- Policy asli ada di schema.sql; drop+create di sini supaya database lama
-- yang kebetulan belum punya policy-nya tetap aman saat migrasi dijalankan.
drop policy if exists "stores are publicly readable" on public.stores;
create policy "stores are publicly readable" on public.stores
  for select using (true);

-- 3. Storage "store-images" (logo & banner) ---------------------------------
-- Files di-upload ke "<user_id>/<random>.jpg" — policy di bawah hanya
-- membolehkan pemilik menulis di folder "<user_id>/..." miliknya sendiri.
-- Read sudah terbuka untuk semua karena bucket dibuat Public.
drop policy if exists "owners upload own store logo/banner" on storage.objects;
create policy "owners upload own store logo/banner"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'store-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "owners update own store logo/banner" on storage.objects;
create policy "owners update own store logo/banner"
on storage.objects for update to authenticated
using (
  bucket_id = 'store-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "owners delete own store logo/banner" on storage.objects;
create policy "owners delete own store logo/banner"
on storage.objects for delete to authenticated
using (
  bucket_id = 'store-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);