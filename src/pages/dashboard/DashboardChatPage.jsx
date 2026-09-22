import { useEffect, useMemo, useState } from 'react';
import ChatInboxLayout from '../../components/ChatInboxLayout';
import ChatWindow from '../../components/ChatWindow';
import ChatEmptyState from '../../components/ChatEmptyState';
import { useChat } from '../../hooks/useChat';
import { useDashboard } from '../../hooks/useDashboard';

export default function DashboardChatPage({ mode }) {
  const { storeId, serviceStoreId } = useDashboard();
  const activeStoreId = mode === 'jasa' ? serviceStoreId : storeId;

  const {
    storeConversations,
    messages,
    currentUserId,
    sendMessage,
    markConversationRead,
    loadStoreConversations,
    storeConversationsError,
  } = useChat();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    loadStoreConversations(activeStoreId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoreId]);

  const filteredConversations = useMemo(() => {
    return storeConversations.filter((conv) => {
      if (filter === 'unread' && !(conv.unreadCount > 0)) return false;
      if (query.trim() && !conv.participant.name.toLowerCase().includes(query.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [storeConversations, filter, query]);

  const activeConversation = storeConversations.find((conv) => conv.id === activeId) || null;
  const activeMessages = activeId ? messages[activeId] || [] : [];

  const handleSelect = (id) => {
    setActiveId(id);
    markConversationRead(id);
  };

  if (!activeStoreId) {
    return (
      // Dashboard header is ~4rem tall — fill the rest of the viewport so
      // the chat panel (and its input row) stay fully on screen.
      <div className="-mx-4 -my-6 flex h-[calc(100dvh-4rem)] items-center justify-center px-4 py-4 md:-mx-6 md:-my-8 md:px-6 md:py-6">
        <ChatEmptyState />
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 h-[calc(100dvh-4rem)] px-4 py-4 md:-mx-6 md:-my-8 md:px-6 md:py-6">
      {storeConversationsError && (
        <div className="mb-4 rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger" role="alert">
          {storeConversationsError}
        </div>
      )}
      <ChatInboxLayout
        conversations={filteredConversations}
        activeConversationId={activeId}
        onSelectConversation={handleSelect}
        filter={filter}
        onFilterChange={setFilter}
        query={query}
        onQueryChange={setQuery}
        showListOnMobile={!activeId}
        rightPanel={
          activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              messages={activeMessages}
              currentUserId={currentUserId}
              onSend={sendMessage}
              onBack={() => setActiveId(null)}
            />
          ) : (
            <ChatEmptyState />
          )
        }
      />
    </div>
  );
}