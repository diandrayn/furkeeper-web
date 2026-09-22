-- ============================================================================
-- sync_orders_booking_migration.sql
-- T1 — Single source of truth untuk transaksi (orders + bookings).
--
-- Menjadikan tabel orders/bookings sebagai satu-satunya sumber status yang
-- dilihat pembeli, penjual/penyedia, dan admin. Bagian yang ditambahkan:
--   1. Riwayat perubahan status (siapa + kapan) via trigger AFTER UPDATE.
--   2. Policy RLS baru: penjual membaca orders-nya, toko membalas ulasan.
--   3. RPC submit_order / submit_booking  — insert atomik + penurunan stok
--      saat pesanan dibuat + snapshot alamat & data pembeli/pet (penjual
--      TIDAK boleh membaca tabel addresses/pets milik pembeli via RLS).
--   4. RPC set_order_status / set_booking_status — validasi transisi per
--      aktor (buyer vs seller/provider), catat riwayat, stok restore saat
--      batal, dan kirim notifikasi ke pihak lawan secara event-nyata.
--
-- Prasyarat: schema.sql + admin_panel.sql (untuk public.is_admin()).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Riwayat status orders
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx
  on public.order_status_history (order_id, created_at);

-- ---------------------------------------------------------------------------
-- 2. Riwayat status bookings
-- ---------------------------------------------------------------------------
create table if not exists public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists booking_status_history_booking_id_idx
  on public.booking_status_history (booking_id, created_at);

-- ---------------------------------------------------------------------------
-- 3. Snapshot pengiriman & data customer (RLS mencegah penjual membaca
--    addresses / pets / profil pembeli secara langsung).
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists shipping_address text;

alter table public.bookings
  add column if not exists buyer_name text,
  add column if not exists buyer_phone text,
  add column if not exists pet_name text,
  add column if not exists pet_species text;

-- ---------------------------------------------------------------------------
-- 4. Trigger pencatat riwayat (jalan untuk SEMUA jalur perubahan status:
--    RPC, admin, maupun update langsung via policy lama).
-- ---------------------------------------------------------------------------
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status is distinct from OLD.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (OLD.id, OLD.status, NEW.status, auth.uid());
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_order_status_history on public.orders;
create trigger trg_order_status_history
  after update of status on public.orders
  for each row execute procedure public.log_order_status_change();

create or replace function public.log_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status is distinct from OLD.status then
    insert into public.booking_status_history (booking_id, from_status, to_status, changed_by)
    values (OLD.id, OLD.status, NEW.status, auth.uid());
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_booking_status_history on public.bookings;
create trigger trg_booking_status_history
  after update of status on public.bookings
  for each row execute procedure public.log_booking_status_change();

-- ---------------------------------------------------------------------------
-- 5. Policy RLS tambahan
-- ---------------------------------------------------------------------------

-- Penjual (pemilik toko) membaca pesanan yang berisi produknya.
drop policy if exists "store owner reads orders" on public.orders;
create policy "store owner reads orders" on public.orders for select
  using (exists (
    select 1 from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = id and s.owner_id = auth.uid()
  ));

-- Status hanya boleh berubah lewat RPC set_order_status/set_booking_status
-- (agar transisi + riwayat + stok + notifikasi selalu konsisten). Pola
-- update langsung dari klien dibuang; aksi pembeli (batal/terima) tetap
-- melalui RPC dengan pemeriksaan kepemilikan di dalamnya.
drop policy if exists "buyer updates own orders" on public.orders;

drop policy if exists "buyer manages own bookings" on public.bookings;
create policy "buyer reads own bookings" on public.bookings for select
  using (auth.uid() = buyer_id);
create policy "buyer inserts own bookings" on public.bookings for insert
  with check (auth.uid() = buyer_id);

-- Riwayat status orders: pembaca = pembeli pemilik, penjual toko terkait, admin.
alter table public.order_status_history enable row level security;

drop policy if exists "buyer reads own order history" on public.order_status_history;
create policy "buyer reads own order history" on public.order_status_history for select
  using (exists (
    select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()
  ));

drop policy if exists "store reads order history" on public.order_status_history;
create policy "store reads order history" on public.order_status_history for select
  using (exists (
    select 1 from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = order_id and s.owner_id = auth.uid()
  ));

drop policy if exists "admin reads all order history" on public.order_status_history;
create policy "admin reads all order history" on public.order_status_history for select
  using (public.is_admin());

-- Riwayat status bookings: pembaca = pembeli, penyedia jasa, admin.
alter table public.booking_status_history enable row level security;

drop policy if exists "buyer reads own booking history" on public.booking_status_history;
create policy "buyer reads own booking history" on public.booking_status_history for select
  using (exists (
    select 1 from public.bookings b where b.id = booking_id and b.buyer_id = auth.uid()
  ));

drop policy if exists "provider reads booking history" on public.booking_status_history;
create policy "provider reads booking history" on public.booking_status_history for select
  using (exists (
    select 1 from public.bookings b
    join public.services sv on sv.id = b.service_id
    join public.stores s on s.id = sv.store_id
    where b.id = booking_id and s.owner_id = auth.uid()
  ));

drop policy if exists "admin reads all booking history" on public.booking_status_history;
create policy "admin reads all booking history" on public.booking_status_history for select
  using (public.is_admin());

-- Toko boleh membalas ulasan untuk produk/jasa miliknya (mengisi kolom reply).
drop policy if exists "store owner replies to reviews" on public.reviews;
create policy "store owner replies to reviews" on public.reviews for update
  using (
    exists (
      select 1 from public.products p join public.stores s on s.id = p.store_id
      where p.id = reviews.product_id and s.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.services sv join public.stores s on s.id = sv.store_id
      where sv.id = reviews.service_id and s.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. RPC: submit_order — insert atomik (order + items) + stok turun saat
--    pesanan dibuat + snapshot alamat + notifikasi pesanan baru ke penjual.
--    p_items: [{ store_id, product_id, name, variant, quantity, price }]
-- ---------------------------------------------------------------------------
create or replace function public.submit_order(
  p_address_id uuid,
  p_payment_method text,
  p_subtotal integer,
  p_shipping_cost integer,
  p_total integer,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_buyer_id uuid;
  v_item jsonb;
  v_qty integer;
  v_product_id uuid;
  v_available integer;
  v_address public.addresses%rowtype;
begin
  v_buyer_id := auth.uid();
  if v_buyer_id is null then
    raise exception 'Kamu harus login untuk membuat pesanan.';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang pesanan kosong.';
  end if;

  -- Snapshot alamat (penjual tidak punya akses RLS ke addresses pembeli).
  select * into v_address from public.addresses where id = p_address_id;
  if v_address.id is null then
    raise exception 'Alamat pengiriman tidak ditemukan.';
  end if;

  insert into public.orders (buyer_id, address_id, payment_method, subtotal, shipping_cost, total, shipping_address)
  values (
    v_buyer_id, p_address_id, p_payment_method, p_subtotal, p_shipping_cost, p_total,
    v_address.recipient_name || ' — ' || v_address.phone || E'\n' ||
    v_address.full_address || E'\n' ||
    coalesce(v_address.district, '') || coalesce(', ' || v_address.city, '') ||
    coalesce(' ' || v_address.postal_code, '')
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, (coalesce(v_item->>'quantity', '1'))::int);
    v_product_id := (v_item->>'product_id')::uuid;

    -- Kurangi stok saat pesanan dibuat; jika stok kurang, batalkan semua.
    if v_product_id is not null then
      select stock into v_available
      from public.products where id = v_product_id for update;
      if v_available is null then
        raise exception 'Produk "%" tidak ditemukan.', (v_item->>'name');
      end if;
      if v_available < v_qty then
        raise exception 'Stok "%" tidak cukup (tersisa %).', (v_item->>'name'), v_available;
      end if;
      update public.products
      set stock = stock - v_qty
      where id = v_product_id;
    end if;

    insert into public.order_items (order_id, product_id, store_id, name, variant, price, quantity)
    values (
      v_order_id,
      v_product_id,
      (v_item->>'store_id')::uuid,
      v_item->>'name',
      nullif(v_item->>'variant', ''),
      greatest(0, (coalesce(v_item->>'price', '0'))::int),
      v_qty
    );
  end loop;

  -- Notifikasi event nyata ke penjual.
  insert into public.notifications (user_id, type, title, body, link)
  select distinct s.owner_id, 'new_order',
    'Pesanan baru #' || left(v_order_id::text, 8),
    'Ada pesanan baru menunggu konfirmasi dari kamu.',
    '/dashboard/toko/pesanan'
  from public.order_items oi
  join public.stores s on s.id = oi.store_id
  where oi.order_id = v_order_id and s.owner_id <> v_buyer_id;

  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. RPC: set_order_status — transisi status yang divalidasi per aktor.
--    buyer : pending_payment -> cancelled | shipped -> completed
--    seller: pending_payment -> processing/cancelled | processing -> shipped/cancelled
--            | shipped -> completed/cancelled
--    + restore stok saat batal + notifikasi ke pihak lawan.
-- ---------------------------------------------------------------------------
create or replace function public.set_order_status(
  p_order_id uuid,
  p_status text,
  p_actor text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  if p_actor not in ('buyer', 'seller') then
    raise exception 'Aktor tidak valid.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'Pesanan tidak ditemukan.';
  end if;

  if p_actor = 'buyer' then
    if auth.uid() <> v_order.buyer_id then
      raise exception 'Pesanan ini bukan milikmu.';
    end if;
    if not (
      (v_order.status = 'pending_payment' and p_status = 'cancelled')
      or (v_order.status = 'shipped' and p_status = 'completed')
    ) then
      raise exception 'Pembeli tidak dapat mengubah status dari "%" ke "%".', v_order.status, p_status;
    end if;
  else
    perform 1
    from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = p_order_id and s.owner_id = auth.uid();
    if not found then
      raise exception 'Kamu bukan penjual dari pesanan ini.';
    end if;
    if not (
      (v_order.status = 'pending_payment' and p_status in ('processing', 'cancelled'))
      or (v_order.status = 'processing' and p_status in ('shipped', 'cancelled'))
      or (v_order.status = 'shipped' and p_status in ('completed', 'cancelled'))
    ) then
      raise exception 'Transisi status "%" ke "%" tidak diizinkan.', v_order.status, p_status;
    end if;
  end if;

  update public.orders set status = p_status where id = p_order_id;

  -- Kembalikan stok jika pesanan dibatalkan (stok sudah turun saat dibuat).
  if p_status = 'cancelled' then
    for v_item in select * from public.order_items where order_id = p_order_id loop
      if v_item.product_id is not null then
        update public.products
        set stock = stock + v_item.quantity
        where id = v_item.product_id;
      end if;
    end loop;
  end if;

  -- Notifikasi ke pihak lawan.
  if p_actor = 'seller' then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_order.buyer_id, 'order_status',
      'Pesanan #' || left(p_order_id::text, 8),
      'Status pesananmu menjadi "' || p_status || '".',
      '/pesanan/' || p_order_id::text
    );
  else
    insert into public.notifications (user_id, type, title, body, link)
    select distinct s.owner_id, 'order_status',
      'Pesanan #' || left(p_order_id::text, 8),
      'Pembeli mengubah pesanan menjadi "' || p_status || '".',
      '/dashboard/toko/pesanan'
    from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = p_order_id and s.owner_id is not null;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. RPC: submit_booking — insert booking atomik + snapshot pembeli & pet +
--    notifikasi ke penyedia jasa.
-- ---------------------------------------------------------------------------
create or replace function public.submit_booking(
  p_service_id uuid,
  p_service_package_id uuid,
  p_pet_id uuid,
  p_scheduled_date date,
  p_scheduled_time text,
  p_price integer,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  v_buyer_id uuid;
  v_buyer_name text;
  v_buyer_phone text;
  v_pet_name text;
  v_pet_species text;
begin
  v_buyer_id := auth.uid();
  if v_buyer_id is null then
    raise exception 'Kamu harus login untuk membuat booking.';
  end if;

  select full_name, phone into v_buyer_name, v_buyer_phone
  from public.profiles where id = v_buyer_id;

  select name, species into v_pet_name, v_pet_species
  from public.pets where id = p_pet_id;

  insert into public.bookings (
    buyer_id, service_id, service_package_id, pet_id,
    status, scheduled_date, scheduled_time, price, notes,
    buyer_name, buyer_phone, pet_name, pet_species
  )
  values (
    v_buyer_id, p_service_id, p_service_package_id, p_pet_id,
    'pending_confirmation', p_scheduled_date, p_scheduled_time,
    greatest(0, coalesce(p_price, 0)), p_notes,
    coalesce(v_buyer_name, ''), coalesce(v_buyer_phone, ''),
    coalesce(v_pet_name, ''), coalesce(v_pet_species, '')
  )
  returning id into v_booking_id;

  insert into public.notifications (user_id, type, title, body, link)
  select s.owner_id, 'new_booking',
    'Booking baru #' || left(v_booking_id::text, 8),
    'Ada booking baru menunggu konfirmasi darimu.',
    '/dashboard/jasa/booking'
  from public.services sv
  join public.stores s on s.id = sv.store_id
  where sv.id = p_service_id and s.owner_id <> v_buyer_id;

  return v_booking_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. RPC: set_booking_status — transisi status booking per aktor.
--    buyer   : pending_confirmation -> cancelled | confirmed -> cancelled
--              | in_progress -> completed
--    provider: pending_confirmation -> confirmed/cancelled
--              | confirmed -> in_progress/cancelled
--              | in_progress -> completed/cancelled
--    + notifikasi ke pihak lawan.
-- ---------------------------------------------------------------------------
create or replace function public.set_booking_status(
  p_booking_id uuid,
  p_status text,
  p_actor text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_provider_id uuid;
begin
  if p_actor not in ('buyer', 'provider') then
    raise exception 'Aktor tidak valid.';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'Booking tidak ditemukan.';
  end if;

  select s.owner_id into v_provider_id
  from public.services sv
  join public.stores s on s.id = sv.store_id
  where sv.id = v_booking.service_id;

  if p_actor = 'buyer' then
    if auth.uid() <> v_booking.buyer_id then
      raise exception 'Booking ini bukan milikmu.';
    end if;
    if not (
      (v_booking.status = 'pending_confirmation' and p_status = 'cancelled')
      or (v_booking.status = 'confirmed' and p_status = 'cancelled')
      or (v_booking.status = 'in_progress' and p_status = 'completed')
    ) then
      raise exception 'Pembeli tidak dapat mengubah status dari "%" ke "%".', v_booking.status, p_status;
    end if;
  else
    if v_provider_id is distinct from auth.uid() then
      raise exception 'Kamu bukan penyedia jasa untuk booking ini.';
    end if;
    if not (
      (v_booking.status = 'pending_confirmation' and p_status in ('confirmed', 'cancelled'))
      or (v_booking.status = 'confirmed' and p_status in ('in_progress', 'cancelled'))
      or (v_booking.status = 'in_progress' and p_status in ('completed', 'cancelled'))
    ) then
      raise exception 'Transisi status "%" ke "%" tidak diizinkan.', v_booking.status, p_status;
    end if;
  end if;

  update public.bookings set status = p_status where id = p_booking_id;

  if p_actor = 'provider' then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_booking.buyer_id, 'booking_status',
      'Booking #' || left(p_booking_id::text, 8),
      'Status bookingmu menjadi "' || p_status || '".',
      '/booking/' || p_booking_id::text || '/status'
    );
  else
    if v_provider_id is not null then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        v_provider_id, 'booking_status',
        'Booking #' || left(p_booking_id::text, 8),
        'Pembeli mengubah booking menjadi "' || p_status || '".',
        '/dashboard/jasa/booking'
      );
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Satu enum status untuk klien (dibaca src/utils/statusConstants.js agar
--     seragam di pembeli/penjual/admin). Perkuat CHECK agar nilai valid.
-- ---------------------------------------------------------------------------
alter table public.orders
  drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check check (
    status in ('pending_payment', 'processing', 'shipped', 'completed', 'cancelled')
  );

alter table public.bookings
  drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check check (
    status in ('pending_confirmation', 'confirmed', 'in_progress', 'completed', 'cancelled')
  );