import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import ImagePlaceholder from './ImagePlaceholder';

export default function Lightbox({ open, index = 0, count = 1, onClose, onPrev, onNext, alt = 'Foto' }) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowLeft') onPrev?.();
      if (event.key === 'ArrowRight') onNext?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, onPrev, onNext]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Tutup lightbox"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl">
        <ImagePlaceholder className="aspect-[4/3] w-full rounded-2xl" alt={`${alt} ${index + 1}`} />
        <p className="mt-3 text-center text-sm text-white">
          {index + 1} / {count}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-text-primary"
        aria-label="Tutup"
      >
        <X className="h-5 w-5" />
      </button>
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text-primary"
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text-primary"
            aria-label="Foto berikutnya"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
