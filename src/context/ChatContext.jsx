import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from './NotificationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import {
  fetchBuyerConversations,
  fetchStoreConversations,
  fetchThreadsSummary,
  sendMessageRow,
  markConversationRead as markConversationReadRow,
  findOrCreateConversation as findOrCreateConversationRow,
  subscribeToChat,
} from '../utils/chat';
import { ensureMyStore } from '../utils/products';
import { ensureMyServiceStore } from '../utils/services';

const ChatContext = createContext(null);

function byLastMessage(a, b) {
  const at = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
  const bt = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
  return bt - at;
}

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const { pushNotification } = useNotifications();
  const { t } = useLanguage();
  const currentUserId = user?.id || null;
  const isSeller = user?.sellerStatus === 'active';
  const isProvider = user?.providerStatus === 'active';

  // Every message we've loaded so far, keyed by conversation id — shared
  // between the buyer inbox (/chat) and the store inbox
  // (/dashboard/*/pesan), since a conversation only ever has one thread.
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [unreadByConversation, setUnreadByConversation] = useState({});

  const [buyerConversations, setBuyerConversations] = useState([]);
  // Starts true: the mount effect always refreshes the buyer inbox, and the
  // loading flag is only flipped in async continuations (the
  // react-hooks/set-state-in-effect lint rule rejects setState before the
  // first await inside an effect-invoked function).
  const [isLoadingBuyerConversations, setIsLoadingBuyerConversations] = useState(true);
  const [buyerConversationsError, setBuyerConversationsError] = useState(null);

  // Store inboxes, keyed by store id. The dashboard "Pesan" tab works on
  // one store at a time (toko vs jasa), but the navbar badge needs unread
  // across ALL of the user's stores, so we keep every store's inbox here.
  const [storeInboxByStore, setStoreInboxByStore] = useState({});
  const [storeConversationsError, setStoreConversationsError] = useState(null);
  const [loadedStoreId, setLoadedStoreId] = useState(null);
  const [myStoreIds, setMyStoreIds] = useState([]);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const unsubscribeRef = useRef(null);

  // --- Chat → push notification -------------------------------------------
  // Incoming messages surface as an OS-style notification + toast (unread
  // badge via NotificationContext). Where the notification links depends on
  // which side of the conversation the current user is on: buyers go to the
  // /chat inbox, store owners to their dashboard's "Pesan" tab. The role of
  // a conversation never changes, so hrefs are cached per conversation id.
  const myStoreIdsRef = useRef([]);
  const chatHrefCache = useRef(new Map());
  const notifiedMessageIds = useRef(new Set());
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    myStoreIdsRef.current = myStoreIds;
  }, [myStoreIds]);

  const getChatHref = useCallback(
    async (conversationId) => {
      const cached = chatHrefCache.current.get(conversationId);
      if (cached) return cached;
      let href = `/chat/${conversationId}`;
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select('buyer_id, store_id')
          .eq('id', conversationId)
          .maybeSingle();
        if (conv && conv.buyer_id !== currentUserId && myStoreIdsRef.current.includes(conv.store_id)) {
          const { data: st } = await supabase
            .from('stores')
            .select('kind')
            .eq('id', conv.store_id)
            .maybeSingle();
          href = st?.kind === 'service' ? '/dashboard/jasa/pesan' : '/dashboard/toko/pesan';
        }
      } catch {
        href = `/chat/${conversationId}`;
      }
      chatHrefCache.current.set(conversationId, href);
      return href;
    },
    [currentUserId],
  );

  const notifyIncomingMessage = useCallback(
    (message) => {
      if (!message?.id || notifiedMessageIds.current.has(message.id)) return;
      notifiedMessageIds.current.add(message.id);
      getChatHref(message.conversationId).then((linkTo) => {
        pushNotification({
          id: `chat-${message.id}`,
          type: 'chat',
          title: tRef.current('notifications.chatPushTitle'),
          message: tRef.current('notifications.chatPushBody'),
          linkTo,
          timestamp: message.timestamp || new Date().toISOString(),
          isRead: false,
        });
      });
    },
    [getChatHref, pushNotification],
  );

  // --- Buyer inbox -------------------------------------------------------
  // The apply* helpers exist because they're only ever reached from async
  // contexts (promise callbacks / event handlers). Called directly from an
  // effect body they'd trip react-hooks/set-state-in-effect, which treats a
  // delegated call as synchronous even though the setState only runs after
  // awaited fetches.
  const applyBuyerInbox = useCallback((list, summary) => {
    setBuyerConversationsError(null);
    setMessagesByConversation((prev) => ({ ...prev, ...summary.messagesByConversation }));
    setUnreadByConversation((prev) => ({ ...prev, ...summary.unreadCountByConversation }));
    setBuyerConversations(
      list.map((c) => ({ ...c, lastMessage: summary.lastMessageByConversation[c.id] || null })),
    );
  }, []);

  // Load the buyer inbox on login. Everything that touches state runs in
  // .then/.catch/.finally callbacks, which the lint rule treats as async.
  useEffect(() => {
    if (!currentUserId) return undefined;
    let active = true;
    fetchBuyerConversations(currentUserId)
      .then((list) =>
        fetchThreadsSummary(list.map((c) => c.id), currentUserId).then((summary) => ({ list, summary })),
      )
      .then(({ list, summary }) => {
        if (active) applyBuyerInbox(list, summary);
      })
      .catch((err) => {
        // Most likely cause: supabase/chat_and_account_upgrade.sql hasn't
        // been run yet, so the `context` column this query selects doesn't
        // exist — without this catch that error vanished as an unhandled
        // promise rejection and the inbox just looked permanently empty.
        if (!active) return;
        console.error('fetchBuyerConversations failed:', err);
        setBuyerConversationsError(err.message || 'Gagal memuat chat.');
      })
      .finally(() => {
        if (active) setIsLoadingBuyerConversations(false);
      });
    return () => {
      active = false;
    };
  }, [currentUserId, applyBuyerInbox]);

  const refreshBuyerConversations = useCallback(async () => {
    if (!currentUserId) return;
    const list = await fetchBuyerConversations(currentUserId);
    const summary = await fetchThreadsSummary(list.map((c) => c.id), currentUserId);
    applyBuyerInbox(list, summary);
  }, [currentUserId, applyBuyerInbox]);

  // --- Store inboxes (all of the user's stores) --------------------------
  const applyStoreInbox = useCallback((storeId, list, summary) => {
    setStoreConversationsError(null);
    setMessagesByConversation((prev) => ({ ...prev, ...summary.messagesByConversation }));
    setUnreadByConversation((prev) => ({ ...prev, ...summary.unreadCountByConversation }));
    setStoreInboxByStore((prev) => ({
      ...prev,
      [storeId]: list.map((c) => ({
        ...c,
        lastMessage: summary.lastMessageByConversation[c.id] || null,
      })),
    }));
    setLoadedStoreId(storeId);
  }, []);

  const loadStoreConversations = useCallback(
    async (storeId) => {
      if (!storeId) return;
      const list = await fetchStoreConversations(storeId);
      const summary = await fetchThreadsSummary(list.map((c) => c.id), currentUserId);
      applyStoreInbox(storeId, list, summary);
    },
    [currentUserId, applyStoreInbox],
  );

  // The store ids this user owns (toko + jasa). Pure data helper — called
  // from the effect below and reused to route incoming conversations.
  const resolveOwnStoreIds = useCallback(async () => {
    const storeIds = [];
    try {
      if (isSeller) storeIds.push(await ensureMyStore(user));
      if (isProvider) storeIds.push(await ensureMyServiceStore(user));
    } catch (err) {
      console.error('Failed to resolve own stores for chat:', err);
    }
    return [...new Set(storeIds.filter(Boolean))];
  }, [isSeller, isProvider, user]);

  // Load every store the user owns (toko + jasa) so the navbar badge
  // counts store-side unread even before the "Pesan" tab is ever opened.
  useEffect(() => {
    if (!currentUserId) return undefined;
    let active = true;
    const loadStore = (storeId) =>
      fetchStoreConversations(storeId)
        .then((list) =>
          fetchThreadsSummary(list.map((c) => c.id), currentUserId).then((summary) => ({ storeId, list, summary })),
        )
        .catch((err) => {
          console.error('fetchStoreConversations failed:', err);
          if (active) setStoreConversationsError(err.message || 'Gagal memuat chat.');
          return null;
        });
    resolveOwnStoreIds()
      .then((unique) => Promise.all(unique.map(loadStore)))
      .then((results) => {
        if (!active) return;
        results.forEach((result) => {
          if (result) applyStoreInbox(result.storeId, result.list, result.summary);
        });
        setMyStoreIds(results.map((result) => result.storeId));
      });
    return () => {
      active = false;
    };
  }, [currentUserId, resolveOwnStoreIds, applyStoreInbox]);

  const storeConversations = useMemo(
    () => (loadedStoreId ? storeInboxByStore[loadedStoreId] : []),
    [loadedStoreId, storeInboxByStore],
  );

  // --- Single realtime feed for the whole user ---------------------------
  // Previously each open conversation got its own subscription, so the
  // navbar badge ignored store-side unread and any message landing in a
  // conversation that wasn't the one open right now never lit up.
  useEffect(() => {
    if (!currentUserId) return undefined;
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    unsubscribeRef.current = subscribeToChat({
      onMessageInsert: (message) => {
        setMessagesByConversation((prev) => {
          const existing = prev[message.conversationId] || [];
          if (existing.some((m) => m.id === message.id)) return prev;
          return { ...prev, [message.conversationId]: [...existing, message] };
        });
        if (message.senderId !== currentUserId) {
          setUnreadByConversation((prev) => ({
            ...prev,
            [message.conversationId]: (prev[message.conversationId] || 0) + 1,
          }));
          notifyIncomingMessage(message);
        }
        const bump = (list) =>
          list.some((c) => c.id === message.conversationId)
            ? list.map((c) => (c.id === message.conversationId ? { ...c, lastMessage: message } : c))
            : list;
        setBuyerConversations((prev) => bump(prev));
        setStoreInboxByStore((prev) => {
          const next = {};
          for (const [storeId, list] of Object.entries(prev)) next[storeId] = bump(list);
          return next;
        });
      },
      onMessageUpdate: (message, old) => {
        // The reader ran mark_conversation_read() somewhere else — flip the
        // stored is_read flag and drop that conversation's unread badge.
        setMessagesByConversation((prev) => {
          const list = prev[message.conversationId];
          if (!list) return prev;
          return {
            ...prev,
            [message.conversationId]: list.map((m) => (m.id === message.id ? { ...m, isRead: message.isRead } : m)),
          };
        });
        if (old?.isRead === false && message.isRead === true && message.senderId !== currentUserId) {
          setUnreadByConversation((prev) => {
            const value = prev[message.conversationId] || 0;
            return value > 0 ? { ...prev, [message.conversationId]: value - 1 } : prev;
          });
        }
      },
      onConversationInsert: (row) => {
        if (row.buyer_id === currentUserId) {
          refreshBuyerConversations();
        }
        if (myStoreIds.includes(row.store_id)) {
          loadStoreConversations(row.store_id);
        }
      },
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUserId, refreshBuyerConversations, loadStoreConversations, myStoreIds, notifyIncomingMessage]);

  const openConversation = useCallback((conversationId) => {
    setActiveConversationId(conversationId);
  }, []);

  const markConversationRead = useCallback(
    async (conversationId) => {
      openConversation(conversationId);
      if (!conversationId || !currentUserId) return;
      setUnreadByConversation((prev) => ({ ...prev, [conversationId]: 0 }));
      try {
        await markConversationReadRow(conversationId);
        // Re-fetch this thread so the badge reflects what the DB actually
        // has — and stays cleared after a reload.
        const summary = await fetchThreadsSummary([conversationId], currentUserId);
        setMessagesByConversation((prev) => ({ ...prev, ...summary.messagesByConversation }));
        setUnreadByConversation((prev) => ({ ...prev, ...summary.unreadCountByConversation }));
      } catch {
        // best-effort — a stale unread badge isn't worth surfacing an error for
      }
    },
    [currentUserId, openConversation],
  );

  const sendMessage = useCallback(
    async (conversationId, text) => {
      if (!currentUserId || !conversationId) return;
      const message = await sendMessageRow(conversationId, currentUserId, text);
      if (!message) return;
      setMessagesByConversation((prev) => {
        const existing = prev[conversationId] || [];
        if (existing.some((m) => m.id === message.id)) return prev;
        return { ...prev, [conversationId]: [...existing, message] };
      });
      const bump = (list) =>
        list.some((c) => c.id === conversationId)
          ? list.map((c) => (c.id === conversationId ? { ...c, lastMessage: message } : c))
          : list;
      setBuyerConversations((prev) => bump(prev));
      setStoreInboxByStore((prev) => {
        const next = {};
        for (const [storeId, list] of Object.entries(prev)) next[storeId] = bump(list);
        return next;
      });
    },
    [currentUserId],
  );

  // Called from product/service detail pages — starts (or reopens) a chat
  // with that store's owner, as the current user acting as a buyer.
  const findOrCreateConversation = useCallback(
    async (storeId, context) => {
      if (!currentUserId) {
        throw new Error('Kamu harus masuk untuk memulai chat.');
      }
      const id = await findOrCreateConversationRow(currentUserId, storeId, context);
      await refreshBuyerConversations();
      return id;
    },
    [currentUserId, refreshBuyerConversations],
  );

  const withMeta = useCallback(
    (list) =>
      list
        .map((c) => ({
          ...c,
          unreadCount: unreadByConversation[c.id] || 0,
        }))
        .sort(byLastMessage),
    [unreadByConversation],
  );

  const conversationsWithMeta = useMemo(() => withMeta(buyerConversations), [withMeta, buyerConversations]);
  const storeConversationsWithMeta = useMemo(() => withMeta(storeConversations), [withMeta, storeConversations]);

  // Buyer unread + unread across every store the user owns.
  const totalUnreadCount = useMemo(() => {
    const ids = new Set([
      ...buyerConversations.map((c) => c.id),
      ...Object.values(storeInboxByStore).flat().map((c) => c.id),
    ]);
    let total = 0;
    ids.forEach((id) => {
      total += unreadByConversation[id] || 0;
    });
    return total;
  }, [buyerConversations, storeInboxByStore, unreadByConversation]);

  const getConversation = useCallback(
    (id) =>
      conversationsWithMeta.find((c) => c.id === id) ||
      storeConversationsWithMeta.find((c) => c.id === id) ||
      null,
    [conversationsWithMeta, storeConversationsWithMeta],
  );

  const value = useMemo(
    () => ({
      currentUserId,
      conversations: conversationsWithMeta,
      storeConversations: storeConversationsWithMeta,
      messages: messagesByConversation,
      activeConversationId,
      totalUnreadCount,
      isLoadingBuyerConversations,
      buyerConversationsError,
      storeConversationsError,
      loadedStoreId,
      sendMessage,
      markConversationRead,
      openConversation,
      findOrCreateConversation,
      loadStoreConversations,
      getConversation,
    }),
    [
      currentUserId,
      conversationsWithMeta,
      storeConversationsWithMeta,
      messagesByConversation,
      activeConversationId,
      totalUnreadCount,
      isLoadingBuyerConversations,
      buyerConversationsError,
      storeConversationsError,
      loadedStoreId,
      sendMessage,
      markConversationRead,
      openConversation,
      findOrCreateConversation,
      loadStoreConversations,
      getConversation,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}