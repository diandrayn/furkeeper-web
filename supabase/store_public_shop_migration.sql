-- =========================================================================
-- FurKeeper — Halaman Toko Publik, Pencarian Kecamatan & Chat-first (§11-14)
-- =========================================================================
-- Run this AFTER supabase/admin_panel.sql (pakai public.is_admin()) dan
-- supabase/listing_approval_migration.sql (kolom approval_status) dan
-- supabase/help_messages_migration.sql (tabel reports) jika sudah ada.
--
-- Yang ditambahkan/diubah:
--   1. `stores.slug`  — URL rapi & bisa dibagikan /toko/{slug}.
--      - Backfill semua baris lama otomatis dari `name`.
--      - Trigger before insert/update mengisi slug kalau kosong & menjaga
--        keunikan (tanpa slug, name-nya belum diisi / kolom kosong).
--   2. Kecamatan terstandar — constraint CHECK pada `stores.district`
--      (Klojen, Blimbing, Kedungkandang, Lowokwaru, Sukun) + normalisasi
--      backfill ("Kec. klojen" → "Klojen"; nilai di luar daftar → NULL
--      supaya dashboard memberi penanda melengkapi data).
--   3. `stores.store_policy`  — kolom "Kebijakan Toko" (tab Tentang Toko).
--   4. HAPUS kolom `stores.whatsapp`  — semua kontak lewat Chat Toko
--      (audit: hanya form dashboard & utils yang memakai; tidak ada
--      notifikasi/verifikasi/email yang bergantung).
--   5. Policy RLS admin read-only untuk `conversations` / `messages`
--      (admin melihat percakapan saat sengketa/laporan; tetap read-only).
--   6. Fungsi pencarian toko `search_stores()` — filter/search/urut/paginate
--      SEPENUHNYA di database, sekaligus menghitung jumlah hasil; hanya
--      menampilkan toko milik owner yg TIDAK disuspend.
--   7. Fungsi statistik publik `get_store_public_stats()` — jumlah pesanan
--      selesai (orders completed via order_items + bookings completed via
--      services) dan jumlah ulasan, aman dibuka anonim tanpa membocorkan
--      data order/booking (aggregat JSON, security definer, read-only).
--
-- Safe to re-run (if not exists / drop if exists).
-- =========================================================================

-- 1. Slug ----------------------------------------------------------------
alter table public.stores add column if not exists slug text;

create or replace function public.assign_store_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  counter int := 0;
  self_id uuid;
begin
  if new.slug is null or new.slug = '' then
    base_slug := lower(regexp_replace(new.name, '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then
      base_slug := 'toko';
    end if;
    self_id := coalesce(new.id, '00000000-0000-0000-0000-000000000000');
    candidate := base_slug;
    while exists (select 1 from public.stores where slug = candidate and id <> self_id) loop
      counter := counter + 1;
      candidate := base_slug || '-' || counter;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_store_slug on public.stores;
create trigger trg_assign_store_slug
  before insert or update on public.stores
  for each row execute procedure public.assign_store_slug();

-- Backfill baris lama (trigger mengisi slug dari name).
update public.stores set name = name where slug is null or slug = '';

create unique index if not exists stores_slug_key on public.stores (slug);

create index if not exists stores_district_idx on public.stores (district);

-- 2. Kecamatan terstandar ------------------------------------------------
update public.stores set district = nullif(trim(district), '') where district is not null;
update public.stores set district = regexp_replace(district, '^Kec\.?\s+', '', 'i') where district is not null;
update public.stores set district = initcap(district) where district is not null;
-- Nilai di luar daftar resmi → NULL (dashboard menandai "lengkapi data").
update public.stores
  set district = null
  where district is not null
    and district not in ('Klojen', 'Blimbing', 'Kedungkandang', 'Lowokwaru', 'Sukun');

alter table public.stores drop constraint if exists stores_district_check;
alter table public.stores
  add constraint stores_district_check
  check (district is null or district in ('Klojen', 'Blimbing', 'Kedungkandang', 'Lowokwaru', 'Sukun'));

-- 3. Kebijakan toko ------------------------------------------------------
alter table public.stores add column if not exists store_policy text;

-- 4. Hapus WhatsApp (semua kontak → Chat Toko) ---------------------------
alter table public.stores drop column if exists whatsapp;

-- 5. Admin bisa membaca percakapan (read-only) ---------------------------
drop policy if exists "admin reads conversations" on public.conversations;
create policy "admin reads conversations" on public.conversations
  for select using (public.is_admin());

drop policy if exists "admin reads messages" on public.messages;
create policy "admin reads messages" on public.messages
  for select using (public.is_admin());

-- 6. Pencarian toko (semua di DB) ---------------------------------------
-- Mengembalikan jsonb { rows: [...], total: n }.
--   p_sort: 'newest' (default) | 'rating' | 'name' (≈ 'terdekat' tanpa
--   koordinat — urut abjad nama dalam kecamatan terpilih)
-- Hanya toko pemilik yang tidak disuspend yang ikut hasil.
create or replace function public.search_stores(
  p_search text default null,
  p_district text default null,
  p_sort text default 'newest',
  p_only_open boolean default false,
  p_only_verified boolean default false,
  p_has_products boolean default false,
  p_has_services boolean default false,
  p_limit integer default 12,
  p_offset integer default 0
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_total bigint;
  v_rows jsonb;
begin
  with base as (
    select
      s.id, s.kind, s.name, s.tagline, s.description, s.category,
      s.location, s.district, s.city, s.is_open, s.logo_url, s.banner_url,
      s.trusted, s.fast_response, s.rating, s.owner_id, s.created_at, s.slug,
      (select count(*) from public.products p
        where p.store_id = s.id and p.is_active and p.approval_status = 'approved') as product_count,
      (select count(*) from public.services sv
        where sv.store_id = s.id and sv.is_active and sv.approval_status = 'approved') as service_count
    from public.stores s
    join public.profiles pr on pr.id = s.owner_id
    where pr.is_suspended = false
      and (p_search is null or p_search = '' or s.name ilike '%' || p_search || '%')
      and (p_district is null or s.district = p_district)
      and (not p_only_open or s.is_open)
      and (not p_only_verified or s.trusted)
      and (not p_has_products or exists (
            select 1 from public.products p
            where p.store_id = s.id and p.is_active and p.approval_status = 'approved'))
      and (not p_has_services or exists (
            select 1 from public.services sv
            where sv.store_id = s.id and sv.is_active and sv.approval_status = 'approved'))
  )
  select count(*) into v_total from base;

  with ordered as (
    select b.* from base b
    order by
      (case when p_sort = 'rating' then b.rating else null end) desc nulls last,
      (case when p_sort in ('name', 'nearest') then lower(b.name) else null end) asc,
      b.created_at desc
    limit p_limit offset p_offset
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', o.id, 'kind', o.kind, 'name', o.name, 'tagline', o.tagline,
      'description', o.description, 'category', o.category, 'location', o.location,
      'district', o.district, 'city', o.city, 'is_open', o.is_open,
      'logo_url', o.logo_url, 'banner_url', o.banner_url, 'trusted', o.trusted,
      'fast_response', o.fast_response, 'rating', o.rating, 'owner_id', o.owner_id,
      'created_at', o.created_at, 'slug', o.slug,
      'product_count', o.product_count, 'service_count', o.service_count
    )), '[]'::jsonb) into v_rows
  from ordered o;

  return jsonb_build_object('rows', v_rows, 'total', v_total);
end;
$$;

-- 7. Statistik publik toko (aman dibuka anonim) --------------------------
-- Hanya angka agregat — tidak membocorkan isi order/booking.
create or replace function public.get_store_public_stats(p_store_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completed_orders bigint;
  v_completed_bookings bigint;
  v_reviews bigint;
begin
  select count(distinct o.id) into v_completed_orders
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where oi.store_id = p_store_id and o.status = 'completed';

  select count(*) into v_completed_bookings
  from public.bookings b
  join public.services s on s.id = b.service_id
  where s.store_id = p_store_id and b.status = 'completed';

  select count(*) into v_reviews
  from public.reviews r
  left join public.products p on p.id = r.product_id
  left join public.services s on s.id = r.service_id
  where coalesce(p.store_id, s.store_id) = p_store_id;

  return jsonb_build_object(
    'completed_orders', v_completed_orders,
    'completed_bookings', v_completed_bookings,
    'reviews', v_reviews
  );
end;
$$;