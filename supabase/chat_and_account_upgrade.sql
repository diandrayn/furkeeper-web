-- =========================================================================
-- FurKeeper — Chat realtime + self-service account deletion
-- =========================================================================
-- Run this AFTER schema.sql (and after storage_policies*.sql) on the same
-- project. Adds:
--   1. `context` on conversations — so ChatContextCard (the "started from
--      this product/order/booking" banner) can be persisted, not just kept
--      in the old localStorage mock.
--   2. Realtime replication for `messages` — required for the chat window
--      to receive new messages live via supabase.channel(...).
--   3. A `delete_own_account()` RPC — lets a logged-in user delete their
--      own account from the client (the anon/authenticated key can't call
--      `auth.admin.deleteUser`, so this SECURITY DEFINER function is the
--      standard Supabase workaround). Every other table cascades off
--      `profiles`/`auth.users` via `on delete cascade` in schema.sql, so
--      one delete here cleans up addresses, pets, stores, products,
--      services, orders, bookings, reviews, conversations and messages
--      automatically.
-- =========================================================================

alter table public.conversations add column if not exists context jsonb;

-- Enable realtime for messages (safe to re-run — ignored if already added).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
