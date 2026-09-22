-- =========================================================================
-- FurKeeper — Log Aktivitas Admin (audit trail) migration
-- =========================================================================
-- Run this AFTER schema.sql AND admin_panel.sql (relies on public.is_admin(),
-- added there) in the Supabase SQL editor.
--
-- What this adds:
--   1. public.admin_activity_log — one row per moderation action an admin
--      takes (approve/tolak mitra, suspend/aktifkan user, approve/tolak
--      atau nonaktifkan produk/jasa, hapus ulasan, ubah status/prioritas
--      laporan, balas laporan, kelola kategori, dsb). Spec §2.13: "Catatan
--      siapa melakukan aksi apa dan kapan — untuk audit trail."
--   2. RLS: only Admin can read the log; a row can only be inserted by the
--      admin who is the actor (actor_id = auth.uid()) and only if that
--      caller is actually an admin (checked server-side via is_admin(),
--      not by trusting the client). Nobody can update or delete a row —
--      an audit trail that could be edited after the fact isn't one.
--
-- Safe to run top-to-bottom once. Re-running errors on `create table` —
-- that's fine, it just means this migration already applied.
-- =========================================================================

create table public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete cascade,
  -- Machine-readable action key, e.g. 'approve_partner', 'suspend_user',
  -- 'reject_product', 'delete_review', 'reply_report'. utils/admin.js's
  -- ACTIVITY_ACTION_LABELS maps these to the Indonesian label shown in
  -- the panel, so this list can grow without a migration.
  action text not null,
  -- What kind of thing the action targeted — used to pick an icon/route
  -- in the panel (e.g. link back to the store/product/report affected).
  target_type text not null
    check (target_type in ('user', 'store', 'product', 'service', 'review', 'report', 'category', 'order', 'booking', 'help_message')),
  target_id uuid,
  -- Human-readable name of the target at the time of the action (a
  -- user's name, a product's title, a report's category) so the log
  -- still reads clearly even if the target is later renamed or deleted.
  target_label text,
  -- Free-form extra context (e.g. { "reason": "..." } for a rejection/
  -- suspend, or { "from": "baru", "to": "diproses" } for a status change).
  detail jsonb,
  created_at timestamptz not null default now()
);

create index admin_activity_log_created_idx on public.admin_activity_log (created_at desc);
create index admin_activity_log_actor_idx on public.admin_activity_log (actor_id);
create index admin_activity_log_action_idx on public.admin_activity_log (action);

alter table public.admin_activity_log enable row level security;

create policy "admin reads activity log" on public.admin_activity_log
  for select using (public.is_admin());

create policy "admin writes own activity log entries" on public.admin_activity_log
  for insert with check (actor_id = auth.uid() and public.is_admin());

-- No update/delete policy on purpose — an audit trail must be append-only.
