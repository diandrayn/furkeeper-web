import { MessageCircle } from 'lucide-react';
import Button from './Button';

export default function StickyActionBar({
  onChat,
  onPrimary,
  chatLabel = 'Chat',
  primaryLabel = 'Booking Sekarang',
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-container gap-3">
        <Button variant="outline" onClick={onChat} icon={<MessageCircle className="h-4 w-4" />}>
          {chatLabel}
        </Button>
        <Button variant="primary" className="flex-1" onClick={onPrimary}>
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}
