import { Search } from 'lucide-react';
import ConversationListItem from './ConversationListItem';
import { useLanguage } from '../i18n/LanguageContext';

export default function ChatInboxLayout({
  conversations,
  activeConversationId,
  onSelectConversation,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  showListOnMobile,
  rightPanel,
}) {
  const { t } = useLanguage();
  const filterTabs = [
    { id: 'all', label: t('chat.filterAll') },
    { id: 'unread', label: t('chat.filterUnread') },
  ];
  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div
        className={`flex w-full shrink-0 flex-col border-r border-gray-100 lg:flex lg:w-[360px] ${
          showListOnMobile ? 'flex' : 'hidden'
        }`}
      >
        <div className="space-y-3 border-b border-gray-100 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t('chat.searchPlaceholder')}
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand-orange-end focus:ring-2 focus:ring-brand-orange-end/30"
            />
          </div>
          <div className="flex gap-2 rounded-xl bg-brand-cream p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                  filter === tab.id
                    ? 'bg-white text-brand-burgundy shadow-sm'
                    : 'text-text-secondary hover:text-brand-burgundy'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-text-secondary">
              {t('chat.noConversations')}
            </p>
          ) : (
            conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className={`min-w-0 flex-1 ${showListOnMobile ? 'hidden lg:block' : 'block'}`}>
        {rightPanel}
      </div>
    </div>
  );
}