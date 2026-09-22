-- =========================================================================
-- FurKeeper — Kelola Laporan (reports) migration
-- =========================================================================
-- Run this AFTER schema.sql AND admin_panel.sql (this migration relies on
-- public.is_admin(), added there) in the Supabase SQL editor.
--
-- What this adds:
--   1. public.reports — a report filed by a pembeli/penjual/penyedia jasa
--      (pelapor) against another user or store/penyedia jasa (terlapor),
--      optionally linked to the order/booking/product/service it's about.
--   2. public.report_messages — the reply thread on a report (admin <->
--      pelapor), so Admin can answer directly from the Kelola Laporan menu
--      and keep a history of the conversation.
--   3. RLS: a reporter can create a report and read/reply to their own;
--      Admin (via is_admin()) can read, update status/priority on, and
--      reply to every report.
--
-- NOTE — this migration only covers the Admin side of Kelola Laporan. The
-- spec (§2.8) assumes pembeli/penjual/penyedia jasa can already file a
-- report from their own screens; that "buat laporan" entry point does not
-- exist yet anywhere in this codebase (no report/laporkan UI was found
-- outside admin), so until it's built, public.reports will stay empty in
-- practice. Building that entry point is a separate, non-admin-dashboard
-- task.
--
-- Safe to run top-to-bottom once. Re-running errors on the `create table`
-- statements — that's fine, it just means this migration already applied.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. reports
-- ---------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  -- terlapor: a user account, and/or a store/penyedia jasa (stores.kind
  -- distinguishes the two — see schema.sql). At least one of the two
  -- should be set; left as two nullable columns rather than a single
  -- polymorphic one so normal foreign-key integrity still applies.
  reported_user_id uuid references public.profiles (id) on delete cascade,
  reported_store_id uuid references public.stores (id) on delete cascade,
  category text not null
    check (category in ('penipuan', 'barang_tidak_sesuai', 'jasa_tidak_selesai', 'pelecehan', 'lainnya')),
  description text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'baru' check (status in ('baru', 'diproses', 'selesai')),
  -- optional links to the transaction/listing in dispute, so Admin doesn't
  -- have to search for context manually (spec §2.8 and §4).
  order_id uuid references public.orders (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status);
create index reports_reporter_idx on public.reports (reporter_id);

create or replace function public.touch_report_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reports_touch_updated_at
before update on public.reports
for each row execute function public.touch_report_updated_at();

alter table public.reports enable row level security;

create policy "reporter creates own report" on public.reports
  for insert with check (reporter_id = auth.uid());

create policy "reporter reads own reports" on public.reports
  for select using (reporter_id = auth.uid());

create policy "admin reads all reports" on public.reports
  for select using (public.is_admin());

create policy "admin updates all reports" on public.reports
  for update using (public.is_admin());

-- ---------------------------------------------------------------------
-- 2. report_messages — reply thread between Admin and the reporter
-- ---------------------------------------------------------------------
create table public.report_messages (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  is_admin boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);

create index report_messages_report_idx on public.report_messages (report_id, created_at);

alter table public.report_messages enable row level security;

create policy "reporter reads own report thread" on public.report_messages
  for select using (
    exists (select 1 from public.reports r where r.id = report_id and r.reporter_id = auth.uid())
  );

create policy "reporter replies on own report" on public.report_messages
  for insert with check (
    sender_id = auth.uid()
    and is_admin = false
    and exists (select 1 from public.reports r where r.id = report_id and r.reporter_id = auth.uid())
  );

create policy "admin reads all report threads" on public.report_messages
  for select using (public.is_admin());

create policy "admin replies on any report" on public.report_messages
  for insert with check (sender_id = auth.uid() and is_admin = true and public.is_admin());
