import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getInitials } from '../utils/status';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ChatContextCard from './ChatContextCard';
import { useLanguage } from '../i18n/LanguageContext';

export default function ChatWindow({ conversation, messages, currentUserId, onSend, onBack }) {
  const scrollRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, conversation?.id]);

  if (!conversation) return null;

  const { participant } = conversation;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-brand-peach hover:text-brand-burgundy lg:hidden"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-burgundy text-xs font-bold text-white">
          {participant.avatarUrl ? (
            <img src={participant.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            getInitials(participant.name)
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold text-text-primary">{participant.name}</p>
        </div>
      </div>

      <ChatContextCard context={conversation.context} />

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            text={message.text}
            timestamp={message.timestamp}
            isMine={message.senderId === currentUserId}
          />
        ))}
      </div>

      <MessageInput onSend={(text) => onSend(conversation.id, text)} />
    </div>
  );
}