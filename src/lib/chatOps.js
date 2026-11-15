import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';
import { mapMessageRow } from '@/lib/mappers';

async function userConversationIds(userId) {
  const stores = await prisma.stores.findMany({
    where: { owner_id: userId },
    select: { id: true },
  });
  const storeIds = stores.map((s) => s.id);
  const convos = await prisma.conversations.findMany({
    where: {
      OR: [{ buyer_id: userId }, ...(storeIds.length ? [{ store_id: { in: storeIds } }] : [])],
    },
    select: { id: true, created_at: true, buyer_id: true, store_id: true },
  });
  return { convos, storeIds };
}

async function assertParticipant(user, conversationId) {
  const conv = await prisma.conversations.findUnique({
    where: { id: conversationId },
    include: { store: { select: { owner_id: true, kind: true } } },
  });
  if (!conv) throw new HttpError(404, 'Percakapan tidak ditemukan.');
  const isBuyer = conv.buyer_id === user.id;
  const isOwner = conv.store.owner_id === user.id;
  if (!isBuyer && !isOwner && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  return conv;
}

export async function fetchBuyerConversations(user, buyerId) {
  if (user.id !== buyerId && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  const rows = await prisma.conversations.findMany({
    where: { buyer_id: buyerId },
    include: { store: { select: { name: true, kind: true } } },
    orderBy: { last_message_at: 'desc' },
  });
  return rows.map((row) => ({
    id: row.id,
    participant: {
      id: row.store_id,
      name: row.store?.name || 'Toko',
      avatarUrl: null,
      role: row.store?.kind === 'service' ? 'provider' : 'seller',
    },
    context: row.context || null,
    lastMessageAt: row.last_message_at,
  }));
}

export async function fetchStoreConversations(user, storeId) {
  const store = await prisma.stores.findUnique({ where: { id: storeId } });
  if (!store) throw new HttpError(404, 'Toko tidak ditemukan.');
  if (store.owner_id !== user.id && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  const rows = await prisma.conversations.findMany({
    where: { store_id: storeId },
    include: { buyer: { select: { full_name: true, avatar_url: true } } },
    orderBy: { last_message_at: 'desc' },
  });
  return rows.map((row) => ({
    id: row.id,
    participant: {
      id: row.buyer_id,
      name: row.buyer?.full_name || 'Pembeli',
      avatarUrl: row.buyer?.avatar_url || null,
      role: 'buyer',
    },
    context: row.context || null,
    lastMessageAt: row.last_message_at,
  }));
}

export async function fetchThreadsSummary(user, conversationIds) {
  const empty = { messagesByConversation: {}, lastMessageByConversation: {}, unreadCountByConversation: {} };
  if (!conversationIds?.length) return empty;
  const { convos } = await userConversationIds(user.id);
  const allowed = new Set(convos.map((c) => c.id));
  const ids = conversationIds.filter((id) => allowed.has(id) || user.role === 'admin');
  if (!ids.length) return empty;
  const rows = await prisma.messages.findMany({
    where: { conversation_id: { in: ids } },
    orderBy: { created_at: 'asc' },
  });
  const messagesByConversation = {};
  const lastMessageByConversation = {};
  const unreadCountByConversation = {};
  for (const row of rows) {
    const message = mapMessageRow(row);
    const list = messagesByConversation[message.conversationId] || (messagesByConversation[message.conversationId] = []);
    list.push(message);
    lastMessageByConversation[message.conversationId] = message;
    if (!message.isRead && message.senderId !== user.id) {
      unreadCountByConversation[message.conversationId] =
        (unreadCountByConversation[message.conversationId] || 0) + 1;
    }
  }
  return { messagesByConversation, lastMessageByConversation, unreadCountByConversation };
}

export async function fetchMessages(user, conversationId) {
  await assertParticipant(user, conversationId);
  const rows = await prisma.messages.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: 'asc' },
  });
  return rows.map(mapMessageRow);
}

export async function sendMessageRow(user, conversationId, text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  await assertParticipant(user, conversationId);
  const row = await prisma.messages.create({
    data: { conversation_id: conversationId, sender_id: user.id, content: trimmed },
  });
  await prisma.conversations.update({
    where: { id: conversationId },
    data: { last_message_at: new Date() },
  });
  return mapMessageRow(row);
}

export async function markConversationRead(user, conversationId) {
  await assertParticipant(user, conversationId);
  await prisma.messages.updateMany({
    where: { conversation_id: conversationId, sender_id: { not: user.id }, is_read: false },
    data: { is_read: true },
  });
}

export async function findOrCreateConversation(user, storeId, context) {
  const store = await prisma.stores.findUnique({ where: { id: storeId } });
  if (!store) throw new HttpError(404, 'Toko tidak ditemukan.');
  const existing = await prisma.conversations.findFirst({
    where: { buyer_id: user.id, store_id: storeId },
  });
  if (existing) {
    if (context) {
      await prisma.conversations.update({ where: { id: existing.id }, data: { context } });
    }
    return existing.id;
  }
  const created = await prisma.conversations.create({
    data: { buyer_id: user.id, store_id: storeId, context: context || null },
  });
  return created.id;
}

export async function conversationMeta(user, conversationId) {
  const conv = await assertParticipant(user, conversationId);
  return { buyer_id: conv.buyer_id, store_id: conv.store_id, storeKind: conv.store.kind };
}

export async function chatEvents(user, since) {
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 4000);
  const { convos } = await userConversationIds(user.id);
  const ids = convos.map((c) => c.id);
  if (!ids.length) return { messages: [], conversations: [] };
  const messages = await prisma.messages.findMany({
    where: { conversation_id: { in: ids }, created_at: { gt: sinceDate } },
    orderBy: { created_at: 'asc' },
  });
  return {
    messages: messages.map(mapMessageRow),
    conversations: convos.filter((c) => c.created_at > sinceDate),
  };
}
