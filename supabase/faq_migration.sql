-- =========================================================================
-- FurKeeper — Kelola FAQ (§2.9, opsional)
-- =========================================================================
-- Run this AFTER supabase/admin_panel.sql (needs is_admin()).
--
-- public.faqs — daftar pertanyaan-jawaban publik di Pusat Bantuan, supaya
-- admin bisa tambah/ubah/hapus/urutkan dari panel tanpa deploy ulang.
-- Terpisah dari public.help_messages (inbox pesan MASUK dari pengguna).
--
-- Publik hanya bisa membaca FAQ yang is_published = true; admin melihat
-- dan menulis semuanya (termasuk draf).
--
-- Tabel sengaja TIDAK di-seed: pages/HelpCenterPage memakai bank FAQ bawaan
-- (src/data/mockFaqs.js) selama tabel ini masih kosong, lalu beralih ke
-- isi tabel begitu admin menerbitkan FAQ pertama.
--
-- Safe to run once.
-- =========================================================================

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Umum',
  question text not null check (btrim(question) <> ''),
  answer text not null check (btrim(answer) <> ''),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create index faqs_sort_order_idx on public.faqs (sort_order);

alter table public.faqs enable row level security;

create policy "published faqs are publicly readable" on public.faqs
  for select using (is_published or public.is_admin());

create policy "admin writes faqs" on public.faqs
  for all using (public.is_admin()) with check (public.is_admin());
