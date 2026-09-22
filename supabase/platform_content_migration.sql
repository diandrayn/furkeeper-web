-- =========================================================================
-- FurKeeper — Pengaturan Platform / konten statis migration (§2.14)
-- =========================================================================
-- Run this AFTER supabase/admin_panel.sql (needs is_admin()).
--
-- What this adds:
--   public.platform_content — small CMS table so admin can edit Syarat &
--   Ketentuan, Kebijakan Privasi, Kebijakan Pembatalan, and any other
--   static copy from the panel without a redeploy. Publicly readable
--   (public pages read straight from here); only admin can write.
--
--   Body is stored as plain text with blank lines separating paragraphs —
--   see the comment on src/components/RichTextBlock.jsx, which was already
--   written to accept a CMS-sourced paragraph list without changing call
--   sites. LegalPage.jsx prefers a non-empty row here over the bundled
--   template copy in src/data/mockLegalContent.js; if a row's body is left
--   empty, the page quietly falls back to that template so the site never
--   ships a blank legal page.
--
-- Safe to run once. `create table` / the seed inserts below will error on
-- a second run — that's fine, it just means this migration already
-- applied.
-- =========================================================================

create table public.platform_content (
  key text primary key,
  title text not null,
  body text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

alter table public.platform_content enable row level security;

create policy "platform content is publicly readable" on public.platform_content
  for select using (true);

create policy "admin writes platform content" on public.platform_content
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed the entries the panel expects to always be able to show, even
-- before an admin has written anything into them. Left blank on purpose —
-- see the fallback note above.
insert into public.platform_content (key, title, body) values
  ('syarat_ketentuan', 'Syarat & Ketentuan', ''),
  ('kebijakan_privasi', 'Kebijakan Privasi', ''),
  ('kebijakan_pembatalan', 'Kebijakan Pembatalan', '');
