import { getInitials, formatRelativeTimeId } from '../utils/status';

export default function ConversationListItem({ conversation, active, onClick }) {
  const { participant, lastMessage, unreadCount } = conversation;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 ${
        active ? 'bg-brand-orange-end/10' : 'hover:bg-brand-peach/40'
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-burgundy text-sm font-bold text-white">
        {participant.avatarUrl ? (
          <img src={participant.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          getInitials(participant.name)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">{participant.name}</p>
          {lastMessage && (
            <span className="shrink-0 text-[11px] text-text-secondary">
              {formatRelativeTimeId(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-text-secondary">
            {lastMessage ? lastMessage.text : 'Belum ada pesan'}
          </p>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange-end px-1.5 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}