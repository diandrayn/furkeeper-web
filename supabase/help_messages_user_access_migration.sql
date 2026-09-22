-- =========================================================================
-- FurKeeper — help_messages: akses balasan untuk pengirim (Poin 3)
-- =========================================================================
-- Run this AFTER supabase/help_messages_migration.sql (in the Supabase SQL
-- editor). Safe to run top-to-bottom more than once — every policy is
-- dropped first if it exists before being recreated.
--
-- Kenapa migration ini perlu:
--   help_messages_migration.sql sengaja mengizinkan pengirim anonim
--   (user_id null) mengirim pesan, dan hanya admin yang punya policy
--   SELECT. Itu artinya pengirim — termasuk yang login — tidak pernah bisa
--   membaca balasan admin atas pesannya sendiri lewat aplikasi.
--
-- Perubahan di sini:
--   1. Kirim pesan sekarang WAJIB login: policy insert lama ("anyone can
--      send a help message", yang mengizinkan user_id null) diganti
--      dengan satu yang mewajibkan auth.uid() dan user_id = auth.uid().
--      Ini cocok dengan ContactPage.jsx yang sekarang menyembunyikan
--      tombol kirim untuk pengunjung yang belum login.
--   2. Pengirim boleh SELECT baris miliknya sendiri (user_id = auth.uid()),
--      supaya balasan admin muncul di /bantuan-saya. Policy admin yang
--      sudah ada ("admin reads all help messages") tetap berlaku — RLS
--      meng-OR-kan semua policy SELECT permissive, jadi admin tetap bisa
--      membaca semuanya sementara pengirim hanya melihat miliknya.
--
-- Pesan lama dengan user_id null (dikirim sebelum migration ini berlaku)
-- tetap ada dan tetap hanya bisa dibaca/dibalas oleh admin — lihat
-- penanganannya di AdminHelpMessagesPage.jsx ("Tanpa akun" + salin email).
-- =========================================================================

drop policy if exists "anyone can send a help message" on public.help_messages;
drop policy if exists "logged in users send a help message" on public.help_messages;
create policy "logged in users send a help message" on public.help_messages
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "sender reads own help messages" on public.help_messages;
create policy "sender reads own help messages" on public.help_messages
  for select using (user_id = auth.uid());
