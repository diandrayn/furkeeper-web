-- =========================================================================
-- FurKeeper — Kelola Keuangan (§2.10)
-- =========================================================================
-- Run this AFTER supabase/admin_panel.sql (needs is_admin()).
--
-- Yang ditambahkan:
--   1. public.platform_settings — satu baris (id = 1): rate komisi platform
--      untuk produk dan jasa, dalam persen.
--   2. public.withdrawals — permintaan pencairan dana dari toko/penyedia jasa,
--      diproses admin (Menunggu -> Diproses -> Selesai, atau Ditolak).
--
-- Batasan yang sengaja diambil (baca sebelum mengandalkan angkanya):
--   * Rekap komisi di panel dihitung dari rate SAAT INI x transaksi selesai
--     di rentang tanggal. Ini BUKAN ledger: kalau rate diubah, rekap periode
--     lama ikut berubah. Ledger per transaksi butuh kolom komisi di
--     order_items/bookings — pekerjaan terpisah.
--   * Saldo penjual belum dimodelkan, jadi database tidak memeriksa apakah
--     jumlah pencairan <= saldo tersedia. Admin memverifikasi manual sebelum
--     memproses.
--   * Default rate di bawah (5% produk, 10% jasa) hanyalah nilai awal —
--     ubah lewat halaman Keuangan, bukan lewat file ini.
--
-- Aman dijalankan ulang (create if not exists / drop policy if exists).
-- =========================================================================

-- 1. platform_settings ------------------------------------------------------
create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  commission_produk_percent numeric(5,2) not null default 5
    check (commission_produk_percent >= 0 and commission_produk_percent <= 100),
  commission_jasa_percent numeric(5,2) not null default 10
    check (commission_jasa_percent >= 0 and commission_jasa_percent <= 100),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists "signed-in users read platform settings" on public.platform_settings;
create policy "signed-in users read platform settings" on public.platform_settings
  for select using (auth.uid() is not null);

drop policy if exists "admin updates platform settings" on public.platform_settings;
create policy "admin updates platform settings" on public.platform_settings
  for update using (public.is_admin()) with check (public.is_admin());
-- Tidak ada policy insert/delete: barisnya tunggal dan dibuat oleh migrasi ini.

-- 2. withdrawals ------------------------------------------------------------
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  amount integer not null check (amount > 0),
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles (id) on delete set null
);

create index if not exists withdrawals_status_idx on public.withdrawals (status, created_at desc);
create index if not exists withdrawals_store_idx on public.withdrawals (store_id);

alter table public.withdrawals enable row level security;

drop policy if exists "owner or admin reads withdrawals" on public.withdrawals;
create policy "owner or admin reads withdrawals" on public.withdrawals
  for select using (
    public.is_admin()
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

-- Pemilik toko boleh mengajukan, tapi hanya sebagai 'pending' dan tanpa
-- data pemrosesan. (Halaman pengajuan di dashboard penjual belum dibuat.)
drop policy if exists "owner requests withdrawal" on public.withdrawals;
create policy "owner requests withdrawal" on public.withdrawals
  for insert with check (
    status = 'pending'
    and admin_note is null and processed_at is null and processed_by is null
    and exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

drop policy if exists "admin updates withdrawals" on public.withdrawals;
create policy "admin updates withdrawals" on public.withdrawals
  for update using (public.is_admin()) with check (public.is_admin());
-- Tidak ada policy delete: catatan uang tidak dihapus.

-- 3. Trigger: aturan status + notifikasi ke pemilik toko ---------------------
create or replace function public.enforce_withdrawal_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_title text;
  v_body text;
begin
  -- Data rekening & jumlah tidak boleh diubah setelah diajukan.
  if new.store_id is distinct from old.store_id
     or new.amount is distinct from old.amount
     or new.bank_name is distinct from old.bank_name
     or new.account_number is distinct from old.account_number
     or new.account_holder is distinct from old.account_holder then
    raise exception 'Data pencairan tidak dapat diubah setelah diajukan';
  end if;

  if new.status is distinct from old.status then
    if old.status in ('completed', 'rejected') then
      raise exception 'Pencairan yang sudah selesai atau ditolak tidak dapat diubah lagi';
    end if;
    if old.status = 'processing' and new.status = 'pending' then
      raise exception 'Pencairan yang sedang diproses tidak dapat dikembalikan ke Menunggu';
    end if;
    if new.status = 'rejected' and coalesce(btrim(new.admin_note), '') = '' then
      raise exception 'Alasan penolakan wajib diisi';
    end if;

    select owner_id into v_owner from public.stores where id = new.store_id;
    if v_owner is not null then
      v_title := case new.status
        when 'processing' then 'Pencairan dana sedang diproses'
        when 'completed' then 'Pencairan dana selesai'
        when 'rejected' then 'Pencairan dana ditolak'
      end;
      v_body := case new.status
        when 'processing' then 'Permintaan pencairan Rp' || replace(to_char(new.amount, 'FM999,999,999,999'), ',', '.') || ' sedang diproses admin.'
        when 'completed' then 'Pencairan Rp' || replace(to_char(new.amount, 'FM999,999,999,999'), ',', '.') || ' ke ' || new.bank_name || ' telah diselesaikan.'
        when 'rejected' then 'Pencairan Rp' || replace(to_char(new.amount, 'FM999,999,999,999'), ',', '.') || ' ditolak. Alasan: ' || new.admin_note
      end;
      if v_title is not null then
        insert into public.notifications (user_id, type, title, body)
        values (v_owner, 'partner_status', v_title, v_body);
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_withdrawal_rules on public.withdrawals;
create trigger trg_enforce_withdrawal_rules
  before update on public.withdrawals
  for each row execute procedure public.enforce_withdrawal_rules();
