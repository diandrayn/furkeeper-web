import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from '@/lib/router';
import Navbar from '../components/Navbar';
import ChatInboxLayout from '../components/ChatInboxLayout';
import ChatWindow from '../components/ChatWindow';
import ChatEmptyState from '../components/ChatEmptyState';
import { useChat } from '../hooks/useChat';
import { useLanguage } from '../i18n/LanguageContext';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { conversations, messages, currentUserId, sendMessage, markConversationRead, buyerConversationsError } =
    useChat();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (conversationId) markConversationRead(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      if (filter === 'unread' && !(conv.unreadCount > 0)) return false;
      if (query.trim() && !conv.participant.name.toLowerCase().includes(query.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [conversations, filter, query]);

  const activeConversation = conversations.find((conv) => conv.id === conversationId) || null;
  const activeMessages = conversationId ? messages[conversationId] || [] : [];

  return (
    <>
      <Navbar />
      {/* The navbar is ~4rem tall, so the chat fills exactly the remaining
          viewport — otherwise the input row at the bottom (inside
          ChatInboxLayout) ends up off-screen and unreachable. */}
      <main className="mx-auto flex h-[calc(100dvh-4rem)] max-w-container min-h-0 flex-col px-4 pt-6 md:px-6 lg:px-8">
        <h1 className="mb-4 shrink-0 font-heading text-2xl font-bold text-text-primary">{t('chat.title')}</h1>
        {buyerConversationsError && (
          <div className="mb-4 shrink-0 rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger" role="alert">
            {buyerConversationsError}
          </div>
        )}
        <div className="min-h-0 flex-1">
          <ChatInboxLayout
            conversations={filteredConversations}
            activeConversationId={conversationId}
            onSelectConversation={(id) => navigate(`/chat/${id}`)}
            filter={filter}
            onFilterChange={setFilter}
            query={query}
            onQueryChange={setQuery}
            showListOnMobile={!conversationId}
            rightPanel={
              activeConversation ? (
                <ChatWindow
                  conversation={activeConversation}
                  messages={activeMessages}
                  currentUserId={currentUserId}
                  onSend={sendMessage}
                  onBack={() => navigate('/chat')}
                />
              ) : (
                <ChatEmptyState />
              )
            }
          />
        </div>
      </main>
    </>
  );
}