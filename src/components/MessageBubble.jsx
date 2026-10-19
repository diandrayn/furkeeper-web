import { formatRelativeTimeId } from '../utils/status';

export default function MessageBubble({ text, timestamp, isMine }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isMine
              ? 'rounded-br-sm bg-brand-orange-end text-white'
              : 'rounded-bl-sm bg-gray-100 text-text-primary'
          }`}
        >
          {text}
        </div>
        <span className="mt-1 px-1 text-[11px] text-text-secondary" suppressHydrationWarning>
          {formatRelativeTimeId(timestamp)}
        </span>
      </div>
    </div>
  );
}