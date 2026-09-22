-- =========================================================================
-- FurKeeper — Kelola Laporan: kunci thread setelah status 'selesai'
-- =========================================================================
-- Run this AFTER supabase/reports_migration.sql.
--
-- reports_migration.sql already lets a reporter insert into
-- report_messages for their own report, but never checks the report's
-- current status — so a reporter could still reply after Admin marks it
-- 'selesai'. Poin 4 (§C) requires replies to stop once a report is
-- closed, so this replaces that one insert policy with a version that
-- also requires status <> 'selesai'. Admin's own reply policy is
-- untouched (Admin can still write a closing note if needed).
--
-- Safe to run multiple times — `drop policy if exists` + `create policy`.
-- =========================================================================

drop policy if exists "reporter replies on own report" on public.report_messages;

create policy "reporter replies on own open report" on public.report_messages
  for insert with check (
    sender_id = auth.uid()
    and is_admin = false
    and exists (
      select 1 from public.reports r
      where r.id = report_id
        and r.reporter_id = auth.uid()
        and r.status <> 'selesai'
    )
  );
