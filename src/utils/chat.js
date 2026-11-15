import { apiGet, apiPatch, apiPost } from '../lib/apiClient';

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function fetchBuyerConversations() {
  return apiGet('/api/chat');
}

export function fetchStoreConversations(storeId) {
  return apiGet('/api/chat', { view: 'store', storeId });
}

export function fetchThreadsSummary(conversationIds) {
  return apiPost('/api/chat', { action: 'summary', conversationIds });
}

export function fetchMessages(conversationId) {
  return apiGet(`/api/chat/${encodeURIComponent(conversationId)}`);
}

export function sendMessageRow(conversationId, _senderId, text) {
  return apiPost(`/api/chat/${encodeURIComponent(conversationId)}`, { text });
}

export function markConversationRead(conversationId) {
  return apiPatch(`/api/chat/${encodeURIComponent(conversationId)}`, {});
}

export async function findOrCreateConversation(_buyerId, storeId, context) {
  const { id } = await apiPost('/api/chat', { action: 'create', storeId, context });
  return id;
}

export function subscribeToChat(handlers) {
  let active = true;
  let since = new Date().toISOString();
  let inFlight = false;

  const poll = async () => {
    if (!active || inFlight) return;
    inFlight = true;
    try {
      const { messages, conversations } = await apiGet('/api/chat', { view: 'events', since });
      if (!active) return;
      for (const conversation of conversations) handlers.onConversationInsert?.(conversation);
      for (const message of messages) handlers.onMessageInsert(message);
      since = new Date().toISOString();
    } catch (error) {
      if (active) console.error('Gagal memperbarui percakapan:', error);
    } finally {
      inFlight = false;
    }
  };

  const timer = window.setInterval(poll, 5000);
  void poll();

  return () => {
    active = false;
    window.clearInterval(timer);
  };
}
