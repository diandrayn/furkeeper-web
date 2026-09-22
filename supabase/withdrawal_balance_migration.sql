-- =========================================================================
-- FurKeeper — Pencairan Dana Mitra: saldo + batas maksimal (lanjutan §2.10)
-- =========================================================================
-- Run AFTER supabase/finance_migration.sql (needs platform_settings,
-- withdrawals, stores, orders/order_items, bookings, services).
--
-- Sebelumnya database TIDAK memeriksa saldo (lihat catatan di
-- finance_migration.sql). Migrasi ini menambahkan:
--   1. public.store_available_balance(p_store_id) — saldo tersedia sebuah
--      toko = (pendapatan produk + pendapatan jasa) − komisi platform −
--      jumlah pencairan yang sudah diajukan (pending/processing/completed).
--      Pendapatan = transaksi berstatus 'completed' milik toko itu.
--      Komisi memakai rate SAAT INI dari platform_settings (bukan ledger
--      per transaksi — konsisten dengan rekap di panel admin).
--   2. public.my_withdrawal_balance() — RPC untuk dashboard mitra:
--      mengembalikan rincian saldo HANYA untuk toko milik pemanggil.
--   3. Trigger BEFORE INSERT pada withdrawals: menolak pengajuan yang
--      melebihi saldo tersedia.
--
-- Aman dijalankan ulang (create or replace / drop trigger if exists).
-- =========================================================================

-- 1. Saldo tersedia sebuah toko ---------------------------------------------
-- Di-hit dari transaksi 'completed' (order_items untuk produk, bookings
-- untuk jasa), dikurangi komisi platform dan pencairan sebelumnya.
create or replace function public.store_available_balance(p_store_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  with settings as (
    select
      coalesce(max(commission_produk_percent), 5) as rate_p,
      coalesce(max(commission_jasa_percent), 10) as rate_j
    from public.platform_settings
  ),
  produk as (
    select coalesce(sum(oi.price * oi.quantity), 0) as gross
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where oi.store_id = p_store_id and o.status = 'completed'
  ),
  jasa as (
    select coalesce(sum(b.price), 0) as gross
    from public.bookings b
    join public.services sv on sv.id = b.service_id
    where sv.store_id = p_store_id and b.status = 'completed'
  ),
  withdrawn as (
    select coalesce(sum(amount), 0) as total
    from public.withdrawals
    where store_id = p_store_id and status in ('pending', 'processing', 'completed')
  )
  select
      round(p.gross * (1 - s.rate_p / 100) + 0.0)
    + round(j.gross * (1 - s.rate_j / 100))
    - w.total
  from settings s, produk p, jasa j, withdrawn w
$$;

-- 2. RPC untuk dashboard mitra: rincian saldo per toko milik pemanggil ------
-- SECURITY DEFINER + WHERE owner_id = auth.uid() DI DALAM fungsi. Definir
-- sengaja dipakai karena tabel orders tidak punya policy SELECT untuk
-- pemilik toko (hanya pembeli) — subquery pendapatan di sini & di
-- store_available_balance harus melihat baris transaksi milik toko sendiri.
-- Kendali akses dijaga eksplisit: hanya baris stores milik auth.uid() yang
-- dikembalikan.
create or replace function public.my_withdrawal_balance()
returns table (
  store_id uuid,
  store_name text,
  store_kind text,
  gross_produk numeric,
  gross_jasa numeric,
  komisi_produk numeric,
  komisi_jasa numeric,
  withdrawn numeric,
  available numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with settings as (
    select
      coalesce(max(commission_produk_percent), 5) as rate_p,
      coalesce(max(commission_jasa_percent), 10) as rate_j
    from public.platform_settings
  ),
  ranges as (
    select s.id as store_id,
      (select coalesce(sum(oi.price * oi.quantity), 0)
         from public.orders o join public.order_items oi on oi.order_id = o.id
        where oi.store_id = s.id and o.status = 'completed') as gross_p,
      (select coalesce(sum(b.price), 0)
         from public.bookings b join public.services sv on sv.id = b.service_id
        where sv.store_id = s.id and b.status = 'completed') as gross_j,
      (select coalesce(sum(amount), 0) from public.withdrawals
        where store_id = s.id and status in ('pending', 'processing', 'completed')) as withdrawn
    from public.stores s
    where s.owner_id = (select auth.uid())
  )
  select
    r.store_id,
    st.name,
    st.kind,
    r.gross_p,
    r.gross_j,
    round(r.gross_p * s.rate_p / 100),
    round(r.gross_j * s.rate_j / 100),
    r.withdrawn,
    round(r.gross_p * (1 - s.rate_p / 100)) + round(r.gross_j * (1 - s.rate_j / 100)) - r.withdrawn
  from ranges r
  join public.stores st on st.id = r.store_id
  cross join settings s
$$;

-- 3. Trigger: tolak pengajuan > saldo tersedia ------------------------------
create or replace function public.enforce_withdrawal_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available numeric;
begin
  v_available := coalesce(public.store_available_balance(new.store_id), 0);
  if new.amount > v_available then
    raise exception 'Saldo tersedia tidak mencukupi. Maksimal pencairan Rp% di toko ini.',
      replace(to_char(v_available, 'FM999,999,999,999'), ',', '.');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_withdrawal_balance on public.withdrawals;
create trigger trg_check_withdrawal_balance
  before insert on public.withdrawals
  for each row execute procedure public.enforce_withdrawal_balance();