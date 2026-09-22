import { useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function MessageInput({ onSend }) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError('');
    try {
      await onSend(trimmed);
      setText('');
    } catch (err) {
      // Keep the draft so the user never loses what they typed, and tell
      // them why it didn't go through.
      setError(err?.message || t('chat.sendFailed'));
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white">
      <div className="flex items-center gap-2 p-3">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.messagePlaceholder')}
          aria-label={t('chat.messagePlaceholder')}
          className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand-orange-end focus:ring-2 focus:ring-brand-orange-end/30"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange-end text-white transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t('chat.sendLabel')}
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <p className="px-4 pb-2 text-xs font-medium text-status-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}