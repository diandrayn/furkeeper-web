import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageItems(current, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  if (start > 2) items.push('…');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < totalPages - 1) items.push('…');
  items.push(totalPages);
  return items;
}

export default function Pagination({
  page,
  pageSize,
  total,
  itemLabel = 'produk',
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">
        Menampilkan {start}-{end} dari {total} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors duration-200 hover:bg-white disabled:opacity-40"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageItems(page, totalPages).map((item, index) =>
          item === '…' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-text-secondary">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-medium transition-colors duration-200 ${
                item === page
                  ? 'bg-brand-burgundy text-white'
                  : 'text-text-secondary hover:bg-white'
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors duration-200 hover:bg-white disabled:opacity-40"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
