-- =========================================================================
-- FurKeeper — chat fixes
-- =========================================================================
-- Run this AFTER schema.sql and supabase/chat_and_account_upgrade.sql on the
-- same project. Fixes three things that made the chat unusable:
--
--   1. last_message_at never updated from the client: the old client-side
--      `conversations.update(...)` silently no-op'd because conversations
--      had no UPDATE RLS policy. A trigger now bumps it on every INSERT
--      into `messages`, so both inboxes re-sort and the "unread" state is
--      visible to the other party.
--
--   2. mark-read silently failed: messages had no UPDATE RLS policy, so
--      flipping is_read from the browser did nothing (and was caught and
--      swallowed in ChatContext). The mark_conversation_read() SECURITY
--      DEFINER RPC below sets is_read = true for everything in the thread
--      the caller is a participant of, without exposing raw UPDATE access.
--
--   3. Realtime only covered one open conversation: the navbar badge never
--      saw store-side unread or messages landing elsewhere. Both
--      `messages` and `conversations` are now (re-)added to the realtime
--      publication so ChatContext can run ONE subscription per user.
--
-- Re-runnable: every statement below is idempotent.
-- =========================================================================

-- `context` lives in chat_and_account_upgrade.sql; re-assert in case this
-- file is ever run against a project that skipped it.
alter table public.conversations add column if not exists context jsonb;

-- -------------------------------------------------------------------------
-- RLS: participants may UPDATE their conversations (used for the chat
-- context card + last_message_at ordering fallbacks).
-- -------------------------------------------------------------------------
drop policy if exists "buyer updates own conversations" on public.conversations;
create policy "buyer updates own conversations" on public.conversations
  for update using (auth.uid() = buyer_id);

drop policy if exists "store owner updates conversations" on public.conversations;
create policy "store owner updates conversations" on public.conversations
  for update using (exists (
    select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()
  ));

-- -------------------------------------------------------------------------
-- Trigger: every new message bumps its conversation's last_message_at.
-- -------------------------------------------------------------------------
create or replace function public.touch_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_insert_touch_conversation on public.messages;
create trigger on_message_insert_touch_conversation
  after insert on public.messages
  for each row execute procedure public.touch_conversation_last_message();

-- -------------------------------------------------------------------------
-- RPC: mark every message in a conversation (except the caller's own) as
-- read. SECURITY DEFINER + a participation check, so a user can only mark
-- threads they are actually part of and RLS can't silently swallow it.
-- -------------------------------------------------------------------------
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id
      and (
        c.buyer_id = auth.uid()
        or exists (
          select 1 from public.stores s
          where s.id = c.store_id and s.owner_id = auth.uid()
        )
      )
  ) then
    return;
  end if;

  update public.messages
     set is_read = true
   where conversation_id = p_conversation_id
     and sender_id <> auth.uid()
     and is_read = false;
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- -------------------------------------------------------------------------
-- Realtime publication: both tables, guarded so this can be re-run.
-- -------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
    ) then
      alter publication supabase_realtime add table public.conversations;
    end if;
  end if;
end $$;