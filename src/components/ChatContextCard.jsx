import { Link } from '@/lib/router';
import { ChevronRight } from 'lucide-react';
import ImagePlaceholder from './ImagePlaceholder';

export default function ChatContextCard({ context }) {
  if (!context) return null;

  return (
    <Link
      to={context.linkTo}
      className="flex items-center gap-3 border-b border-gray-100 bg-brand-cream/60 px-4 py-2.5 transition-colors duration-200 hover:bg-brand-peach/50"
    >
      {context.thumbnail ? (
        <img src={context.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
      ) : (
        <ImagePlaceholder className="h-10 w-10 shrink-0 rounded-lg" showIcon={false} />
      )}
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{context.title}</p>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
    </Link>
  );
}