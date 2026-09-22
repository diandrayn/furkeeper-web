-- =========================================================================
-- FurKeeper — Manajemen Role Admin (§2.12)
-- =========================================================================
-- Run this AFTER supabase/admin_panel.sql (needs is_admin() dan trigger
-- protect_profile_privilege, yang di sini diganti dengan versi yang lebih ketat).
--
-- Yang ditambahkan:
--   1. profiles.admin_scope — 'full' | 'approval' | 'support'. Ini LABEL
--      pembagian tugas yang dibaca panel (lihat src/utils/adminScope.js):
--      menyaring sidebar dan memblokir rute. Ini BUKAN lapisan RLS baru —
--      semua akun role='admin' tetap diperlakukan sama oleh RLS.
--      Kalau perlu pembatasan di level database, itu pekerjaan terpisah.
--   2. protect_profile_privilege() diperketat:
--        * non-admin tidak bisa mengubah admin_scope-nya sendiri;
--        * admin tidak bisa mengubah role / admin_scope AKUNNYA SENDIRI
--          (mencegah menurunkan diri sendiri tanpa sengaja);
--        * platform tidak boleh kehilangan admin 'full' terakhir.
--      Perubahan tanpa sesi login (auth.uid() null — mis. SQL editor)
--      dilewatkan; klien anon tidak bisa sampai ke sini karena RLS
--      profiles mewajibkan auth.uid() = id atau is_admin().
--
-- Aman dijalankan ulang (add column if not exists / create or replace).
-- =========================================================================

-- 1. Kolom admin_scope ------------------------------------------------------
alter table public.profiles
  add column if not exists admin_scope text not null default 'full';

alter table public.profiles drop constraint if exists profiles_admin_scope_check;
alter table public.profiles
  add constraint profiles_admin_scope_check check (admin_scope in ('full', 'approval', 'support'));

-- Semua admin yang SUDAH ada sebelum migrasi ini tetap 'full' (default di atas),
-- jadi tidak ada yang tiba-tiba kehilangan akses.

-- 2. Trigger penjaga kolom istimewa -----------------------------------------
create or replace function public.protect_profile_privilege()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Tanpa sesi login (SQL editor / service role): tidak ada "aktor" untuk dicek.
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    if auth.uid() = old.id then
      if new.role is distinct from old.role then
        raise exception 'Admin tidak dapat mengubah role akunnya sendiri';
      end if;
      if new.admin_scope is distinct from old.admin_scope then
        raise exception 'Admin tidak dapat mengubah hak akses akunnya sendiri';
      end if;
    end if;

    -- Jangan sampai tidak ada admin 'full' sama sekali.
    if old.role = 'admin' and old.admin_scope = 'full'
       and (new.role <> 'admin' or new.admin_scope <> 'full') then
      if not exists (
        select 1 from public.profiles
        where role = 'admin' and admin_scope = 'full' and id <> old.id
      ) then
        raise exception 'Harus tersisa minimal satu Admin Penuh';
      end if;
    end if;

    return new;
  end if;

  -- Non-admin: aturan lama + admin_scope.
  if new.role is distinct from old.role then
    raise exception 'Hanya admin yang dapat mengubah role akun';
  end if;
  if new.admin_scope is distinct from old.admin_scope then
    raise exception 'Hanya admin yang dapat mengubah hak akses admin';
  end if;
  if new.is_suspended is distinct from old.is_suspended or new.suspended_reason is distinct from old.suspended_reason then
    raise exception 'Hanya admin yang dapat mengubah status suspend akun';
  end if;
  if new.seller_status is distinct from old.seller_status and new.seller_status = 'approved' then
    raise exception 'Hanya admin yang dapat menyetujui pendaftaran mitra';
  end if;
  if new.provider_status is distinct from old.provider_status and new.provider_status = 'approved' then
    raise exception 'Hanya admin yang dapat menyetujui pendaftaran mitra';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privilege on public.profiles;
create trigger trg_protect_profile_privilege
  before update on public.profiles
  for each row execute procedure public.protect_profile_privilege();
