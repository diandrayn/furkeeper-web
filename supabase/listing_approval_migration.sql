-- =========================================================================
-- FurKeeper — Approval Produk & Jasa (§2.5)
-- =========================================================================
-- Run this AFTER supabase/admin_panel.sql (needs is_admin(), stores.owner_id).
--
-- Alur yang ditambahkan:
--   * Listing baru dari penjual/penyedia jasa  -> status 'pending' (Menunggu)
--   * Admin approve                            -> 'approved' (Disetujui)
--   * Admin reject (alasan WAJIB)              -> 'rejected' (Ditolak)
--   * Listing 'approved' / 'rejected' yang KONTEN-nya diedit oleh pemiliknya
--     -> otomatis kembali ke 'pending'
--
-- Kenapa di trigger, bukan di kode klien: penjual tidak bisa "lupa" atau
-- melewati aturan ini dari sisi aplikasi — status hanya bisa diubah admin,
-- dan edit konten oleh pemilik selalu mengembalikan ke antrean.
--
-- Listing yang SUDAH ada saat migrasi dijalankan di-backfill ke 'approved'
-- supaya katalog yang sedang tayang tidak mendadak hilang.
--
-- Kolom yang dianggap "konten" (memicu approval ulang saat diubah) ada di
-- fungsi enforce_listing_approval() — daftar `content_cols`. Sengaja BUKAN
-- stock / is_active / rating / counter, karena itu berubah lewat checkout,
-- ulasan, atau toggle aktif tanpa perlu ditinjau ulang. Tambahkan kolom
-- konten lain milik skema Anda (mis. `description`) di daftar itu bila perlu;
-- nama kolom yang tidak ada di tabel diabaikan.
--
-- Safe to run once (add column akan error di run kedua).
-- =========================================================================

-- 1. Kolom status ------------------------------------------------------------
-- Trik: tambah dengan default 'approved' (backfill baris lama), lalu ganti
-- default ke 'pending' untuk baris baru.
alter table public.products
  add column approval_status text not null default 'approved',
  add column rejection_reason text,
  add column reviewed_by uuid references public.profiles (id),
  add column reviewed_at timestamptz;

alter table public.services
  add column approval_status text not null default 'approved',
  add column rejection_reason text,
  add column reviewed_by uuid references public.profiles (id),
  add column reviewed_at timestamptz;

alter table public.products alter column approval_status set default 'pending';
alter table public.services alter column approval_status set default 'pending';

alter table public.products
  add constraint products_approval_status_check
    check (approval_status in ('pending', 'approved', 'rejected')),
  add constraint products_rejection_reason_check
    check (approval_status <> 'rejected' or nullif(btrim(rejection_reason), '') is not null);

alter table public.services
  add constraint services_approval_status_check
    check (approval_status in ('pending', 'approved', 'rejected')),
  add constraint services_rejection_reason_check
    check (approval_status <> 'rejected' or nullif(btrim(rejection_reason), '') is not null);

create index products_approval_status_idx on public.products (approval_status);
create index services_approval_status_idx on public.services (approval_status);

-- 2. Helper: apakah user saat ini pemilik toko ini ---------------------------
-- security definer supaya policy di bawah tidak bergantung pada RLS `stores`.
create or replace function public.owns_store(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores s
    where s.id = p_store_id and s.owner_id = auth.uid()
  );
$$;

-- 3. Trigger penegak aturan --------------------------------------------------
create or replace function public.enforce_listing_approval()
returns trigger
language plpgsql
as $$
declare
  content_cols text[] := array[
    'name', 'description', 'category', 'pet_type', 'price', 'image_url', 'images',
    'service_type', 'price_from'
  ];
  old_json jsonb;
  new_json jsonb;
  content_changed boolean;
begin
  -- Konteks tepercaya (SQL editor / service role): tidak ada auth.uid(),
  -- tidak dibatasi.
  if auth.uid() is null then
    return new;
  end if;

  -- Admin: bebas mengubah status. Catat siapa & kapan; bersihkan alasan
  -- kalau bukan penolakan.
  if public.is_admin() then
    if tg_op = 'UPDATE' and new.approval_status is distinct from old.approval_status then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    if new.approval_status <> 'rejected' then
      new.rejection_reason := null;
    end if;
    return new;
  end if;

  -- Selain admin (penjual / penyedia jasa) -----------------------------------
  if tg_op = 'INSERT' then
    new.approval_status := 'pending';
    new.rejection_reason := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    return new;
  end if;

  -- UPDATE oleh non-admin: field approval tidak boleh disentuh langsung.
  new.approval_status := old.approval_status;
  new.rejection_reason := old.rejection_reason;
  new.reviewed_by := old.reviewed_by;
  new.reviewed_at := old.reviewed_at;

  if old.approval_status in ('approved', 'rejected') then
    old_json := to_jsonb(old);
    new_json := to_jsonb(new);
    select exists (
      select 1 from unnest(content_cols) c
      where old_json -> c is distinct from new_json -> c
    ) into content_changed;

    if content_changed then
      new.approval_status := 'pending';
      new.rejection_reason := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger products_enforce_approval
  before insert or update on public.products
  for each row execute function public.enforce_listing_approval();

create trigger services_enforce_approval
  before insert or update on public.services
  for each row execute function public.enforce_listing_approval();

-- 4. Visibilitas: hanya listing 'approved' yang tayang untuk publik ---------
-- Policy RESTRICTIVE di-AND-kan dengan policy select yang sudah ada, jadi
-- tidak perlu tahu/mengubah nama policy lama. Pemilik tetap melihat listing
-- miliknya sendiri (termasuk yang Menunggu/Ditolak), admin melihat semuanya.
create policy "only approved listings are publicly visible" on public.products
  as restrictive for select
  using (approval_status = 'approved' or public.is_admin() or public.owns_store(store_id));

create policy "only approved listings are publicly visible" on public.services
  as restrictive for select
  using (approval_status = 'approved' or public.is_admin() or public.owns_store(store_id));
