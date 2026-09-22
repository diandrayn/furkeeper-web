-- =========================================================================
-- FurKeeper — Perlebar jenis target Log Aktivitas Admin
-- =========================================================================
-- Run this AFTER supabase/activity_log_migration.sql.
--
-- Kenapa perlu: constraint asli hanya mengizinkan 10 jenis target. Fitur
-- admin yang ditambahkan sesudahnya mencatat jenis 'faq', 'content',
-- 'setting', dan 'withdrawal'. logAdminActivity() sengaja menelan error
-- supaya aksinya tidak tampak gagal, jadi tanpa migrasi ini catatan audit
-- untuk aksi-aksi itu HILANG DIAM-DIAM (aksinya sendiri tetap berhasil).
--
-- Aman dijalankan ulang.
-- =========================================================================

alter table public.admin_activity_log drop constraint if exists admin_activity_log_target_type_check;
alter table public.admin_activity_log
  add constraint admin_activity_log_target_type_check
  check (target_type in (
    'user', 'store', 'product', 'service', 'review', 'report', 'category',
    'order', 'booking', 'help_message',
    'faq', 'content', 'setting', 'withdrawal'
  ));
