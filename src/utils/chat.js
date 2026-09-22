// Chat data layer backed by the `conversations` / `messages` tables +
// Realtime replication defined in supabase/schema.sql,
// supabase/chat_and_account_upgrade.sql and
// supabase/chat_fix_migration.sql. Replaces the old localStorage-only
// mock in data/mockChat.js — that meant every browser tab talked to itself
// (`senderId` was always the hardcoded string 'me'), so a buyer and a
// seller could never actually reach each other. Here `senderId` is always
// the real authenticated user's id, which is what makes both the buyer
// inbox (/chat) and the store inbox (/dashboard/*/pesan) show the same
// conversation and let messages flow both ways.
import { supabase } from '../lib/supabaseClient';

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function mapMessageRow(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.content,
    timestamp: row.created_at,
    isRead: row.is_read,
  };
}

/** Buyer-side inbox: every conversation this user started with a store. */
export async function fetchBuyerConversations(buyerId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, store_id, context, last_message_at, stores(name, kind)')
    .eq('buyer_id', buyerId)
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    participant: {
      id: row.store_id,
      name: row.stores?.name || 'Toko',
      avatarUrl: null,
      role: row.stores?.kind === 'service' ? 'provider' : 'seller',
    },
    context: row.context || null,
    lastMessageAt: row.last_message_at,
  }));
}

/** Store-side inbox (dashboard "Pesan" tab): every conversation a buyer
 * started with this store. */
export async function fetchStoreConversations(storeId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, buyer_id, context, last_message_at, profiles(full_name, avatar_url)')
    .eq('store_id', storeId)
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    participant: {
      id: row.buyer_id,
      name: row.profiles?.full_name || 'Pembeli',
      avatarUrl: row.profiles?.avatar_url || null,
      role: 'buyer',
    },
    context: row.context || null,
    lastMessageAt: row.last_message_at,
  }));
}

/** Fetches every message across the given conversations in one query, then
 * reduces client-side into { messagesByConversation, lastMessageByConversation,
 * unreadCountByConversation } — avoids one round-trip per conversation. */
export async function fetchThreadsSummary(conversationIds, viewerId) {
  const empty = { messagesByConversation: {}, lastMessageByConversation: {}, unreadCountByConversation: {} };
  if (!conversationIds.length) return empty;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const messagesByConversation = {};
  const lastMessageByConversation = {};
  const unreadCountByConversation = {};
  for (const row of data || []) {
    const message = mapMessageRow(row);
    const list = messagesByConversation[message.conversationId] || (messagesByConversation[message.conversationId] = []);
    list.push(message);
    lastMessageByConversation[message.conversationId] = message;
    if (!message.isRead && message.senderId !== viewerId) {
      unreadCountByConversation[message.conversationId] = (unreadCountByConversation[message.conversationId] || 0) + 1;
    }
  }
  return { messagesByConversation, lastMessageByConversation, unreadCountByConversation };
}

export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapMessageRow);
}

export async function sendMessageRow(conversationId, senderId, text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content: trimmed })
    .select('*')
    .single();
  if (error) throw error;
  // last_message_at is bumped by the on_message_insert_touch_conversation
  // trigger (see supabase/chat_fix_migration.sql) — the old client-side
  // `conversations.update(...)` here silently no-op'd with RLS (no UPDATE
  // policy), so the owner of a thread never knew they had new mail.
  return mapMessageRow(data);
}

/** Marks every message in the conversation NOT sent by the caller as read,
 * via the mark_conversation_read() RPC — a raw SQL UPDATE from the client
 * used to fail silently because there was no UPDATE policy on `messages`,
 * so read receipts/last_unread never worked. The RPC is SECURITY DEFINER
 * and derives the caller from auth.uid(), so no ambiguity about who is
 * "the reader". */
export async function markConversationRead(conversationId) {
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
}

/** Finds (or starts) the conversation between this buyer and this store —
 * `conversations` has a unique(buyer_id, store_id) constraint, so this is
 * safe to call every time someone taps "Chat Penjual"/"Chat Penyedia Jasa". */
export async function findOrCreateConversation(buyerId, storeId, context) {
  const { data: existing, error: findErr } = await supabase
    .from('conversations')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('store_id', storeId)
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing) {
    if (context) {
      // Requires the "participants update conversations" policies from
      // chat_fix_migration.sql — without them this used to fail silently.
      const { error: updateErr } = await supabase
        .from('conversations')
        .update({ context })
        .eq('id', existing.id);
      if (updateErr) throw updateErr;
    }
    return existing.id;
  }

  const { data: created, error: createErr } = await supabase
    .from('conversations')
    .insert({ buyer_id: buyerId, store_id: storeId, context: context || null })
    .select('id')
    .single();
  if (createErr) throw createErr;
  return created.id;
}

/**
 * ONE realtime subscription per logged-in user, covering every chat they
 * participate in — as a buyer and/or as a store owner. Supabase Realtime
 * re-checks the subscriber's SELECT RLS policies before delivering a
 * postgres_changes event, so a client only ever receives messages from
 * conversations they're actually part of.
 *
 * The old code subscribed per open conversation (subscribeToMessages),
 * which meant:
 *   - the navbar badge never saw messages land in *other* conversations;
 *   - a store owner had to open their dashboard before unread from a new
 *     buyer appeared at all.
 *
 * handlers:
 *   onMessageInsert(message)      — a new message in any of my threads
 *   onMessageUpdate(message, old) — e.g. is_read flips after the RPC runs
 *   onConversationInsert(row)     — brand-new conversation (e.g. a buyer
 *                                  just started chatting with a seller)
 */
export function subscribeToChat(handlers) {
  const channel = supabase
    .channel('chat-feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => handlers.onMessageInsert(mapMessageRow(payload.new)),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages' },
      (payload) => handlers.onMessageUpdate(mapMessageRow(payload.new), mapMessageRow(payload.old)),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'conversations' },
      (payload) => handlers.onConversationInsert?.(payload.new),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}