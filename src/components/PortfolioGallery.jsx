import { useState } from 'react';
import ImagePlaceholder from './ImagePlaceholder';
import Lightbox from './Lightbox';

export default function PortfolioGallery({ images = [], alt = 'Galeri hasil kerja' }) {
  const count = images.length || 8;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = (nextIndex) => {
    setIndex(nextIndex);
    setOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }, (_, itemIndex) => (
          <button
            key={itemIndex}
            type="button"
            onClick={() => openAt(itemIndex)}
            className="overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
            aria-label={`Buka ${alt} ${itemIndex + 1}`}
          >
            <ImagePlaceholder className="aspect-square w-full" alt={`${alt} ${itemIndex + 1}`} />
          </button>
        ))}
      </div>
      <Lightbox
        open={open}
        index={index}
        count={count}
        alt={alt}
        onClose={() => setOpen(false)}
        onPrev={() => setIndex((current) => (current - 1 + count) % count)}
        onNext={() => setIndex((current) => (current + 1) % count)}
      />
    </>
  );
}
