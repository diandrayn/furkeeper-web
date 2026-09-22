-- =========================================================================
-- FurKeeper — Kelola Pesan / Pusat Bantuan (help inbox) migration
-- =========================================================================
-- Run this AFTER schema.sql AND admin_panel.sql (relies on public.is_admin(),
-- added there) in the Supabase SQL editor.
--
-- What this adds:
--   1. public.help_messages — a message sent through the public Bantuan/
--      Kontak form (spec §2.9: "pesan yang masuk dari pengguna melalui
--      halaman bantuan/FAQ (pertanyaan yang tidak terjawab oleh FAQ)").
--      The sender may or may not be logged in — user_id is nullable and
--      name/email are always captured directly on the row so Admin has
--      someone to reply to either way.
--   2. RLS: anyone (signed in or anonymous) can submit a message; only
--      Admin can read the inbox or reply/update its status. Nobody can
--      delete a row.
--
-- NOTE — this migration covers the Admin side of Kelola Pesan (the inbox +
-- reply). src/pages/ContactPage.jsx (route /kontak) is wired in this same
-- change to insert into this table on submit, so the inbox will actually
-- receive messages once this migration runs. Kelola konten FAQ itself
-- (tambah/edit/hapus daftar pertanyaan-jawaban, per the spec's note under
-- §2.9) is still static mock content in src/data/mockFaqs.js — turning
-- that into an editable CMS table is a separate, later task.
--
-- Safe to run top-to-bottom once. Re-running errors on `create table` —
-- that's fine, it just means this migration already applied.
--
-- FOLLOW-UP: run supabase/help_messages_user_access_migration.sql after
-- this one — it tightens the insert policy to logged-in senders only and
-- lets a sender read their own row (so admin replies actually reach them
-- on /bantuan-saya).
-- =========================================================================

create table public.help_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  subject text,
  body text not null,
  status text not null default 'belum_dibalas' check (status in ('belum_dibalas', 'sudah_dibalas')),
  admin_reply text,
  replied_by uuid references public.profiles (id) on delete set null,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index help_messages_status_idx on public.help_messages (status);
create index help_messages_created_idx on public.help_messages (created_at desc);

create or replace function public.touch_help_message_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger help_messages_touch_updated_at
before update on public.help_messages
for each row execute function public.touch_help_message_updated_at();

alter table public.help_messages enable row level security;

-- Public Bantuan/Kontak form — works whether or not the sender is logged
-- in. If they are, user_id must be their own id (or left null); an
-- anonymous visitor always has user_id null since auth.uid() is null too.
create policy "anyone can send a help message" on public.help_messages
  for insert
  with check (user_id is null or user_id = auth.uid());

create policy "admin reads all help messages" on public.help_messages
  for select using (public.is_admin());

create policy "admin updates all help messages" on public.help_messages
  for update using (public.is_admin());

-- No delete policy on purpose — resolved messages stay as a record; Admin
-- can filter them out via status instead of removing them.
