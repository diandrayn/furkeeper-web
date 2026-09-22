import { useState } from 'react';
import ImagePlaceholder from './ImagePlaceholder';
import Badge from './Badge';

// `images`, when provided (real seller products only have one photo today),
// takes priority and renders actual <img> tags. Falls back to the old
// placeholder-count behavior for the demo catalog, which has no real image.
export default function ImageGallery({ count = 4, images, badge, alt = 'Galeri produk' }) {
  const [active, setActive] = useState(0);
  const hasRealImages = Array.isArray(images) && images.length > 0;
  const thumbs = hasRealImages ? images : Array.from({ length: count }, (_, index) => index);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl">
        {hasRealImages ? (
          <img
            src={thumbs[active]}
            alt={`${alt} ${active + 1}`}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <ImagePlaceholder className="aspect-square w-full" alt={`${alt} ${active + 1}`} />
        )}
        {badge && (
          <div className="absolute left-3 top-3">
            <Badge variant={badge} />
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {thumbs.map((thumb, index) => (
          <button
            key={hasRealImages ? thumb : index}
            type="button"
            onClick={() => setActive(index)}
            className={`w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition-all duration-200 sm:w-20 ${
              active === index ? 'ring-brand-burgundy' : 'ring-transparent hover:ring-gray-300'
            }`}
            aria-label={`Lihat gambar ${index + 1}`}
          >
            {hasRealImages ? (
              <img src={thumb} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <ImagePlaceholder className="aspect-square w-full" alt="" showIcon={index === 0} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
